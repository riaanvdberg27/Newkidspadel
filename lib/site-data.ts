import {
  Eye,
  Zap,
  Target,
  Users,
  Star,
  Heart,
  type LucideIcon,
} from "lucide-react"

export type Package = {
  id: "beginner" | "advanced"
  name: string
  price: number
  period: string
  popular?: boolean
  tagline: string
  features: string[]
}

export const PACKAGES: Package[] = [
  {
    id: "beginner",
    name: "Beginner Development Package",
    price: 600,
    period: "/month",
    popular: true,
    tagline: "Perfect for new players learning the basics",
    features: [
      "4 coaching sessions per month",
      "Balls, rental racket and court fees included in each session",
      "Basic technique training",
    ],
  },
  {
    id: "advanced",
    name: "Advanced Development Package",
    price: 900,
    period: "/month",
    tagline: "For players ready to take their game to the next level",
    features: [
      "8 coaching sessions per month",
      "Balls, rental racket and court fees included in each session",
      "Advanced technique training",
      "Match play opportunities",
    ],
  },
]

export type Skill = { label: string; icon: LucideIcon }

export const SKILLS: Skill[] = [
  { label: "Hand-Eye Coordination", icon: Eye },
  { label: "Balance & Agility", icon: Zap },
  { label: "Focus & Concentration", icon: Target },
  { label: "Teamwork & Respect", icon: Users },
  { label: "Confidence & Discipline", icon: Star },
  { label: "Fun & a Lifelong Love for Sport!", icon: Heart },
]

export const OFFERINGS: string[] = [
  "Learn the basics the right way in a fun, safe & encouraging environment",
  "Experienced coaching for all levels",
  "Individual attention & skill development",
  "Group sessions that build friendships & confidence",
]

export type Club = {
  name: string
  location: string
  description?: string
  address: string
  phone: string
  hours: string
  features: string[]
  image?: string
}

export const CLUBS: Club[] = [
  {
    name: "MK Padel",
    location: "Pretoria, Gauteng",
    address: "2 Gondolier St, Mooikloof, Pretoria, 0081",
    phone: "064 923 1176",
    hours: "Mon-Fri: 10:00-16:00, Sat-Sun: Closed",
    features: ["Restaurant", "Parking"],
    image: "/images/mk-padel-logo.png",
  },
  {
    name: "Proactive Padel @ Wingate Park Country Club",
    location: "Pretoria, Gauteng",
    description: "Located in Wingate Park, this modern facility is perfect for aspiring young padel players.",
    address: "539 Norval St, Wingate Park, Pretoria, 0153",
    phone: "065 532 1590",
    hours: "Mon-Fri: 10:00-16:00, Sat-Sun: Closed",
    features: ["6 Indoor Courts", "Clubhouse", "Café", "Ample Parking"],
    image: "/images/proactive-wingate.jpeg",
  },
  {
    name: "Cape Town Padel Hub",
    location: "Cape Town, Western Cape",
    description: "Experience padel with stunning ocean views at our Cape Town location.",
    address: "789 Beach Road, Camps Bay, Cape Town, 8005",
    phone: "021 456 7890",
    hours: "Mon-Fri: 07:00-20:00, Sat-Sun: 07:00-18:00",
    features: ["3 Indoor Courts", "2 Outdoor Courts", "Ocean Views", "Secure Parking"],
  },
]

export type Coach = {
  name: string
  role: string
  bio: string
  phone: string
  email: string
}

export const COACHES: Coach[] = [
  {
    name: "Riaan van den Berg",
    role: "Co-Founder & Assistant Coach",
    bio: "Riaan co-founded Next Gen Padel Academy and supports our coaching team with years of experience in youth sports development. His patient approach helps children of all skill levels thrive.",
    phone: "084 412 2084",
    email: "riaan@nextgenpadel.co.za",
  },
  {
    name: "Gareth Nunes",
    role: "Co-Founder & Head Coach",
    bio: "Gareth co-founded Next Gen Padel Academy and leads our coaching programs. His energy and enthusiasm are infectious, specializing in making learning fun while ensuring every child develops solid fundamental skills.",
    phone: "066 352 7053",
    email: "gareth@nextgenpadel.co.za",
  },
]

export const ENROLLMENT_CLUBS = [
  { name: "Padel Club Pretoria", location: "Pretoria, Gauteng" },
  { name: "Johannesburg Padel Centre", location: "Johannesburg, Gauteng" },
  { name: "Cape Town Padel Hub", location: "Cape Town, Western Cape" },
]
