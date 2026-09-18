"use client"

// Client-side shopping cart. This intentionally uses localStorage — a cart is
// ephemeral pre-checkout UI state, not durable app data. The moment a parent
// checks out, the cart is priced server-side and persisted as a real
// `shopOrders` row (see app/actions/shop.ts) — that's the source of truth.

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

export type CartLine = {
  productId: number
  slug: string
  name: string
  image: string | null
  size: string | null
  unitPrice: number // Rands, snapshot at add-to-cart time (re-priced server-side at checkout)
  quantity: number
}

type CartContextValue = {
  lines: CartLine[]
  addLine: (line: CartLine) => void
  removeLine: (productId: number, size: string | null) => void
  updateQuantity: (productId: number, size: string | null, quantity: number) => void
  clear: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = "ngp-shop-cart"

export function ShopCartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) setLines(JSON.parse(raw))
    } catch {
      // ignore malformed cart state
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
  }, [lines, hydrated])

  const addLine = (line: CartLine) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === line.productId && l.size === line.size)
      if (existing) {
        return prev.map((l) =>
          l.productId === line.productId && l.size === line.size
            ? { ...l, quantity: Math.min(20, l.quantity + line.quantity) }
            : l,
        )
      }
      return [...prev, line]
    })
  }

  const removeLine = (productId: number, size: string | null) => {
    setLines((prev) => prev.filter((l) => !(l.productId === productId && l.size === size)))
  }

  const updateQuantity = (productId: number, size: string | null, quantity: number) => {
    setLines((prev) =>
      prev.map((l) =>
        l.productId === productId && l.size === size
          ? { ...l, quantity: Math.max(1, Math.min(20, quantity)) }
          : l,
      ),
    )
  }

  const clear = () => setLines([])

  const { totalItems, totalPrice } = useMemo(
    () => ({
      totalItems: lines.reduce((sum, l) => sum + l.quantity, 0),
      totalPrice: lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0),
    }),
    [lines],
  )

  return (
    <CartContext.Provider value={{ lines, addLine, removeLine, updateQuantity, clear, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}

export function useShopCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useShopCart must be used within a ShopCartProvider")
  return ctx
}
