"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, Clock } from "lucide-react"
import type { ShopOrder } from "@/lib/db/schema"
import { buildNetcashPaymentForShopOrder } from "@/app/actions/shop"

function formatCents(cents: number) {
  return `R${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })
}

const PAYMENT_STYLES: Record<string, string> = {
  paid: "bg-lime/20 text-navy",
  pending: "bg-amber-100 text-amber-800",
  awaiting_payment: "bg-blue-100 text-blue-800",
  cancelled: "bg-muted text-muted-foreground",
}

const FULFILLMENT_LABELS: Record<string, string> = {
  processing: "Being prepared",
  ready: "Ready for collection",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

export function MyShopOrders({ orders }: { orders: ShopOrder[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function payWithNetcash(orderId: number) {
    startTransition(async () => {
      const { netcashUrl, formFields } = await buildNetcashPaymentForShopOrder(orderId)
      const form = document.createElement("form")
      form.method = "POST"
      form.action = netcashUrl
      for (const [key, value] of Object.entries(formFields)) {
        const input = document.createElement("input")
        input.type = "hidden"
        input.name = key
        input.value = String(value)
        form.appendChild(input)
      }
      document.body.appendChild(form)
      form.submit()
    })
  }

  return (
    <div className="mt-4 space-y-4">
      {orders.map((order) => {
        const items = (order.items as { name: string; size: string | null; quantity: number; lineTotal: number }[]) ?? []
        const needsPayment = order.paymentMethod === "netcash" && order.paymentStatus !== "paid" && order.paymentStatus !== "cancelled"
        return (
          <article key={order.id} className="rounded-card border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-navy">{order.orderReference}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${PAYMENT_STYLES[order.paymentStatus] ?? "bg-muted text-muted-foreground"}`}>
                    {order.paymentStatus.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Placed {formatDate(order.createdAt)} · {FULFILLMENT_LABELS[order.fulfillmentStatus] ?? order.fulfillmentStatus}
                </p>
              </div>
              <p className="text-lg font-black text-navy">{formatCents(order.totalAmount)}</p>
            </div>

            <div className="mt-3 space-y-1 rounded-md bg-muted/30 p-3">
              {items.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-navy">
                    {it.quantity}× {it.name}{it.size ? ` (${it.size})` : ""}
                  </span>
                  <span className="font-semibold text-navy">{formatCents(Math.round(it.lineTotal * 100))}</span>
                </div>
              ))}
            </div>

            {order.paymentMethod === "eft" && order.paymentStatus !== "paid" && order.paymentStatus !== "cancelled" && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Awaiting your EFT payment. Use the reference <strong className="text-navy">{order.orderReference}</strong> when paying.
              </p>
            )}

            {needsPayment && (
              <button
                onClick={() => payWithNetcash(order.id)}
                disabled={pending}
                className="mt-3 inline-flex items-center gap-2 rounded-md bg-lime px-4 py-2 text-sm font-bold text-lime-foreground transition-colors hover:bg-lime/90 disabled:opacity-50"
              >
                <CreditCard className="h-4 w-4" />
                {pending ? "Redirecting…" : "Pay with Netcash"}
              </button>
            )}
          </article>
        )
      })}
    </div>
  )
}
