import { SKILLS } from "@/lib/site-data"

export function SkillsSection() {
  return (
    <section className="bg-lime">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-extrabold text-navy">Skills Kids Learn</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SKILLS.map((skill) => {
            const Icon = skill.icon
            return (
              <div
                key={skill.label}
                className="flex items-center gap-3 rounded-card bg-lime-foreground/5 p-4"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-navy text-lime">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-semibold text-navy">{skill.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
