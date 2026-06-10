import Link from "next/link"
import { Check } from "lucide-react"
import type { PublicPackage } from "@/app/actions/packages"

export function PackagesSection({ packages }: { packages: PublicPackage[] }) {
  if (packages.length === 0) return null
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-center text-3xl font-extrabold text-navy">Our Packages</h2>
      <p className="mt-3 text-center text-muted-foreground">
        Choose the package that best fits your child&apos;s padel journey
      </p>
      <p className="mt-1 text-center text-sm font-semibold text-lime">Click on a package to enroll</p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {packages.map((pkg) => (
          <Link
            key={pkg.id}
            href={`/enrollment?package=${pkg.slug}`}
            className={`group relative flex flex-col overflow-hidden rounded-card border bg-card shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg ${
              pkg.popular ? "border-lime" : "border-border"
            }`}
          >
            {pkg.popular && (
              <span className="absolute right-4 top-4 z-10 rounded-full bg-lime px-3 py-1 text-xs font-bold text-lime-foreground">
                Most Popular
              </span>
            )}
            <div className="bg-navy p-6 text-navy-foreground">
              <h3 className="text-lg font-bold">{pkg.name}</h3>
              <p className="mt-2">
                <span className="text-4xl font-extrabold text-lime">R{pkg.price}</span>
                <span className="ml-1 text-sm text-navy-foreground/80">P/M</span>
              </p>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <ul className="flex-1 space-y-3">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-lime" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <span className="mt-6 inline-flex items-center justify-center rounded-md bg-lime px-4 py-2.5 text-sm font-bold text-lime-foreground transition-colors group-hover:bg-navy group-hover:text-navy-foreground">
                Select This Package
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
