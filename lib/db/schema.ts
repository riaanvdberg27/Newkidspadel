import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  serial,
  jsonb,
  unique,
  numeric,
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
  contactPerson: text("contactPerson"),
  contactEmail: text("contactEmail"),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const AGE_GROUPS = ["5-8", "9-13", "14-17"] as const
export type AgeGroup = (typeof AGE_GROUPS)[number]

export const clubSlots = pgTable(
  "club_slots",
  {
    id: serial("id").primaryKey(),
    clubId: integer("clubId").notNull(),
    // 0 = Sunday ... 6 = Saturday
    weekday: integer("weekday").notNull(),
    // Start hour as decimal: 8 = 08:00, 8.5 = 08:30, 13.5 = 13:30 etc.
    hour: numeric("hour", { precision: 4, scale: 1 }).notNull(),
    capacity: integer("capacity").notNull().default(0),
    // Age group this slot is available for
    ageGroup: text("ageGroup").notNull().default("5-8"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (t) => ({
    uniqueSlot: unique("club_slots_unique").on(t.clubId, t.weekday, t.hour, t.ageGroup),
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
  slotHour: numeric("slotHour", { precision: 4, scale: 1 }),
  slotAgeGroup: text("slotAgeGroup"),
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
  // Payment
  // 'monthly' | 'once-off'
  paymentType: text("paymentType").notNull().default("monthly"),
  // 'pending' | 'complete' | 'failed' | 'cancelled'
  paymentStatus: text("paymentStatus").notNull().default("pending"),
  payfastPaymentId: text("payfastPaymentId"),
  // Coach assignment
  coachId: integer("coachId"),
  coachName: text("coachName"),
  // Status
  status: text("status").notNull().default("pending"),
  accountStatus: text("accountStatus").notNull().default("active"),
  onboardingComplete: boolean("onboardingComplete").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const packageSlots = pgTable(
  "package_slots",
  {
    id: serial("id").primaryKey(),
    packageId: integer("packageId").notNull(),
    // 0 = applies to all clubs (legacy / no restriction); any other value = specific club
    clubId: integer("clubId").notNull().default(0),
    weekday: integer("weekday").notNull(),
    // Start hour as decimal: 8 = 08:00, 8.5 = 08:30
    hour: numeric("hour", { precision: 4, scale: 1 }).notNull(),
    capacity: integer("capacity").notNull().default(10),
    // Age group this package slot is available for
    ageGroup: text("ageGroup").notNull().default("5-8"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (t) => ({
    uniqueSlot: unique("package_slots_unique").on(t.packageId, t.clubId, t.weekday, t.hour, t.ageGroup),
  }),
)

export type Enrollment = typeof enrollments.$inferSelect
export type Club = typeof clubs.$inferSelect
export type ClubSlot = typeof clubSlots.$inferSelect
export type PackageRow = typeof packages.$inferSelect
export type PackageSlot = typeof packageSlots.$inferSelect

// ---- Site settings (contact details, etc.) ----

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export type SiteSetting = typeof siteSettings.$inferSelect

// ---- Coaches ----

export const coaches = pgTable("coaches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default(""),
  role: text("role").notNull().default(""),
  bio: text("bio").notNull().default(""),
  imageUrl: text("imageUrl"),
  sortOrder: integer("sortOrder").notNull().default(0),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export type Coach = typeof coaches.$inferSelect

// ---- Coach ↔ Club assignments ----

export const coachClubs = pgTable(
  "coach_clubs",
  {
    id: serial("id").primaryKey(),
    coachId: integer("coachId")
      .notNull()
      .references(() => coaches.id, { onDelete: "cascade" }),
    clubId: integer("clubId")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
  },
  (t) => ({
    uniqueAssignment: unique("coach_clubs_unique").on(t.coachId, t.clubId),
  }),
)

export type CoachClub = typeof coachClubs.$inferSelect

// ---- Package ↔ Club restrictions ----

export const packageClubs = pgTable(
  "package_clubs",
  {
    id: serial("id").primaryKey(),
    packageId: integer("packageId")
      .notNull()
      .references(() => packages.id, { onDelete: "cascade" }),
    clubId: integer("clubId")
      .notNull()
      .references(() => clubs.id, { onDelete: "cascade" }),
  },
  (t) => ({
    uniqueRestriction: unique("package_clubs_unique").on(t.packageId, t.clubId),
  }),
)

export type PackageClub = typeof packageClubs.$inferSelect

// ---- Referral system ----

// One referral profile per user — auto-created on first dashboard visit
export const referralProfiles = pgTable("referral_profiles", {
  id: serial("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  // Short code used in the referral URL, e.g. "AB12C"
  code: text("code").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export type ReferralProfile = typeof referralProfiles.$inferSelect

// Tracks each referral attempt — one row per referred enrollment
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  // The parent who shared the referral link
  referrerId: text("referrerId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  referralCode: text("referralCode").notNull(),
  // The enrollment that used the code
  enrollmentId: integer("enrollmentId").references(() => enrollments.id, { onDelete: "set null" }),
  // 'pending' | 'complete'
  // pending = registered but not yet paid first month; complete = first payment confirmed
  status: text("status").notNull().default("pending"),
  // Set when status becomes 'complete'
  completedAt: timestamp("completedAt"),
  // Voucher issued to referrer after completion
  voucherId: integer("voucherId"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export type Referral = typeof referrals.$inferSelect

// ---- Voucher campaigns ----

export const voucherCampaigns = pgTable("voucher_campaigns", {
  id: serial("id").primaryKey(),
  // 'referral' | 'bootcamp' | 'custom'
  type: text("type").notNull().default("custom"),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  // Discount percent (e.g. 20 = 20%)
  discountPercent: integer("discountPercent").notNull().default(20),
  // Which package periods this applies to: 'monthly' | 'once-off' | 'both'
  appliesTo: text("appliesTo").notNull().default("monthly"),
  // Configurable expiry relative to issuance (days); null = no expiry
  expiryDays: integer("expiryDays"),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export type VoucherCampaign = typeof voucherCampaigns.$inferSelect

// ---- Individual vouchers ----

export const vouchers = pgTable("vouchers", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  campaignId: integer("campaignId")
    .notNull()
    .references(() => voucherCampaigns.id, { onDelete: "cascade" }),
  // The parent who owns this voucher
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  discountPercent: integer("discountPercent").notNull(),
  // 'active' | 'used' | 'expired'
  status: text("status").notNull().default("active"),
  // Enrollment this voucher was redeemed against (set on redemption)
  redeemedOnEnrollmentId: integer("redeemedOnEnrollmentId").references(() => enrollments.id, {
    onDelete: "set null",
  }),
  // Referral that triggered this voucher issuance (null for bootcamp vouchers)
  referralId: integer("referralId").references(() => referrals.id, { onDelete: "set null" }),
  expiresAt: timestamp("expiresAt"),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export type Voucher = typeof vouchers.$inferSelect
