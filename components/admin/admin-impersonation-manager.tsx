"use client"

import { useState, useTransition } from "react"
import { Search, User, Eye, Pencil, LogIn, Shield, Clock, X, ChevronRight } from "lucide-react"
import { searchParents } from "@/app/actions/impersonation"
import type { ParentSearchResult, ImpersonationMode } from "@/lib/impersonation"

type Step = "search" | "confirm"

export function AdminImpersonationManager() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ParentSearchResult[]>([])
  const [searched, setSearched] = useState(false)
  const [selected, setSelected] = useState<ParentSearchResult | null>(null)
  const [mode, setMode] = useState<ImpersonationMode>("view-only")
  const [reason, setReason] = useState("")
  const [step, setStep] = useState<Step>("search")
  const [error, setError] = useState<string | null>(null)
  const [isSearching, startSearch] = useTransition()
  const [isStarting, startStarting] = useTransition()

  function handleSearch() {
    setError(null)
    startSearch(async () => {
      const rows = await searchParents(query)
      setResults(rows)
      setSearched(true)
    })
  }

  function handleSelect(parent: ParentSearchResult) {
    setSelected(parent)
    setStep("confirm")
    setError(null)
  }

  function handleBack() {
    setStep("search")
    setSelected(null)
    setError(null)
  }

  function handleLaunch() {
    if (!selected) return
    setError(null)
    startStarting(async () => {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: selected.id, mode, reason: reason || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Failed to start impersonation")
        return
      }
      // Redirect to the parent dashboard
      window.location.href = "/dashboard"
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="font-bold text-amber-800">Restricted Admin Feature</p>
          <p className="mt-0.5 text-sm text-amber-700">
            This tool allows you to view a parent&apos;s portal as they see it. Every session is fully
            audited. Do not share impersonation sessions or use them to make permanent changes without
            parental consent.
          </p>
        </div>
      </div>

      {step === "search" && (
        <div className="space-y-5">
          {/* Search box */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-navy">
              Search parents by name or email
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSearch()
                  }}
                  placeholder="Name, surname or email address..."
                  className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm text-navy placeholder:text-muted-foreground focus:border-lime focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleSearch}
                disabled={isSearching || query.trim().length < 2}
                className="rounded-xl bg-navy px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-navy/80 disabled:opacity-50"
              >
                {isSearching ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          {/* Results */}
          {searched && results.length === 0 && (
            <p className="rounded-xl border border-dashed border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
              No parents found matching &quot;{query}&quot;. Try a different name or email.
            </p>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {results.length} result{results.length !== 1 ? "s" : ""} found
              </p>
              <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
                {results.map((parent) => (
                  <button
                    key={parent.id}
                    type="button"
                    onClick={() => handleSelect(parent)}
                    className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy/10 text-sm font-black text-navy">
                      {parent.name[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-navy">{parent.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{parent.email}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(parent.createdAt).toLocaleDateString("en-ZA", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {step === "confirm" && selected && (
        <div className="space-y-5">
          {/* Selected parent */}
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy text-base font-black text-white">
              {selected.name[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-navy">{selected.name}</p>
              <p className="text-sm text-muted-foreground">{selected.email}</p>
              <p className="text-xs text-muted-foreground">
                Registered{" "}
                {new Date(selected.createdAt).toLocaleDateString("en-ZA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={handleBack}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-navy hover:text-navy"
            >
              Change
            </button>
          </div>

          {/* Mode selection */}
          <div>
            <p className="mb-3 text-sm font-semibold text-navy">Session mode</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${
                  mode === "view-only"
                    ? "border-lime bg-lime/10"
                    : "border-border bg-card hover:border-lime/50"
                }`}
              >
                <input
                  type="radio"
                  name="mode"
                  value="view-only"
                  checked={mode === "view-only"}
                  onChange={() => setMode("view-only")}
                  className="mt-0.5 accent-lime"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-navy">
                    <Eye className="h-4 w-4" />
                    View Only
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Forms are read-only. No changes can be saved. Recommended for troubleshooting.
                  </p>
                </div>
              </label>

              <label
                className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${
                  mode === "full"
                    ? "border-lime bg-lime/10"
                    : "border-border bg-card hover:border-lime/50"
                }`}
              >
                <input
                  type="radio"
                  name="mode"
                  value="full"
                  checked={mode === "full"}
                  onChange={() => setMode("full")}
                  className="mt-0.5 accent-lime"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-navy">
                    <Pencil className="h-4 w-4" />
                    Full Testing Mode
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Full interaction — can modify profile, slots, etc. Use with caution.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-navy">
              Reason <span className="font-normal text-muted-foreground">(optional — recorded in audit log)</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Parent reported issue with enrollment #1234"
              className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-navy placeholder:text-muted-foreground focus:border-lime focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-muted/40"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleLaunch}
              disabled={isStarting}
              className="flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-navy/80 disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {isStarting ? "Opening portal..." : "View Parent Portal"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Small stat used in the tab label ----
export function ImpersonationTabLabel({ count }: { count?: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <User className="h-4 w-4" />
      View as Parent
      {count != null && count > 0 && (
        <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-xs font-bold text-white">
          {count}
        </span>
      )}
    </span>
  )
}
