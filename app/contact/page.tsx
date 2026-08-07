import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const contacts = [
  {
    name: "Riaan van den Berg",
    role: "Co-Founder & Assistant Coach",
    phone: "084 412 2084",
    email: "riaan@nextgenpadel.co.za",
    bio: "Riaan co-founded Next Gen Padel Academy and supports our coaching team with years of experience in youth sports development."
  },
  {
    name: "Gareth Nunes",
    role: "Co-Founder & Head Coach",
    phone: "066 352 7053",
    email: "gareth@nextgenpadel.co.za",
    bio: "Gareth co-founded Next Gen Padel Academy and leads our coaching programs with energy and expertise to help young players develop their skills."
  },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-primary py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-3xl md:text-4xl font-black text-primary-foreground mb-4">
                  Contact Us
                </h1>
                <p className="text-xl text-secondary font-bold mb-4">
                  Book Your Sessions Today!
                </p>
                <p className="text-primary-foreground/80 max-w-xl">
                  Have questions about our programs? Want to learn more about enrolling your child? 
                  We&apos;d love to hear from you. Reach out to our team and we&apos;ll get back to you as soon as possible.
                </p>
              </div>
              <Image
                src="/images/mascots.png"
                alt="Next Gen Padel Academy Mascots"
                width={300}
                height={300}
                className="drop-shadow-2xl"
              />
            </div>
          </div>
        </section>

        {/* Contact Cards */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-black text-center text-primary mb-12">
              Get In Touch
            </h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {contacts.map((contact) => (
                <Card key={contact.name} className="border-secondary/30">
                  <CardHeader>
                    <Image
                      src="/images/tennis-ball.png"
                      alt="Tennis ball"
                      width={80}
                      height={60}
                      className="w-20 h-auto mx-auto mb-4 object-contain"
                    />
                    <CardTitle className="text-center text-primary">{contact.name}</CardTitle>
                    <p className="text-center text-secondary font-semibold">{contact.role}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-muted-foreground mb-6">{contact.bio}</p>
                    
                    <div className="flex flex-col gap-4">
                      <a 
                        href={`tel:${contact.phone.replace(/\s/g, '')}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors"
                      >
                        <div className="size-10 rounded-full bg-secondary flex items-center justify-center">
                          <Phone className="size-5 text-primary" />
                        </div>
                        <span className="font-semibold text-primary">{contact.phone}</span>
                      </a>
                      
                      <a 
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors"
                      >
                        <div className="size-10 rounded-full bg-secondary flex items-center justify-center">
                          <Mail className="size-5 text-primary" />
                        </div>
                        <span className="font-semibold text-primary">{contact.email}</span>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Office Hours & Location */}
        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Clock className="size-5" />
                    Office Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span>Monday - Friday</span>
                      <span className="font-semibold">08:00 - 17:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday</span>
                      <span className="font-semibold">08:00 - 13:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday</span>
                      <span className="font-semibold">Closed</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Coaching sessions available outside office hours at our affiliated clubs.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <MessageCircle className="size-5" />
                    Quick Response
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    We aim to respond to all inquiries within 24 hours during business days. 
                    For urgent matters, please call us directly.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You can also reach us via WhatsApp on either of the numbers listed above.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-black text-primary-foreground mb-4">
              Ready to Enroll?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Choose a package below to enroll your child directly through our online enrollment system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/enrollment?package=beginner">
                <Button size="lg" className="bg-secondary text-primary hover:bg-secondary/90 font-bold text-lg px-8">
                  Beginner Package - R600/month
                </Button>
              </Link>
              <Link href="/enrollment?package=advanced">
                <Button size="lg" variant="outline" className="border-secondary text-secondary hover:bg-secondary hover:text-primary font-bold text-lg px-8">
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
