import Link from "next/link"
import Image from "next/image"
import { blobImage } from "@/lib/blob"
import type { ShopProductWithVariants } from "@/app/actions/shop"

function toRands(cents: number) {
  return cents / 100
}

export function ProductCard({ product }: { product: ShopProductWithVariants }) {
  const image = product.images?.[0]
  const prices = product.hasVariants
    ? product.variants.map((v) => (v.priceOverride ?? product.price))
    : [product.price]
  const minPrice = toRands(Math.min(...prices))
  const maxPrice = toRands(Math.max(...prices))

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-card border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {image ? (
          <Image
            src={blobImage(image, 500) ?? "/placeholder.svg"}
            alt={product.name}
            fill
            unoptimized
            crossOrigin="anonymous"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>
        )}
        {product.leadTimeDays != null && product.leadTimeDays > 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-navy px-2.5 py-1 text-[11px] font-bold text-navy-foreground">
            {product.leadTimeDays}-day lead time
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{product.categoryName}</p>
        <h3 className="text-base font-bold text-navy">{product.name}</h3>
        <p className="mt-auto text-sm font-bold text-navy">
          {minPrice === maxPrice ? `R${minPrice.toFixed(2)}` : `R${minPrice.toFixed(2)} – R${maxPrice.toFixed(2)}`}
        </p>
      </div>
    </Link>
  )
}
