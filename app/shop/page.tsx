import { getShopProducts } from "@/app/actions/shop"
import { ProductCard } from "@/components/shop/product-card"
import { ShoppingBag } from "lucide-react"

export default async function ShopPage() {
  const products = await getShopProducts()

  const categories = [...new Set(products.map((p) => p.category))]

  return (
    <main className="min-h-[70vh] bg-background">
      <section className="bg-navy text-navy-foreground">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <div className="flex items-center gap-2 text-lime">
            <ShoppingBag className="h-5 w-5" />
            <span className="text-sm font-bold uppercase tracking-wide">Academy Shop</span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold sm:text-4xl">Padel Gear, Kit &amp; Caps</h1>
          <p className="mt-2 max-w-xl text-sm text-navy-foreground/80 sm:text-base">
            Order official NextGen Padel Academy gear for your child. Pay by EFT or card, and track your order from
            your parent dashboard.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        {products.length === 0 ? (
          <div className="rounded-card border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            No products are available right now. Please check back soon.
          </div>
        ) : (
          <div className="space-y-10">
            {categories.map((category) => (
              <section key={category}>
                <h2 className="mb-4 text-lg font-bold text-navy">{category}</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {products.filter((p) => p.category === category).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
