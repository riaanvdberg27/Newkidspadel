import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { getShopProduct } from "@/app/actions/shop"
import { ProductGallery } from "@/components/shop/product-gallery"
import { AddToCartForm } from "@/components/shop/add-to-cart-form"

// Always read fresh from the database so admin edits (price, images,
// publish/unpublish) show up immediately instead of a cached snapshot.
export const dynamic = "force-dynamic"

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getShopProduct(decodeURIComponent(slug))
  if (!product) notFound()

  return (
    <main className="min-h-[70vh] bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
        <Link href="/shop" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-navy hover:underline">
          <ChevronLeft className="h-4 w-4" />
          Back to shop
        </Link>

        <div className="grid gap-8 lg:grid-cols-2">
          <ProductGallery images={product.images ?? []} name={product.name} />

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{product.categoryName}</p>
            <h1 className="mt-1 text-2xl font-extrabold text-navy sm:text-3xl">{product.name}</h1>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            {product.leadTimeDays != null && product.leadTimeDays > 0 && (
              <p className="mt-3 inline-block rounded-full bg-muted px-3 py-1 text-xs font-bold text-navy">
                Lead time: {product.leadTimeDays} day{product.leadTimeDays === 1 ? "" : "s"}
              </p>
            )}

            <AddToCartForm product={product} />
          </div>
        </div>
      </div>
    </main>
  )
}
