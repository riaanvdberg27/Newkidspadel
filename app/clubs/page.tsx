import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Clock } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { clubs } from "@/lib/clubs-data"

export default function ClubsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-primary py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-black text-primary-foreground mb-4">
              Our Affiliated Clubs
            </h1>
            <p className="text-xl text-secondary font-bold mb-4">
              Choose One of Our Partner Locations
            </p>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto">
              Next Gen Padel Academy operates at premium padel facilities across South Africa. 
              Find the club nearest to you and start your padel journey today.
            </p>
          </div>
        </section>

        {/* Clubs List */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 max-w-5xl mx-auto">
              {clubs.map((club, index) => (
                <Card key={club.id} className="overflow-hidden">
                  <div className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
                    <div className={`md:w-1/3 p-8 flex items-center justify-center ${club.logo ? 'bg-card' : 'bg-primary'}`}>
                      <Image
                        src={club.logo ?? "/images/mascots.png"}
                        alt={club.logo ? `${club.name} logo` : `${club.name} Mascots`}
                        width={200}
                        height={200}
                        className={club.logo ? "rounded-xl object-contain" : "opacity-90"}
                      />
                    </div>
                    <div className="md:w-2/3 p-6">
                      <CardHeader className="p-0 mb-4">
                        <CardTitle className="text-2xl text-primary">{club.name}</CardTitle>
                        <p className="text-secondary font-semibold">{club.location}</p>
                      </CardHeader>
                      <CardContent className="p-0">
                        {club.description && (
                          <p className="text-muted-foreground mb-4">{club.description}</p>
                        )}
                        
                        <div className="grid gap-3 mb-4">
                          <div className="flex items-start gap-3">
                            <MapPin className="size-5 text-secondary flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{club.address}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Phone className="size-5 text-secondary flex-shrink-0" />
                            <span className="text-sm">{club.phone}</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <Clock className="size-5 text-secondary flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{club.hours}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {club.facilities.map(facility => (
                            <span 
                              key={facility}
                              className="px-3 py-1 bg-secondary/10 text-primary text-sm rounded-full"
                            >
                              {facility}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-black text-primary mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-primary/80 mb-8 max-w-xl mx-auto">
              Join Next Gen Padel Academy today and give your child the gift of sport, 
              friendship, and personal growth. Choose a package below to enroll.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/enrollment?package=beginner">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg px-8">
                  Beginner Package - R600/month
                </Button>
              </Link>
              <Link href="/enrollment?package=advanced">
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold text-lg px-8">
                  Advanced Package - R900/month
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
