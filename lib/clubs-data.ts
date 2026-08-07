export type Club = {
  id: string
  name: string
  location: string
  address: string
  phone: string
  hours: string
  facilities: string[]
  description?: string
  logo?: string
}

export const clubs: Club[] = [
  {
    id: "pretoria",
    name: "MK Padel",
    location: "Pretoria, Gauteng",
    address: "2 Gondolier St, Mooikloof, Pretoria, 0081",
    phone: "064 923 1176",
    hours: "Mon-Fri: 10:00-16:00, Sat-Sun: Closed",
    facilities: ["Restaurant", "Parking"],
    logo: "/images/mk-padel-logo.png",
  },
  {
    id: "johannesburg",
    name: "Proactive Padel @ Wingate Park Country Club",
    location: "Pretoria, Gauteng",
    address: "539 Norval St, Wingate Park, Pretoria, 0153",
    phone: "065 532 1590",
    hours: "Mon-Fri: 10:00-16:00, Sat-Sun: Closed",
    facilities: ["6 Indoor Courts", "Clubhouse", "Café", "Ample Parking"],
    description: "Located in Wingate Park, this modern facility is perfect for aspiring young padel players.",
    logo: "/images/proactive-wingate.jpeg",
  },
  {
    id: "capetown",
    name: "Cape Town Padel Hub",
    location: "Cape Town, Western Cape",
    address: "789 Beach Road, Camps Bay, Cape Town, 8005",
    phone: "021 456 7890",
    hours: "Mon-Fri: 07:00-20:00, Sat-Sun: 07:00-18:00",
    facilities: ["3 Indoor Courts", "2 Outdoor Courts", "Ocean Views", "Secure Parking"],
    description: "Experience padel with stunning ocean views at our Cape Town location.",
  },
]
