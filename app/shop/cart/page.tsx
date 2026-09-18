"use client"

import Link from "next/link"
import Image from "next/image"
import { Minus, Plus, Trash2, ChevronLeft, ShoppingBag } from "lucide-react"
import { useShopCart } from "@/lib/shop-cart"
import { blobImage } from "@/lib/blob"

export default function CartPage() {
  const { lines, removeLine, updateQuantity, totalPrice } = useShopCart()

  return (
    <main className="min-h-[70vh] bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
        <Link href="/shop" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-navy hover:underline">
          <ChevronLeft className="h-4 w-4" />
          Continue shopping
        </Link>

        <h1 className="text-2xl font-extrabold text-navy">Your Cart</h1>

        {lines.length === 0 ? (
          <div className="mt-8 rounded-card border border-dashed border-border bg-card p-10 text-center">
            <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">Your cart is empty.</p>
            <Link
              href="/shop"
              className="mt-4 inline-block rounded-full bg-lime px-5 py-2.5 font-bold text-lime-foreground hover:bg-lime/90"
            >
              Browse the shop
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {lines.map((line) => (
              <div
                key={`${line.productId}-${line.size ?? "default"}`}
                className="flex items-center gap-4 rounded-card border border-border bg-card p-4"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {line.image ? (
                    <Image
                      src={blobImage(line.image, 128) ?? "/placeholder.svg"}
                      alt={line.name}
            fill
            unoptimized
            crossOrigin="anonymous"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-navy">{line.name}</p>
                  {line.size && <p className="text-xs text-muted-foreground">Size: {line.size}</p>}
                  <p className="text-sm font-semibold text-navy">R{line.unitPrice.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border px-1.5 py-1">
                  <button
                    type="button"
                    onClick={() => updateQuantity(line.productId, line.size, line.quantity - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-navy hover:bg-muted"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-5 text-center text-sm font-semibold text-navy">{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(line.productId, line.size, line.quantity + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-navy hover:bg-muted"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(line.productId, line.size)}
                  className="text-muted-foreground hover:text-red-600"
                  aria-label={`Remove ${line.name} from cart`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-lg font-bold text-navy">Total</span>
              <span className="text-lg font-extrabold text-navy">R{totalPrice.toFixed(2)}</span>
            </div>

            <Link
              href="/shop/checkout"
              className="block w-full rounded-full bg-lime px-6 py-3 text-center font-bold text-lime-foreground transition-colors hover:bg-lime/90"
            >
              Proceed to Checkout
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
