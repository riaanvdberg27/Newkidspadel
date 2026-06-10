export type Club = {
  id: string
  name: string
  address: string
  schedule: string
}

export const CLUBS: Club[] = [
  {
    id: "northgate",
    name: "Next Gen Padel — Northgate",
    address: "12 Northgate Way, Sandton",
    schedule: "Weekday afternoons 15:00–18:00 · Saturday mornings 08:00–12:00",
  },
  {
    id: "westside",
    name: "Next Gen Padel — Westside Arena",
    address: "5 Arena Boulevard, Bryanston",
    schedule: "Weekday afternoons 14:30–17:30 · Sunday mornings 09:00–12:00",
  },
  {
    id: "riverside",
    name: "Next Gen Padel — Riverside",
    address: "88 Riverside Drive, Fourways",
    schedule: "Weekday afternoons 15:00–18:00 · Saturday mornings 08:00–11:00",
  },
  {
    id: "city-central",
    name: "Next Gen Padel — City Central",
    address: "200 Main Street, Rosebank",
    schedule: "Weekday evenings 16:00–19:00 · Saturday mornings 09:00–12:00",
  },
]

export type AcademyPackage = {
  id: string
  name: string
  sessionsPerWeek: number
  frequency: string
  price: number
  description: string
  ageRange: string
}

export const PACKAGES: AcademyPackage[] = [
  {
    id: "starter",
    name: "Starter",
    sessionsPerWeek: 1,
    frequency: "1 coached session / week",
    price: 480,
    description: "Perfect for first-time players finding their feet on court.",
    ageRange: "Ages 5–16",
  },
  {
    id: "development",
    name: "Development",
    sessionsPerWeek: 2,
    frequency: "2 coached sessions / week",
    price: 860,
    description: "Our most popular plan for steady skill progression.",
    ageRange: "Ages 6–16",
  },
  {
    id: "performance",
    name: "Performance",
    sessionsPerWeek: 3,
    frequency: "3 coached sessions / week",
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

export function getClubById(id: string) {
  return CLUBS.find((c) => c.id === id)
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
