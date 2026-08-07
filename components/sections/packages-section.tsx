import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

const packages = [
  {
    id: "beginner",
    name: "Beginner Development Package",
    price: "R600",
    period: "P/M",
    features: [
      "4 coaching sessions P/M",
      "Balls, rental racket and court fees included in each session",
    ],
    popular: true,
  },
  {
    id: "advanced",
    name: "Advanced Development Package",
    price: "R900",
    period: "P/M",
    features: [
      "8 coaching sessions P/M",
      "Balls, rental racket and court fees included in each session",
    ],
    popular: false,
  },
]

export function PackagesSection() {
  return (
    <section id="packages" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-black text-center text-primary mb-4">
          Our Packages
        </h2>
        <p className="text-center text-muted-foreground mb-4 max-w-2xl mx-auto">
          Choose the package that best fits your child&apos;s padel journey
        </p>
        <p className="text-center text-secondary font-semibold mb-12">
          Click on a package to enroll
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {packages.map((pkg) => (
            <Link key={pkg.id} href={`/enrollment?package=${pkg.id}`}>
              <Card 
                className={`relative overflow-hidden transition-all hover:scale-105 cursor-pointer h-full ${
                  pkg.popular ? "border-secondary border-2 shadow-lg" : "hover:border-secondary"
                }`}
              >
                {pkg.popular && (
                  <Badge className="absolute top-20 right-4 z-10 bg-secondary text-primary shadow-md pb-0">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="bg-primary text-primary-foreground pb-8">
                  <CardTitle className="text-xl font-bold">{pkg.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-5xl font-black text-secondary">{pkg.price}</span>
                    <span className="text-lg ml-2 opacity-80">{pkg.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="flex flex-col gap-3">
                    {pkg.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <div className="size-6 rounded-full bg-secondary/20 flex items-center justify-center">
                          <Check className="size-4 text-secondary" />
                        </div>
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 text-center">
                    <span className="inline-block bg-secondary text-primary font-bold py-2 px-6 rounded-lg">
                      Select This Package
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-4 bg-secondary/10 rounded-full px-6 py-3">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-full bg-primary flex items-center justify-center">
                <svg className="size-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <span className="font-semibold text-primary">Group Sessions Available!</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
