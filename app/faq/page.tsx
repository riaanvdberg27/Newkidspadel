import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Frequently Asked Questions | NextGen Padel Academy Pretoria",
  description:
    "Answers to the most common questions about kids padel lessons at NextGen Padel Academy in Pretoria — age requirements, costs, experience needed, and more.",
  alternates: { canonical: "https://nextgenpadel.co.za/faq" },
  openGraph: {
    title: "FAQ | NextGen Padel Academy Pretoria",
    description:
      "Everything parents need to know about enrolling their child in padel coaching in Pretoria — Brooklyn, Menlo Park, Moreleta Park and Garsfontein.",
    url: "https://nextgenpadel.co.za/faq",
  },
}

const FAQS = [
  {
    question: "What age can kids start padel at NextGen Padel Academy?",
    answer:
      "We welcome children from as young as 4 years old all the way through to 17. Our three age groups — 4–8, 9–13, and 14–17 — ensure every child is coached alongside peers of a similar age and ability.",
  },
  {
    question: "Where is NextGen Padel Academy located?",
    answer:
      "We operate at affiliated padel clubs across Pretoria — Brooklyn, Menlo Park, Moreleta Park, Garsfontein, Waterkloof, Menlyn, Lynnwood, Faerie Glen and Silver Lakes. We also deliver lessons directly at schools in Pretoria. Visit our Clubs or Schools pages to find the venue nearest to you.",
  },
  {
    question: "How much do padel lessons cost?",
    answer:
      "Our programmes start from R300 per month for the Schools Programme and vary by package. All pricing is available on our Packages section. Once-off registration fees apply when applicable.",
  },
  {
    question: "Do children need prior experience to join?",
    answer:
      "No prior experience is necessary. Our beginner-friendly coaching is designed to introduce children to padel from the ground up. Racket hire is included in all programmes so no equipment is required to start.",
  },
  {
    question: "Do you offer holiday camps?",
    answer:
      "Yes — we run holiday camp programmes during school holidays. Check our latest packages or contact us directly to find out about upcoming holiday camps in Pretoria.",
  },
  {
    question: "Can my child join mid-year?",
    answer:
      "Yes, enrolment is open throughout the year. You can sign up online at any time, choose your package and nearest venue, and your child can start at the next available session.",
  },
  {
    question: "What equipment does my child need to bring?",
    answer:
      "Padel rackets and balls are provided at every session — your child just needs to bring comfortable sports clothing and a water bottle. Some packages include a sublimated hat and certificate as part of the programme.",
  },
  {
    question: "How long are the padel lessons?",
    answer:
      "Standard sessions run for 30 to 60 minutes depending on the package. School-based lessons are 30 minutes per week. Club-based programmes vary — check individual package details for specific durations.",
  },
  {
    question: "Are the coaches qualified?",
    answer:
      "All NextGen Padel Academy coaches are experienced, qualified, and passionate about junior sport development. Our team follows a structured coaching curriculum designed to develop technique, teamwork, and game understanding at every level.",
  },
  {
    question: "How do I enrol my child?",
    answer:
      "Enrolment is entirely online and takes just a few minutes. Visit our Enrol page, select your child's package and age group, choose your nearest club or school, and complete the secure payment process.",
  },
]

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
}

export default function FAQPage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero */}
      <section className="bg-navy px-4 py-12 text-center text-navy-foreground sm:py-16">
        <span className="inline-block rounded-full bg-lime/20 px-4 py-1.5 text-sm font-bold text-lime mb-4">
          Got Questions?
        </span>
        <h1 className="text-balance text-3xl font-black sm:text-5xl">Frequently Asked Questions</h1>
        <p className="mt-2 text-xl font-black text-lime">Everything You Need to Know</p>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-navy-foreground/80 sm:text-base">
          Common questions from parents about NextGen Padel Academy&#39;s kids padel coaching programmes in Pretoria.
        </p>
      </section>

      {/* FAQ list */}
      <section className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
        <dl className="space-y-4">
          {FAQS.map((faq, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <dt className="font-black text-navy text-base sm:text-lg">{faq.question}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* CTA */}
      <section className="bg-lime px-4 py-12 text-center sm:py-16">
        <h2 className="text-2xl font-black text-navy sm:text-3xl">Ready to Get Started?</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-navy/80">
          Enrol your child in Pretoria&#39;s leading junior padel academy today. Online sign-up takes less than 5 minutes.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/enrollment"
            className="rounded-2xl bg-navy px-8 py-4 font-black text-white shadow-lg transition-all hover:scale-105 text-center"
          >
            Enrol Now
          </Link>
          <Link
            href="/contact"
            className="rounded-2xl border-2 border-navy/30 px-8 py-4 font-bold text-navy transition-all hover:bg-navy/10 text-center"
          >
            Ask a Question
          </Link>
        </div>
      </section>
    </main>
  )
}
