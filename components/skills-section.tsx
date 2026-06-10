import { SKILLS } from "@/lib/site-data"

export function SkillsSection() {
  return (
    <section className="bg-navy py-16 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-10">
          <span className="inline-block rounded-full bg-lime/20 px-4 py-1.5 text-sm font-bold text-lime mb-3">
            What We Teach
          </span>
          <h2 className="text-3xl font-black text-white sm:text-4xl">Skills Kids Learn</h2>
          <p className="mt-2 text-navy-foreground/70 text-sm">Developing champions on and off the court</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
          {SKILLS.map((skill, i) => {
            const Icon = skill.icon
            return (
              <div
                key={skill.label}
                className="group flex flex-col items-center gap-3 rounded-2xl bg-white/5 p-5 text-center transition-all hover:bg-white/10 hover:scale-105"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-lime text-lime-foreground shadow-lg group-hover:shadow-lime/40">
                  <Icon className="h-7 w-7" />
                </span>
                <span className="text-sm font-bold text-white leading-tight">{skill.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
