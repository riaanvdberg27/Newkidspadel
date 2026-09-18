"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { useShopCart } from "@/lib/shop-cart"
import { createShopOrder } from "@/app/actions/shop"
import { Loader2, Landmark, CreditCard } from "lucide-react"

export function CheckoutForm() {
  const { data: session } = useSession()
  const { lines, totalPrice, clear } = useShopCart()
  const router = useRouter()
  const [paymentMethod, setPaymentMethod] = useState<"netcash" | "eft">("netcash")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [netcashFields, setNetcashFields] = useState<Record<string, string> | null>(null)
  const [netcashUrl, setNetcashUrl] = useState<string | null>(null)

  const [parentName, setParentName] = useState(session?.user?.name ?? "")
  const [parentEmail, setParentEmail] = useState(session?.user?.email ?? "")
  const [parentMobile, setParentMobile] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (session?.user) {
      setParentName((v) => v || session.user!.name)
      setParentEmail((v) => v || session.user!.email)
    }
  }, [session])

  useEffect(() => {
    if (netcashFields && formRef.current) {
      formRef.current.submit()
    }
  }, [netcashFields])

  if (!session?.user) {
    return (
      <div className="rounded-card border border-dashed border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Please sign in to check out.</p>
        <a
          href="/sign-in?redirect=/shop/checkout"
          className="mt-4 inline-block rounded-full bg-lime px-5 py-2.5 font-bold text-lime-foreground hover:bg-lime/90"
        >
          Sign In
        </a>
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <a href="/shop" className="mt-4 inline-block rounded-full bg-lime px-5 py-2.5 font-bold text-lime-foreground hover:bg-lime/90">
          Browse the shop
        </a>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!parentName.trim() || !parentEmail.trim() || !parentMobile.trim()) {
      setError("Please fill in your name, email and mobile number")
      return
    }
    setSubmitting(true)
    setError(null)

    try {
      const result = await createShopOrder({
        cart: lines.map((l) => ({ productId: l.productId, size: l.size, quantity: l.quantity })),
        parentName,
        parentEmail,
        parentMobile,
        paymentMethod,
        notes,
      })

      if (paymentMethod === "eft") {
        clear()
        router.push(`/shop/order-confirmed?ref=${encodeURIComponent(result.orderReference)}&method=eft`)
        return
      }

      const payRes = await fetch("/api/netcash/shop-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: result.orderId }),
      })
      const payData = await payRes.json()
      if (!payRes.ok) throw new Error(payData.error || "Could not start payment")

      clear()
      setNetcashUrl(payData.netcashUrl)
      setNetcashFields(payData.formFields)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setSubmitting(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-navy">Your Details</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-navy">Full Name</label>
              <input
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-navy"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-navy">Email</label>
              <input
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-navy"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-navy">Mobile</label>
              <input
                type="tel"
                value={parentMobile}
                onChange={(e) => setParentMobile(e.target.value)}
                required
                placeholder="082 123 4567"
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-navy"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-navy">Order notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-navy"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-navy">Payment Method</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("netcash")}
              className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                paymentMethod === "netcash" ? "border-navy bg-muted" : "border-border bg-card"
              }`}
            >
              <CreditCard className="h-5 w-5 text-lime" />
              <div>
                <p className="font-bold text-navy">Card / Netcash</p>
                <p className="text-xs text-muted-foreground">Pay securely online now</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("eft")}
              className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                paymentMethod === "eft" ? "border-navy bg-muted" : "border-border bg-card"
              }`}
            >
              <Landmark className="h-5 w-5 text-lime" />
              <div>
                <p className="font-bold text-navy">EFT</p>
                <p className="text-xs text-muted-foreground">Bank transfer, confirmed manually</p>
              </div>
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-lg font-bold text-navy">Total</span>
          <span className="text-lg font-extrabold text-navy">R{totalPrice.toFixed(2)}</span>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-lime px-6 py-3 font-bold text-lime-foreground transition-colors hover:bg-lime/90 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {paymentMethod === "netcash" ? "Pay Now" : "Place Order"}
        </button>
      </form>

      {/* Hidden auto-submitting form to hand off to Netcash's hosted payment page */}
      {netcashFields && netcashUrl && (
        <form ref={formRef} action={netcashUrl} method="POST" className="hidden">
          {Object.entries(netcashFields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
        </form>
      )}
    </div>
  )
}
