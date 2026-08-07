import { Eye, Zap, Target, Users, Star, Heart } from "lucide-react"

const skills = [
  { icon: Eye, title: "Hand-Eye Coordination" },
  { icon: Zap, title: "Balance & Agility" },
  { icon: Target, title: "Focus & Concentration" },
  { icon: Users, title: "Teamwork & Respect" },
  { icon: Star, title: "Confidence & Discipline" },
  { icon: Heart, title: "Fun & a Lifelong Love for Sport!" },
]

export function SkillsSection() {
  return (
    <section className="py-16 bg-secondary">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-black text-center text-primary mb-12">
          Skills Kids Learn
        </h2>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {skills.map((skill) => (
            <div 
              key={skill.title}
              className="flex items-center gap-4 bg-primary/10 rounded-xl p-4 transition-transform hover:scale-105"
            >
              <div className="size-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <skill.icon className="size-6 text-secondary" />
              </div>
              <span className="font-bold text-primary">{skill.title}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
