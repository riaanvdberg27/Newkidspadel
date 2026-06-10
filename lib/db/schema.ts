import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  serial,
  jsonb,
  unique,
} from "drizzle-orm/pg-core"

// ---- Better Auth tables (camelCase columns to match Better Auth defaults) ----

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  idToken: text("idToken"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

// ---- App tables ----

export const packages = pgTable("packages", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  // 'monthly' | 'once-off'
  period: text("period").notNull().default("monthly"),
  tagline: text("tagline").notNull().default(""),
  features: jsonb("features").notNull().default([]),
  description: text("description").notNull().default(""),
  popular: boolean("popular").notNull().default(false),
  published: boolean("published").notNull().default(true),
  // 'standard' | 'custom'
  slotType: text("slotType").notNull().default("standard"),
  sortOrder: integer("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const clubs = pgTable("clubs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  hours: text("hours").notNull(),
  features: jsonb("features").notNull().default([]),
  image: text("image"),
  imageUrl: text("imageUrl"),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const clubSlots = pgTable(
  "club_slots",
  {
    id: serial("id").primaryKey(),
    clubId: integer("clubId").notNull(),
    // 0 = Sunday ... 6 = Saturday
    weekday: integer("weekday").notNull(),
    // 8 - 18 (24h)
    hour: integer("hour").notNull(),
    capacity: integer("capacity").notNull().default(0),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (t) => ({
    uniqueSlot: unique("club_slots_unique").on(t.clubId, t.weekday, t.hour),
  }),
)

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  referenceNumber: text("referenceNumber").notNull(),
  // Parent / guardian
  parentName: text("parentName").notNull(),
  parentEmail: text("parentEmail").notNull(),
  parentMobile: text("parentMobile").notNull(),
  // Child
  childName: text("childName").notNull(),
  childDob: text("childDob").notNull(),
  childAge: integer("childAge").notNull(),
  // Program
  packageName: text("packageName").notNull(),
  club: text("club").notNull(),
  clubId: integer("clubId"),
  slotWeekday: integer("slotWeekday"),
  slotHour: integer("slotHour"),
  // Debit order
  debitAccountHolder: text("debitAccountHolder"),
  debitBankName: text("debitBankName"),
  debitAccountNumber: text("debitAccountNumber"),
  debitAccountType: text("debitAccountType"),
  debitDay: integer("debitDay"),
  // Emergency contact
  emergencyContactName: text("emergencyContactName"),
  emergencyContactPhone: text("emergencyContactPhone"),
  // Terms, consent & signature
  agreedTerms: boolean("agreedTerms").notNull().default(false),
  consentMedia: boolean("consentMedia").notNull().default(false),
  signatureData: text("signatureData"),
  signedName: text("signedName"),
  signedAt: timestamp("signedAt"),
  contractUrl: text("contractUrl"),
  // Communication preferences
  prefEmail: boolean("prefEmail").notNull().default(true),
  prefWhatsapp: boolean("prefWhatsapp").notNull().default(false),
  prefSessionReminders: boolean("prefSessionReminders").notNull().default(true),
  prefAnnouncements: boolean("prefAnnouncements").notNull().default(true),
  prefEvents: boolean("prefEvents").notNull().default(false),
  prefHolidayClinics: boolean("prefHolidayClinics").notNull().default(false),
  // Status
  status: text("status").notNull().default("pending"),
  accountStatus: text("accountStatus").notNull().default("active"),
  onboardingComplete: boolean("onboardingComplete").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const packageSlots = pgTable("package_slots", {
  id: serial("id").primaryKey(),
  packageId: integer("packageId").notNull(),
  weekday: integer("weekday").notNull(),
  hour: integer("hour").notNull(),
  capacity: integer("capacity").notNull().default(10),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export type Enrollment = typeof enrollments.$inferSelect
export type Club = typeof clubs.$inferSelect
export type ClubSlot = typeof clubSlots.$inferSelect
export type PackageRow = typeof packages.$inferSelect
export type PackageSlot = typeof packageSlots.$inferSelect
