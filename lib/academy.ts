export const CLUBS = [
  "Next Gen Padel — Northgate",
  "Next Gen Padel — Westside Arena",
  "Next Gen Padel — Riverside",
  "Next Gen Padel — City Central",
] as const

export type Club = (typeof CLUBS)[number]

export type AcademyPackage = {
  id: string
  name: string
  sessionsPerWeek: number
  price: number
  description: string
  ageRange: string
}

export const PACKAGES: AcademyPackage[] = [
  {
    id: "starter",
    name: "Starter — 1 Session / Week",
    sessionsPerWeek: 1,
    price: 480,
    description: "Perfect for first-time players finding their feet on court.",
    ageRange: "Ages 5–16",
  },
  {
    id: "development",
    name: "Development — 2 Sessions / Week",
    sessionsPerWeek: 2,
    price: 860,
    description: "Our most popular plan for steady skill progression.",
    ageRange: "Ages 6–16",
  },
  {
    id: "performance",
    name: "Performance — 3 Sessions / Week",
    sessionsPerWeek: 3,
    price: 1180,
    description: "Intensive coaching for competitive junior players.",
    ageRange: "Ages 8–16",
  },
]

export const ACADEMY = {
  name: "Next Gen Padel Academy",
  tagline: "Play. Learn. Grow.",
  supportEmail: "hello@nextgenpadel.test",
  supportPhone: "+27 21 555 0142",
  whatsapp: "+27 82 555 0142",
}

export function getPackageById(id: string) {
  return PACKAGES.find((p) => p.id === id)
}

export function calculateAge(dob: string): number {
  const birth = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

export function generateReference(): string {
  const year = new Date().getFullYear()
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `NGP-${year}-${rand}`
}
