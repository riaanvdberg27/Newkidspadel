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
              <div className="mt-2 flex items-end gap-2">
                <span className="text-4xl font-extrabold text-lime">
                  R{pkg.price.toLocaleString()}
                </span>
                {pkg.period === "once-off" ? (
                  <span className="mb-1 rounded-full bg-lime/20 px-2.5 py-0.5 text-xs font-bold text-lime">
                    once off
                  </span>
                ) : (
                  <span className="mb-1 text-sm text-navy-foreground/70">/month</span>
                )}
              </div>
              {pkg.tagline && (
                <p className="mt-1 text-sm text-navy-foreground/70">{pkg.tagline}</p>
              )}
            </div>

            <div className="flex flex-1 flex-col p-6">
              {pkg.features.length > 0 && (
                <ul className="space-y-3">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-lime" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}

              {pkg.description && (
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {pkg.description}
                </p>
              )}

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
