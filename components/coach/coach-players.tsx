"use client"

import { useState } from "react"
import { getEvaluationsForPlayer } from "@/app/actions/coach"
import { EvaluationDialog } from "@/components/coach/evaluation-dialog"
import { SKILL_CATEGORIES } from "@/lib/coach-utils"
import type { CoachPlayer } from "@/app/actions/coach"

type Evaluation = {
  id: number
  evalDate: string
  skills: Record<string, number>
  comments: string
  overallRating: number
  recommendations: string
}

export function CoachPlayers({ players }: { players: CoachPlayer[] }) {
  const [query, setQuery] = useState("")
  const [evaluating, setEvaluating] = useState<CoachPlayer | null>(null)
  const [historyFor, setHistoryFor] = useState<number | null>(null)
  const [history, setHistory] = useState<Record<number, Evaluation[]>>({})
  const [loadingHistory, setLoadingHistory] = useState(false)

  const filtered = players.filter((p) =>
    `${p.childName} ${p.parentName} ${p.club} ${p.schoolName ?? ""} ${p.packageName}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  )

  async function toggleHistory(id: number) {
    if (historyFor === id) {
      setHistoryFor(null)
      return
    }
    setHistoryFor(id)
    if (!history[id]) {
      setLoadingHistory(true)
      const evals = (await getEvaluationsForPlayer(id)) as unknown as Evaluation[]
      setHistory((h) => ({ ...h, [id]: evals }))
      setLoadingHistory(false)
    }
  }

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search players, parents, venues…"
        className="mb-4 w-full rounded-md border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-lime"
      />

      {filtered.length === 0 ? (
        <div className="rounded-card border border-dashed border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {players.length === 0 ? "No players are assigned to you yet." : "No players match your search."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <div key={p.enrollmentId} className="rounded-card border border-border bg-card">
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-navy">{p.childName}</p>
                    <span className="text-xs text-muted-foreground">Age {p.childAge}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {p.packageName} · {p.schoolName ?? p.club}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Parent: {p.parentName} · {p.parentMobile}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleHistory(p.enrollmentId)}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-navy hover:bg-muted"
                  >
                    {historyFor === p.enrollmentId ? "Hide history" : "History"}
                  </button>
                  <button
                    onClick={() => setEvaluating(p)}
                    className="rounded-md bg-lime px-3 py-1.5 text-xs font-bold text-lime-foreground hover:bg-lime/90"
                  >
                    Evaluate
                  </button>
                </div>
              </div>

              {historyFor === p.enrollmentId && (
                <div className="border-t border-border bg-muted/30 px-4 py-3">
                  {loadingHistory && !history[p.enrollmentId] ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                  ) : (history[p.enrollmentId]?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">No evaluations yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {history[p.enrollmentId].map((ev) => (
                        <div key={ev.id} className="rounded-md border border-border bg-card p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-muted-foreground">
                              {new Date(ev.evalDate).toLocaleDateString()}
                            </p>
                            <span className="rounded-full bg-navy px-2 py-0.5 text-xs font-bold text-white">
                              {ev.overallRating}/5
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {SKILL_CATEGORIES.map((cat) =>
                              ev.skills?.[cat.key] ? (
                                <span key={cat.key} className="rounded-full bg-lime/10 px-2 py-0.5 text-[10px] font-semibold text-lime-700">
                                  {cat.label}: {ev.skills[cat.key]}
                                </span>
                              ) : null,
                            )}
                          </div>
                          {ev.comments && <p className="mt-2 text-xs text-navy">{ev.comments}</p>}
                          {ev.recommendations && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              <span className="font-semibold">Next: </span>
                              {ev.recommendations}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {evaluating && <EvaluationDialog player={evaluating} onClose={() => setEvaluating(null)} />}
    </div>
  )
}
