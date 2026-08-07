import { Phone, Mail } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const contacts = [
  {
    name: "Riaan van den Berg",
    phone: "084 412 2084",
    role: "Co-Founder & Assistant Coach",
  },
  {
    name: "Gareth Nunes",
    phone: "066 352 7053",
    role: "Co-Founder & Head Coach",
  },
]

export function ContactSection() {
  return (
    <section className="py-16 bg-secondary">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-black text-center text-primary mb-4">
          Contact Us
        </h2>
        <p className="text-center text-primary/80 mb-12 max-w-2xl mx-auto">
          Ready to get started? Book your sessions today!
        </p>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-6 flex-1">
            {contacts.map((contact) => (
              <Card key={contact.name} className="border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-primary">{contact.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{contact.role}</p>
                </CardHeader>
                <CardContent>
                  <a 
                    href={`tel:${contact.phone.replace(/\s/g, '')}`}
                    className="flex items-center gap-3 text-primary hover:text-secondary transition-colors"
                  >
                    <div className="size-10 rounded-full bg-primary flex items-center justify-center">
                      <Phone className="size-5 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-bold">{contact.phone}</span>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
