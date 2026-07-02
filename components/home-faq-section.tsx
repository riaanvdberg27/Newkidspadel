import Link from "next/link"

const HOME_FAQS = [
  {
    question: "What age can children start padel at NextGen Padel Academy?",
    answer: "We welcome children from age 4 up to 17. Our three age groups ensure every child is coached with peers of similar age and ability.",
  },
  {
    question: "Where do you offer kids padel coaching in Pretoria?",
    answer: "We operate at affiliated padel clubs across Pretoria, Centurion, Midrand, Waterkloof, Menlyn, Lynnwood, Faerie Glen, Moreleta Park and Silver Lakes, plus schools throughout Gauteng.",
  },
  {
    question: "Does my child need experience to join?",
    answer: "No experience is needed. All equipment including rackets is provided, so your child can simply arrive and play.",
  },
  {
    question: "Can my child enrol during the school year?",
    answer: "Yes — enrolment is open year-round. Sign up online and your child can start at the next available session.",
  },
]

export function HomeFaqSection() {
  return (
    <section className="bg-muted px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-8">
          <span className="inline-block rounded-full bg-lime/20 px-4 py-1.5 text-sm font-bold text-lime-foreground mb-3">
            Common Questions
          </span>
          <h2 className="text-2xl font-black text-navy sm:text-3xl">
            Frequently Asked Questions About Kids Padel in Pretoria
          </h2>
        </div>

        <dl className="space-y-4">
          {HOME_FAQS.map((faq, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5">
              <dt className="font-black text-navy text-sm sm:text-base">{faq.question}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{faq.answer}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 text-center">
          <Link
            href="/faq"
            className="inline-block rounded-2xl border-2 border-navy/20 px-6 py-3 text-sm font-bold text-navy transition-all hover:bg-navy/5"
          >
            View All FAQs
          </Link>
        </div>
      </div>
    </section>
  )
}
