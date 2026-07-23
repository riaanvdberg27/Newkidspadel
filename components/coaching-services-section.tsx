export function CoachingServicesSection() {
  const services = [
    {
      title: "Ceturion - Kids Padel Coaching",
      location: "Pretoria and Centurion",
      description: "Professional padel coaching for children in the Centurion area, bringing the same quality instruction and fun-focused approach to the East of Pretoria.",
    },
    {
      title: "Irene, Claudius - Kids Padel Coaching",
      location: "Brooklyn, Menlo Park, Moreleta Park, Garsfontein, Waterkloof, Menlyn, Lynnwood, Faerie Glen and Silver Lakes",
      description: "Structured junior padel lessons at clubs and schools across the greater Pretoria area. Fun, safe, and with qualified coaches who care.",
    },
  ]

  return (
    <section className="bg-white py-16" aria-label="Our coaching services">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-12">
          <span className="inline-block rounded-full bg-lime/20 px-4 py-1.5 text-sm font-bold text-lime mb-3">
            Coaching Services
          </span>
          <h2 className="text-3xl font-black text-navy sm:text-4xl">Where We Coach</h2>
          <p className="mt-2 text-navy/70 text-sm">Quality padel instruction across Pretoria and Centurion</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service, idx) => (
            <div
              key={idx}
              className="rounded-2xl border-2 border-lime/30 bg-lime/5 p-6 transition-all hover:border-lime/60 hover:bg-lime/10 hover:shadow-lg"
            >
              <h3 className="text-xl font-black text-navy mb-2">{service.title}</h3>
              <p className="text-sm font-bold text-lime mb-3">{service.location}</p>
              <p className="text-sm leading-relaxed text-navy/80">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
