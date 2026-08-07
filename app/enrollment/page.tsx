import { Suspense } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { EnrollmentForm } from "@/components/enrollment-form"
import Image from "next/image"

export default function EnrollmentPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-primary mb-2">
              Enroll Your Child Today
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join Next Gen Padel Academy and give your child the opportunity to learn, 
              grow, and have fun while developing valuable skills.
            </p>
          </div>
          
          <Suspense fallback={<div className="text-center py-12">Loading enrollment form...</div>}>
            <EnrollmentForm />
          </Suspense>
          
          <div className="flex justify-center mt-12">
            <Image
              src="/images/mascots.png"
              alt="Next Gen Padel Academy Mascots"
              width={200}
              height={200}
              className="opacity-50"
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
