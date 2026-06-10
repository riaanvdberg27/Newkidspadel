"use client"

import Link from "next/link"
import { Check, ChevronLeft, ChevronRight } from "lucide-react"
import type { PublicPackage } from "@/app/actions/packages"
import { useState, useRef } from "react"
import useEmblaCarousel from "embla-carousel-react"

export function PackagesSection({ packages }: { packages: PublicPackage[] }) {
  if (packages.length === 0) return null

  return (
    <section className="py-16 overflow-hidden">
      <div className="px-4 text-center">
        <span className="inline-block rounded-full bg-lime/20 px-4 py-1.5 text-sm font-bold text-lime-foreground mb-3">
          Choose Your Path
        </span>
        <h2 className="text-3xl font-extrabold text-navy sm:text-4xl">Our Packages</h2>
        <p className="mt-2 text-muted-foreground text-sm sm:text-base">
          Pick the package that suits your child — swipe to explore
        </p>
      </div>

      {packages.length === 1 ? (
        <div className="mt-10 mx-auto max-w-sm px-4">
          <PackageCard pkg={packages[0]} />
        </div>
      ) : (
        <PackageCarousel packages={packages} />
      )}
    </section>
  )
}

const CARD_COLORS = [
  { bg: "from-navy to-[#0d3070]", accent: "bg-lime" },
  { bg: "from-[#1a4a1a] to-[#2d6e2d]", accent: "bg-lime" },
  { bg: "from-[#3a1a5c] to-[#5a2d8c]", accent: "bg-yellow-400" },
  { bg: "from-[#1a3a4a] to-[#0a2a3a]", accent: "bg-lime" },
]

function PackageCarousel({ packages }: { packages: PublicPackage[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
  })
  const [selected, setSelected] = useState(0)

  const scrollPrev = () => {
    emblaApi?.scrollPrev()
    setSelected((s) => (s - 1 + packages.length) % packages.length)
  }
  const scrollNext = () => {
    emblaApi?.scrollNext()
    setSelected((s) => (s + 1) % packages.length)
  }

  return (
    <div className="mt-10 relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 pl-[max(1rem,calc(50vw-340px))]">
          {packages.map((pkg, i) => (
            <div
              key={pkg.id}
              className="flex-none w-[min(320px,85vw)] transition-transform duration-300"
            >
              <PackageCard pkg={pkg} colorIdx={i} />
            </div>
          ))}
          {/* Trailing spacer so last card centres */}
          <div className="flex-none w-[max(1rem,calc(50vw-340px))]" />
        </div>
      </div>

      {/* Nav buttons */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          onClick={scrollPrev}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-white shadow-md transition-transform hover:scale-105 active:scale-95"
          aria-label="Previous"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Dots */}
        <div className="flex gap-2">
          {packages.map((_, i) => (
            <button
              key={i}
              onClick={() => { emblaApi?.scrollTo(i); setSelected(i) }}
              className={`rounded-full transition-all duration-200 ${
                i === selected ? "w-6 h-3 bg-lime" : "w-3 h-3 bg-border"
              }`}
              aria-label={`Go to package ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={scrollNext}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-white shadow-md transition-transform hover:scale-105 active:scale-95"
          aria-label="Next"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

function PackageCard({ pkg, colorIdx = 0 }: { pkg: PublicPackage; colorIdx?: number }) {
  const color = CARD_COLORS[colorIdx % CARD_COLORS.length]

  return (
    <Link
      href={`/enrollment?package=${pkg.slug}`}
      className="group block rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
    >
      {/* Header */}
      <div className={`bg-gradient-to-br ${color.bg} p-6 text-white relative overflow-hidden`}>
        {/* Background decoration */}
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/5" />
        <div className="absolute -right-2 top-12 h-12 w-12 rounded-full bg-white/5" />

        {pkg.popular && (
          <span className={`inline-block rounded-full ${color.accent} px-3 py-1 text-xs font-black text-navy mb-3`}>
            Most Popular
          </span>
        )}
        <h3 className="text-xl font-black">{pkg.name}</h3>
        {pkg.tagline && (
          <p className="mt-1 text-sm text-white/70">{pkg.tagline}</p>
        )}
        <div className="mt-4 flex items-end gap-2">
          <span className={`text-5xl font-black ${color.accent === "bg-lime" ? "text-lime" : "text-yellow-400"}`}>
            R{pkg.price.toLocaleString()}
          </span>
          {pkg.period === "once-off" ? (
            <span className="mb-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold">once off</span>
          ) : (
            <span className="mb-1.5 text-sm text-white/60">/month</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="bg-card p-6">
        {pkg.features.length > 0 && (
          <ul className="space-y-2.5">
            {pkg.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime/20">
                  <Check className="h-3 w-3 text-lime-foreground" />
                </span>
                <span className="text-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        )}

        {pkg.description && (
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground border-t border-border pt-4">
            {pkg.description}
          </p>
        )}

        <span className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-lime py-3 text-sm font-black text-lime-foreground transition-all group-hover:bg-navy group-hover:text-white">
          Select This Package
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  )
}
