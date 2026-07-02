"use client"

import { useState, useMemo } from "react"
import {
  CreditCard, RefreshCw, CheckCircle2, XCircle, Clock,
  Search, Filter, Activity, Database,
} from "lucide-react"
import type { Order, Payment, Subscription, WebhookLog } from "@/lib/db/schema"

type SubTab = "payments" | "subscriptions" | "orders" | "webhooks"

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  paid: "bg-lime/20 text-navy",
  pending: "bg-amber-100 text-amber-800",
  awaiting_payment: "bg-blue-100 text-blue-800",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
}

const SUBSCRIPTION_STATUS_STYLES: Record<string, string> = {
  active: "bg-lime/20 text-navy",
  pending: "bg-amber-100 text-amber-800",
  paused: "bg-blue-100 text-blue-700",
  cancelled: "bg-muted text-muted-foreground",
  expired: "bg-muted text-muted-foreground",
  payment_failed: "bg-red-100 text-red-700",
}

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

function formatCents(cents: number | null | undefined) {
  if (cents == null) return "—"
  return `R${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function StatusBadge({ status, styles }: { status: string; styles: Record<string, string> }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${styles[status] ?? "bg-muted text-muted-foreground"}`}>
      {status.replace(/_/g, " ")}
    </span>
  )
}

// ---------------------------------------------------------------------------

