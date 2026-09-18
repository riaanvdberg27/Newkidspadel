import { getShopProducts, getShopCategories } from "@/app/actions/shop"
import { ProductCard } from "@/components/shop/product-card"
import { ShoppingBag } from "lucide-react"

// Always read fresh from the database — this page has no dynamic APIs of its
// own, so without this Next.js treats it as static and serves a cached copy
// that only reflects whatever products existed at deploy/build time.
export const dynamic = "force-dynamic"

export default async function ShopPage() {
  const [products, allCategories] = await Promise.all([getShopProducts(), getShopCategories()])

  const categorySlugsWithProducts = new Set(products.map((p) => p.categorySlug))
  const categories = allCategories
    .filter((c) => categorySlugsWithProducts.has(c.slug))
    .map((c) => [c.slug, c.name] as const)

  return (
    <main className="min-h-[70vh] bg-background">
      <section className="bg-navy text-navy-foreground">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <div className="flex items-center gap-2 text-lime">
            <ShoppingBag className="h-5 w-5" />
            <span className="text-sm font-bold uppercase tracking-wide">Academy Shop</span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold sm:text-4xl">Padel Gear, Padel Accessories and Apparel</h1>
          <p className="mt-2 max-w-xl text-sm text-navy-foreground/80 sm:text-base">
            Order official Next Gen Padel Academy gear for your child. Pay by EFT or card, and track your order from
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
            {categories.map(([slug, name]) => (
              <section key={slug}>
                <h2 className="mb-4 text-lg font-bold text-navy">{name}</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {products.filter((p) => p.categorySlug === slug).map((product) => (
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
