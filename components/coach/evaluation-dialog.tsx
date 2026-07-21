"use client"

import { useState, useTransition } from "react"
import { saveEvaluation } from "@/app/actions/coach"
import { SKILL_CATEGORIES } from "@/lib/coach-utils"
import type { CoachPlayer } from "@/app/actions/coach"

export function EvaluationDialog({ player, onClose }: { player: CoachPlayer; onClose: () => void }) {
  const [skills, setSkills] = useState<Record<string, number>>({})
  const [overall, setOverall] = useState(0)
  const [comments, setComments] = useState("")
  const [recommendations, setRecommendations] = useState("")
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  function submit() {
    startTransition(async () => {
      await saveEvaluation({
        enrollmentId: player.enrollmentId,
        skills,
        comments,
        overallRating: overall,
        recommendations,
      })
      setDone(true)
      setTimeout(onClose, 900)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-5 shadow-xl sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-navy">Evaluate {player.childName}</h2>
            <p className="text-xs text-muted-foreground">{player.packageName} · Age {player.childAge}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Close">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {done ? (
          <div className="py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-lime/20">
              <svg className="h-6 w-6 text-lime-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="mt-3 font-semibold text-navy">Evaluation saved</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {SKILL_CATEGORIES.map((cat) => (
                <div key={cat.key} className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-navy">{cat.label}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setSkills((s) => ({ ...s, [cat.key]: n }))}
                        className={`h-7 w-7 rounded-md text-xs font-bold transition-colors ${
                          (skills[cat.key] ?? 0) >= n ? "bg-lime text-lime-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-border pt-4">
              <span className="text-sm font-semibold text-navy">Overall Rating</span>
              <div className="mt-1.5 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setOverall(n)}
                    className={`flex-1 rounded-md py-2 text-sm font-bold transition-colors ${
                      overall >= n ? "bg-navy text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-semibold text-navy">Comments</span>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={2}
                placeholder="What went well, areas observed…"
                className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-lime"
              />
            </label>

            <label className="mt-3 block">
              <span className="text-sm font-semibold text-navy">Recommendations</span>
              <textarea
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                rows={2}
                placeholder="What to work on next…"
                className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-lime"
              />
            </label>

            <div className="mt-5 flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-md border border-border py-2.5 font-semibold text-navy hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={pending || overall === 0}
                className="flex-1 rounded-md bg-lime py-2.5 font-bold text-lime-foreground hover:bg-lime/90 disabled:opacity-50"
              >
                {pending ? "Saving…" : "Save Evaluation"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