export function AdminPaymentsManager({
  initialPayments,
  initialOrders,
  initialSubscriptions,
  initialWebhookLogs,
}: {
  initialPayments: Payment[]
  initialOrders: Order[]
  initialSubscriptions: Subscription[]
  initialWebhookLogs: WebhookLog[]
}) {
  const [subTab, setSubTab] = useState<SubTab>("payments")
  const [search, setSearch] = useState("")

  const subTabs: { id: SubTab; label: string; count: number }[] = [
    { id: "payments", label: "Payments", count: initialPayments.length },
    { id: "subscriptions", label: "Subscriptions", count: initialSubscriptions.length },
    { id: "orders", label: "Orders", count: initialOrders.length },
    { id: "webhooks", label: "Webhook Logs", count: initialWebhookLogs.length },
  ]

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy">Payments</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            View all Netcash payment activity, subscriptions, and webhook logs.
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="mt-5 flex flex-wrap gap-2 border-b border-border">
        {subTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`-mb-px rounded-t-md border-b-2 px-4 py-2 text-sm font-bold transition-colors ${
              subTab === t.id
                ? "border-lime text-navy"
                : "border-transparent text-muted-foreground hover:text-navy"
            }`}
          >
            {t.label}
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by reference, ID, or status…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="mt-4">
        {subTab === "payments" && (
          <PaymentsTable payments={initialPayments} search={search} />
        )}
        {subTab === "subscriptions" && (
          <SubscriptionsTable subscriptions={initialSubscriptions} search={search} />
        )}
        {subTab === "orders" && (
          <OrdersTable orders={initialOrders} search={search} />
        )}
        {subTab === "webhooks" && (
          <WebhookLogsTable logs={initialWebhookLogs} search={search} />
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Payments table
// ---------------------------------------------------------------------------

function PaymentsTable({ payments, search }: { payments: Payment[]; search: string }) {
  const filtered = useMemo(() => {
    if (!search) return payments
    const q = search.toLowerCase()
    return payments.filter((p) =>
      (p.netcashTransactionId ?? "").toLowerCase().includes(q) ||
      (p.netcashSubscriptionRef ?? "").toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q),
    )
  }, [payments, search])

  return (
    <div className="rounded-card border border-border bg-card shadow-sm overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-border bg-muted/40">
          <tr>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">ID</th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Enrollment</th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Transaction ID</th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Subscription Ref</th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Paid At</th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {filtered.length === 0 ? (
            <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No payments found.</td></tr>
          ) : filtered.map((p) => (
            <tr key={p.id} className="hover:bg-muted/20">
              <td className="px-3 py-2 font-mono text-navy">#{p.id}</td>
              <td className="px-3 py-2 text-muted-foreground">#{p.enrollmentId}</td>
              <td className="px-3 py-2 font-bold text-navy">{formatCents(p.amount)}</td>
              <td className="px-3 py-2"><StatusBadge status={p.status} styles={PAYMENT_STATUS_STYLES} /></td>
              <td className="px-3 py-2 font-mono text-muted-foreground truncate max-w-[120px]" title={p.netcashTransactionId ?? undefined}>{p.netcashTransactionId ?? "—"}</td>
              <td className="px-3 py-2 font-mono text-muted-foreground truncate max-w-[120px]" title={p.netcashSubscriptionRef ?? undefined}>{p.netcashSubscriptionRef ?? "—"}</td>
              <td className="px-3 py-2 text-muted-foreground">{formatDate(p.paidAt)}</td>
              <td className="px-3 py-2 text-muted-foreground">{formatDate(p.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Subscriptions table
// ---------------------------------------------------------------------------

function SubscriptionsTable({ subscriptions, search }: { subscriptions: Subscription[]; search: string }) {
  const filtered = useMemo(() => {
    if (!search) return subscriptions
    const q = search.toLowerCase()
    return subscriptions.filter((s) =>
      (s.netcashSubscriptionRef ?? "").toLowerCase().includes(q) ||
      s.status.toLowerCase().includes(q),
    )
  }, [subscriptions, search])

  return (
    <div className="rounded-card border border-border bg-card shadow-sm overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-border bg-muted/40">
          <tr>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">ID</th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Enrollment</th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Frequency</th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Next Billing</th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Last Payment</th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Netcash Ref</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {filtered.length === 0 ? (
            <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No subscriptions found.</td></tr>
          ) : filtered.map((s) => (
            <tr key={s.id} className="hover:bg-muted/20">
              <td className="px-3 py-2 font-mono text-navy">#{s.id}</td>
              <td className="px-3 py-2 text-muted-foreground">#{s.enrollmentId}</td>
              <td className="px-3 py-2"><StatusBadge status={s.status} styles={SUBSCRIPTION_STATUS_STYLES} /></td>
              <td className="px-3 py-2 capitalize text-muted-foreground">{s.billingFrequency}</td>
              <td className="px-3 py-2 font-bold text-navy">{formatCents(s.amount)}</td>
              <td className="px-3 py-2 text-muted-foreground">{formatDate(s.nextBillingDate)}</td>
              <td className="px-3 py-2 text-muted-foreground">{formatDate(s.lastPaymentDate)}</td>
              <td className="px-3 py-2 font-mono text-muted-foreground truncate max-w-[120px]" title={s.netcashSubscriptionRef ?? undefined}>{s.netcashSubscriptionRef ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Orders table
// ---------------------------------------------------------------------------

function OrdersTable({ orders, search }: { orders: Order[]; search: string }) {
  const filtered = useMemo(() => {
    if (!search) return orders
    const q = search.toLowerCase()
    return orders.filter((o) =>
      (o.netcashOrderId ?? "").toLowerCase().includes(q) ||
      o.status.toLowerCase().includes(q) ||
      o.packageType.toLowerCase().includes(q),
    )
  }, [orders, search])

  return (
    <div className="rounded-card border border-border bg-card shadow-sm overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-border bg-muted/40">
          <tr>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">ID</th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Enrollment</th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Netcash Order ID</th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Paid At</th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {filtered.length === 0 ? (
            <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No orders found.</td></tr>
          ) : filtered.map((o) => (
            <tr key={o.id} className="hover:bg-muted/20">
              <td className="px-3 py-2 font-mono text-navy">#{o.id}</td>
              <td className="px-3 py-2 text-muted-foreground">#{o.enrollmentId}</td>
              <td className="px-3 py-2 capitalize text-muted-foreground">{o.packageType}</td>
              <td className="px-3 py-2 font-bold text-navy">{formatCents(o.amount)}</td>
              <td className="px-3 py-2"><StatusBadge status={o.status} styles={PAYMENT_STATUS_STYLES} /></td>
              <td className="px-3 py-2 font-mono text-muted-foreground truncate max-w-[140px]" title={o.netcashOrderId ?? undefined}>{o.netcashOrderId ?? "—"}</td>
              <td className="px-3 py-2 text-muted-foreground">{formatDate(o.paidAt)}</td>
              <td className="px-3 py-2 text-muted-foreground">{formatDate(o.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Webhook logs table
// ---------------------------------------------------------------------------

function WebhookLogsTable({ logs, search }: { logs: WebhookLog[]; search: string }) {
  const [expanded, setExpanded] = useState<number | null>(null)

  const filtered = useMemo(() => {
    if (!search) return logs
    const q = search.toLowerCase()
    return logs.filter((l) =>
      (l.eventType ?? "").toLowerCase().includes(q) ||
      l.rawBody.toLowerCase().includes(q),
    )
  }, [logs, search])

  return (
    <div className="space-y-2">
      {filtered.length === 0 ? (
        <div className="rounded-card border border-border bg-card px-4 py-10 text-center text-muted-foreground">
          No webhook logs found.
        </div>
      ) : (
        <div className="rounded-card border border-border bg-card shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">ID</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Provider</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Event</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Processed</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Error</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Received</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Body</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((l) => (
                <>
                  <tr key={l.id} className="hover:bg-muted/20">
                    <td className="px-3 py-2 font-mono text-navy">#{l.id}</td>
                    <td className="px-3 py-2 capitalize text-muted-foreground">{l.provider}</td>
                    <td className="px-3 py-2 text-muted-foreground">{l.eventType ?? "—"}</td>
                    <td className="px-3 py-2">
                      {l.processed
                        ? <span className="flex items-center gap-1 text-lime-600"><CheckCircle2 className="h-3 w-3" /> Yes</span>
                        : <span className="flex items-center gap-1 text-amber-600"><Clock className="h-3 w-3" /> No</span>}
                    </td>
                    <td className="px-3 py-2 text-red-600 truncate max-w-[120px]" title={l.processingError ?? undefined}>{l.processingError ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{formatDate(l.createdAt)}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => setExpanded(expanded === l.id ? null : l.id)}
                        className="text-xs font-semibold text-navy underline-offset-2 hover:underline"
                      >
                        {expanded === l.id ? "Hide" : "View"}
                      </button>
                    </td>
                  </tr>
                  {expanded === l.id && (
                    <tr key={`${l.id}-body`}>
                      <td colSpan={7} className="bg-muted/40 px-4 py-3">
                        <pre className="whitespace-pre-wrap break-all font-mono text-[10px] text-muted-foreground max-h-48 overflow-y-auto">
                          {l.rawBody}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
