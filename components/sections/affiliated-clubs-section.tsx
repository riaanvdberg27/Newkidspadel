import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Phone, Clock } from "lucide-react"
import Image from "next/image"
import { clubs } from "@/lib/clubs-data"

export function AffiliatedClubsSection() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-black text-center text-primary mb-4">
          Our Affiliated Clubs
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Choose one of our affiliated clubs near you
        </p>
        
        <div className="grid gap-8 max-w-5xl mx-auto">
          {clubs.map((club, index) => (
            <Card key={club.id} className="overflow-hidden border-secondary/20 hover:border-secondary/40 transition-colors">
              <div className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
                <div className={`md:w-1/3 p-8 flex items-center justify-center min-h-64 ${club.logo ? 'bg-card' : 'bg-primary'}`}>
                  <Image
                    src={club.logo ?? "/images/mascots.png"}
                    alt={club.logo ? `${club.name} logo` : `${club.name} Mascots`}
                    width={200}
                    height={200}
                    className={club.logo ? "rounded-xl object-contain" : "opacity-90"}
                  />
                </div>
                <div className="md:w-2/3 p-6 md:p-8">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-2xl md:text-3xl text-primary">{club.name}</CardTitle>
                    <p className="text-secondary font-semibold text-base">{club.location}</p>
                  </CardHeader>
                  <CardContent className="p-0">
                    {club.description && (
                      <p className="text-muted-foreground mb-4">{club.description}</p>
                    )}
                    
                    <div className="grid gap-3 mb-6">
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
                          className="px-3 py-1 bg-secondary/10 text-primary text-sm font-medium rounded-full"
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
  )
}
