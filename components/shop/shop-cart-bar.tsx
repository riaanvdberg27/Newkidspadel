"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingBag } from "lucide-react"
import { useShopCart } from "@/lib/shop-cart"

export function ShopCartBar() {
  const { totalItems, totalPrice } = useShopCart()
  const pathname = usePathname()

  if (totalItems === 0 || pathname === "/shop/checkout") return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-navy shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-2 text-navy-foreground">
          <ShoppingBag className="h-5 w-5 text-lime" />
          <span className="text-sm font-semibold">
            {totalItems} item{totalItems === 1 ? "" : "s"} · R{totalPrice.toFixed(2)}
          </span>
        </div>
        <Link
          href="/shop/cart"
          className="rounded-full bg-lime px-5 py-2 text-sm font-bold text-lime-foreground transition-colors hover:bg-lime/90"
        >
          View Cart
        </Link>
      </div>
    </div>
  )
}
