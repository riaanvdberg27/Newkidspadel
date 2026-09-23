import type { Metadata } from "next"
import { ShopCartProvider } from "@/lib/shop-cart"
import { ShopCartBar } from "@/components/shop/shop-cart-bar"

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Shop padel gear, kit t-shirts and caps from Next Gen Padel Academy. Sizes for kids and adults, with EFT or card payment.",
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <ShopCartProvider>
      <div className="pb-20">{children}</div>
      <ShopCartBar />
    </ShopCartProvider>
  )
}
