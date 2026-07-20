"use server"

import { db } from "@/lib/db"
import { enrollments, sessionAttendance, playerEvaluations, coaches } from "@/lib/db/schema"
import { eq, desc, and } from "drizzle-orm"

export type AttendanceStat = {
  total: number
  present: number
  absent: number
  late: number
  excused: number
  attendanceRate: number // 0-100
}

export type EvaluationView = {
  id: number
  evalDate: string
  coachName: string
  skills: Record<string, number>
  comments: string
  overallRating: number
  recommendations: string
}

export type RecentAttendance = {
  sessionDate: string
  status: string
  note: string
}

export type ChildProgress = {
  stats: AttendanceStat
  recent: RecentAttendance[]
  evaluations: EvaluationView[]
}

/**
 * Fetches attendance stats and evaluations for a single enrollment.
 * Verifies the enrollment belongs to the given userId before returning data
 * (per-query userId scoping — there is no RLS on Neon + Better Auth).
 */
export async function getChildProgress(enrollmentId: number, userId: string): Promise<ChildProgress | null> {
  // Ownership check — the enrollment must belong to this parent
  const [enrollment] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.id, enrollmentId), eq(enrollments.userId, userId)))
    .limit(1)

  if (!enrollment) return null

  const [attendanceRows, evalRows] = await Promise.all([
    db
      .select()
      .from(sessionAttendance)
      .where(eq(sessionAttendance.enrollmentId, enrollmentId))
      .orderBy(desc(sessionAttendance.sessionDate)),
    db
      .select({
        id: playerEvaluations.id,
        evalDate: playerEvaluations.evalDate,
        skills: playerEvaluations.skills,
        comments: playerEvaluations.comments,
        overallRating: playerEvaluations.overallRating,
        recommendations: playerEvaluations.recommendations,
        coachName: coaches.name,
      })
      .from(playerEvaluations)
      .leftJoin(coaches, eq(playerEvaluations.coachId, coaches.id))
      .where(eq(playerEvaluations.enrollmentId, enrollmentId))
      .orderBy(desc(playerEvaluations.evalDate)),
  ])

  const present = attendanceRows.filter((r) => r.status === "present").length
  const absent = attendanceRows.filter((r) => r.status === "absent").length
  const late = attendanceRows.filter((r) => r.status === "late").length
  const excused = attendanceRows.filter((r) => r.status === "excused").length
  const total = attendanceRows.length
  // Present + late count as "attended" for the rate
  const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0

  return {
    stats: { total, present, absent, late, excused, attendanceRate },
    recent: attendanceRows.slice(0, 6).map((r) => ({
      sessionDate: String(r.sessionDate),
      status: r.status,
      note: r.note,
    })),
    evaluations: evalRows.map((e) => ({
      id: e.id,
      evalDate: String(e.evalDate),
      coachName: e.coachName ?? "Coach",
      skills: (e.skills as Record<string, number>) ?? {},
      comments: e.comments,
      overallRating: e.overallRating,
      recommendations: e.recommendations,
    })),
  }
}
