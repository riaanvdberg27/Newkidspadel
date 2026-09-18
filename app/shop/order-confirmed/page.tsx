import Link from "next/link"
import { CheckCircle2, Landmark } from "lucide-react"
import { BankDetailsCard } from "@/components/bank-details-card"

export default async function OrderConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; method?: string }>
}) {
  const { ref, method } = await searchParams

  return (
    <main className="min-h-[70vh] bg-background">
      <div className="mx-auto max-w-lg px-4 py-12 text-center sm:py-16">
        <CheckCircle2 className="mx-auto h-12 w-12 text-lime" />
        <h1 className="mt-4 text-2xl font-extrabold text-navy">Order Placed!</h1>
        {ref && (
          <p className="mt-2 text-sm text-muted-foreground">
            Reference: <span className="font-bold text-navy">{ref}</span>
          </p>
        )}

        {method === "eft" ? (
          <div className="mt-6 space-y-4 text-left">
            <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              <Landmark className="h-4 w-4 shrink-0" />
              Please pay via EFT using the reference above. Your order will be marked as paid once we confirm your
              payment.
            </div>
            <BankDetailsCard paymentReference={ref} title="Pay via EFT" />
          </div>
        ) : (
          <p className="mt-4 text-muted-foreground">
            Your payment has been processed. You can track your order status from your dashboard.
          </p>
        )}

        <Link
          href="/dashboard"
          className="mt-8 inline-block rounded-full bg-lime px-6 py-3 font-bold text-lime-foreground hover:bg-lime/90"
        >
          View My Orders
        </Link>
      </div>
    </main>
  )
}
