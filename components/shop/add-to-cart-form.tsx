"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Minus, Plus, Check } from "lucide-react"
import { useShopCart } from "@/lib/shop-cart"
import type { ShopProductWithVariants } from "@/app/actions/shop"

function toRands(cents: number) {
  return cents / 100
}

export function AddToCartForm({ product }: { product: ShopProductWithVariants }) {
  const { addLine } = useShopCart()
  const router = useRouter()
  const [size, setSize] = useState<string | null>(product.hasVariants ? null : null)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedVariant = product.variants.find((v) => v.size === size)
  const unitPrice = toRands(selectedVariant?.priceOverride ?? product.price)

  function handleAdd() {
    if (product.hasVariants && !size) {
      setError("Please select a size")
      return
    }
    setError(null)
    addLine({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images?.[0] ?? null,
      size,
      unitPrice,
      quantity,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div className="mt-6 space-y-5">
      <p className="text-2xl font-extrabold text-navy">R{unitPrice.toFixed(2)}</p>

      {product.hasVariants && (
        <div>
          <p className="mb-2 text-sm font-bold text-navy">Size</p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.size}
                type="button"
                onClick={() => {
                  setSize(v.size)
                  setError(null)
                }}
                className={`rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors ${
                  size === v.size
                    ? "border-navy bg-navy text-navy-foreground"
                    : "border-border bg-card text-navy hover:border-navy"
                }`}
              >
                {v.size}
              </button>
            ))}
          </div>
          {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-bold text-navy">Quantity</p>
        <div className="inline-flex items-center gap-3 rounded-lg border border-border bg-card px-2 py-1">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-md text-navy hover:bg-muted"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-6 text-center font-semibold text-navy">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(20, q + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-md text-navy hover:bg-muted"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-lime px-6 py-3 font-bold text-lime-foreground transition-colors hover:bg-lime/90 sm:w-auto"
      >
        {added ? (
          <>
            <Check className="h-4 w-4" /> Added to cart
          </>
        ) : (
          "Add to Cart"
        )}
      </button>

      {added && (
        <button
          type="button"
          onClick={() => router.push("/shop/cart")}
          className="text-sm font-semibold text-navy underline"
        >
          Go to cart
        </button>
      )}
    </div>
  )
}
