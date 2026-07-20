"use client"

import { useState, useTransition, useMemo } from "react"
import { BarChart3, Filter, Download, RefreshCw, Building2, School, TrendingUp, Users } from "lucide-react"
import {
  getEnrollmentReport,
  type EnrollmentReportRow,
  type EnrollmentReportFilters,
  type EnrollmentReportSummary,
} from "@/app/actions/enrollment-reports"

// ---------------------------------------------------------------------------
// Helper: export visible report rows to a CSV file
// ---------------------------------------------------------------------------
function exportCsv(rows: EnrollmentReportRow[], filename: string) {
  const headers = [
    "Month",
    "Total",
    "Club Enrollments",
    "School Enrollments",
    "Active",
    "Pending",
    "Cancelled",
    "On Hold",
    "Paid",
    "Unpaid",
  ]
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.monthLabel,
        r.total,
        r.clubEnrollments,
        r.schoolEnrollments,
        r.active,
        r.pending,
        r.cancelled,
        r.onHold,
        r.paid,
        r.unpaid,
      ].join(","),
    ),
  ]
  const blob = new Blob([lines.join("\n")], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: number
  icon: React.ElementType
  accent: string
}) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 shadow-sm`}>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-navy">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Filter select
// ---------------------------------------------------------------------------
function Sel({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder: string
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
      {label}:
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-navy font-normal focus:outline-none focus:ring-1 focus:ring-lime"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}

// ---------------------------------------------------------------------------
// Bar spark: simple inline progress bar
// ---------------------------------------------------------------------------
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-[10px] text-muted-foreground">{value}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function AdminEnrollmentReports({
  initialSummary,
}: {
  initialSummary: EnrollmentReportSummary
}) {
  const [summary, setSummary] = useState(initialSummary)
  const [pending, startTransition] = useTransition()

  // Filters
  const [filterType, setFilterType] = useState<"" | "club" | "school">("")
  const [filterClub, setFilterClub] = useState("")
  const [filterSchool, setFilterSchool] = useState("")

  function applyFilters(type: "" | "club" | "school", club: string, school: string) {
    const filters: EnrollmentReportFilters = { type, club, school }
    startTransition(async () => {
      const result = await getEnrollmentReport(filters)
      setSummary(result)
    })
  }

  function handleTypeChange(v: string) {
    const t = v as "" | "club" | "school"
    setFilterType(t)
    // Clear irrelevant filter
    const newClub = t === "school" ? "" : filterClub
    const newSchool = t === "club" ? "" : filterSchool
    if (t === "school") setFilterClub("")
    if (t === "club") setFilterSchool("")
    applyFilters(t, newClub, newSchool)
  }

  function handleClubChange(v: string) {
    setFilterClub(v)
    applyFilters(filterType, v, filterSchool)
  }

  function handleSchoolChange(v: string) {
    setFilterSchool(v)
    applyFilters(filterType, filterClub, v)
  }

  function clearFilters() {
    setFilterType("")
    setFilterClub("")
    setFilterSchool("")
    applyFilters("", "", "")
  }

  const hasFilters = filterType || filterClub || filterSchool

  // Overall totals from visible rows
  const totals = useMemo(
    () =>
      summary.rows.reduce(
        (acc, r) => ({
          total: acc.total + r.total,
          club: acc.club + r.clubEnrollments,
          school: acc.school + r.schoolEnrollments,
          active: acc.active + r.active,
          paid: acc.paid + r.paid,
        }),
        { total: 0, club: 0, school: 0, active: 0, paid: 0 },
      ),
    [summary.rows],
  )

  const maxMonthTotal = useMemo(
    () => Math.max(...summary.rows.map((r) => r.total), 1),
    [summary.rows],
  )

  // Build filename for CSV
  const csvFilename = [
    "enrollments",
    filterType || "all",
    filterClub || filterSchool || "all",
    new Date().toISOString().slice(0, 10),
  ]
    .filter(Boolean)
    .join("_")
    .replace(/\s+/g, "-")
    .toLowerCase() + ".csv"

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-navy">
            <BarChart3 className="h-5 w-5 text-lime" />
            Enrollment Reports
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Monthly enrollment totals broken down by club and school. Use the filters to drill into a specific venue.
          </p>
        </div>
        <button
          onClick={() => exportCsv(summary.rows, csvFilename)}
          disabled={summary.rows.length === 0}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-navy shadow-sm hover:bg-muted disabled:opacity-40"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Summary stat cards */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total enrollments" value={totals.total} icon={Users} accent="bg-lime/20 text-lime-foreground" />
        <StatCard label="Club enrollments" value={totals.club} icon={Building2} accent="bg-navy/10 text-navy" />
        <StatCard label="School enrollments" value={totals.school} icon={School} accent="bg-amber-100 text-amber-700" />
        <StatCard label="Active" value={totals.active} icon={TrendingUp} accent="bg-green-100 text-green-700" />
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          Filter
        </span>

        <Sel
          label="Type"
          value={filterType}
          onChange={handleTypeChange}
          options={["club", "school"]}
          placeholder="All types"
        />

        {filterType !== "school" && (
          <Sel
            label="Club"
            value={filterClub}
            onChange={handleClubChange}
            options={summary.clubs}
            placeholder="All clubs"
          />
        )}

        {filterType !== "club" && (
          <Sel
            label="School"
            value={filterSchool}
            onChange={handleSchoolChange}
            options={summary.schools}
            placeholder="All schools"
          />
        )}

        {pending && (
          <span className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Loading…
          </span>
        )}

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto text-xs font-semibold text-muted-foreground underline-offset-2 hover:text-navy hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Monthly breakdown table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {summary.rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <BarChart3 className="h-8 w-8 opacity-30" />
            <p className="text-sm font-medium">No enrollments found for the selected filters.</p>
          </div>
        ) : (
          <table className="w-full table-fixed text-left text-xs">
            <colgroup>
              <col style={{ width: "14%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
            </colgroup>
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Month</th>
                <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Club</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">School</th>
                <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-lime-foreground/70">Active</th>
                <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-amber-600">Pending</th>
                <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-red-500">Cancelled</th>
                <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">On Hold</th>
                <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-green-700">Paid</th>
                <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Unpaid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {summary.rows.map((r) => (
                <tr key={r.monthKey} className="hover:bg-muted/20 align-middle">
                  <td className="px-3 py-3 font-semibold text-navy">{r.monthLabel}</td>
                  <td className="px-3 py-3 text-center">
                    <span className="inline-block rounded-full bg-navy/10 px-2 py-0.5 text-xs font-bold text-navy">
                      {r.total}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <MiniBar value={r.clubEnrollments} max={maxMonthTotal} color="bg-navy/50" />
                  </td>
                  <td className="px-3 py-3">
                    <MiniBar value={r.schoolEnrollments} max={maxMonthTotal} color="bg-amber-400" />
                  </td>
                  <td className="px-3 py-3 text-center text-navy">{r.active}</td>
                  <td className="px-3 py-3 text-center text-amber-700">{r.pending}</td>
                  <td className="px-3 py-3 text-center text-red-600">{r.cancelled}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{r.onHold}</td>
                  <td className="px-3 py-3 text-center font-semibold text-green-700">{r.paid}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{r.unpaid}</td>
                </tr>
              ))}
            </tbody>
            {/* Totals footer */}
            <tfoot className="border-t-2 border-border bg-muted/40">
              <tr className="font-bold text-navy">
                <td className="px-3 py-3 text-xs uppercase tracking-wider">Totals</td>
                <td className="px-3 py-3 text-center">
                  <span className="inline-block rounded-full bg-lime/30 px-2 py-0.5 text-xs font-bold text-lime-foreground">
                    {totals.total}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <MiniBar value={totals.club} max={totals.total} color="bg-navy/50" />
                </td>
                <td className="px-3 py-3">
                  <MiniBar value={totals.school} max={totals.total} color="bg-amber-400" />
                </td>
                <td className="px-3 py-3 text-center text-navy">{totals.active}</td>
                <td className="px-3 py-3 text-center text-amber-700">
                  {summary.rows.reduce((a, r) => a + r.pending, 0)}
                </td>
                <td className="px-3 py-3 text-center text-red-600">
                  {summary.rows.reduce((a, r) => a + r.cancelled, 0)}
                </td>
                <td className="px-3 py-3 text-center text-muted-foreground">
                  {summary.rows.reduce((a, r) => a + r.onHold, 0)}
                </td>
                <td className="px-3 py-3 text-center text-green-700">{totals.paid}</td>
                <td className="px-3 py-3 text-center text-muted-foreground">
                  {summary.rows.reduce((a, r) => a + r.unpaid, 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground">
        Enrollment month is based on the sign-up date. CSV export includes all visible rows.
      </p>
    </div>
  )
}
