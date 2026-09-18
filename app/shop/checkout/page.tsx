import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { CheckoutForm } from "@/components/shop/checkout-form"

export default function CheckoutPage() {
  return (
    <main className="min-h-[70vh] bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
        <Link href="/shop/cart" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-navy hover:underline">
          <ChevronLeft className="h-4 w-4" />
          Back to cart
        </Link>
        <h1 className="mb-6 text-2xl font-extrabold text-navy">Checkout</h1>
        <CheckoutForm />
      </div>
    </main>
  )
}
