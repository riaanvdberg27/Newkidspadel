import {
  pgTable,
  text,
  timestamp,
  boolean,
  serial,
  integer,
  jsonb,
} from "drizzle-orm/pg-core"

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

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
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
})

// --- App tables ------------------------------------------------------------

// One enrollment per child. Created at registration time (before the parent
// has an authenticated account). Linked to the Better Auth user via `userId`
// once the parent activates their portal.
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  // Set after activation; null while the portal account is pending.
  userId: text("userId"),
  referenceNumber: text("referenceNumber").notNull().unique(),

  // Parent details
  parentName: text("parentName").notNull(),
  parentEmail: text("parentEmail").notNull(),
  parentMobile: text("parentMobile").notNull(),
  emergencyContactName: text("emergencyContactName"),
  emergencyContactPhone: text("emergencyContactPhone"),

  // Child details
  childName: text("childName").notNull(),
  childDob: text("childDob").notNull(),
  childAge: integer("childAge").notNull(),

  // Programme details
  club: text("club").notNull(),
  packageName: text("packageName").notNull(),

  // Status: pending_activation | active | processing
  status: text("status").notNull().default("processing"),
  accountStatus: text("accountStatus").notNull().default("pending_activation"),

  // Communication preferences (set during wizard)
  prefEmail: boolean("prefEmail").notNull().default(true),
  prefWhatsapp: boolean("prefWhatsapp").notNull().default(true),
  prefSessionReminders: boolean("prefSessionReminders").notNull().default(true),
  prefAnnouncements: boolean("prefAnnouncements").notNull().default(true),
  prefHolidayClinics: boolean("prefHolidayClinics").notNull().default(true),
  prefEvents: boolean("prefEvents").notNull().default(true),

  // First-login wizard completion
  onboardingComplete: boolean("onboardingComplete").notNull().default(false),

  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

// Activation tokens for setting up the portal password. Expire after 48h.
export const activationTokens = pgTable("activation_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  enrollmentId: integer("enrollmentId").notNull(),
  email: text("email").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Notification inbox per parent (scoped by userId once activated).
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  // enrollment_update | schedule_change | announcement | attendance_alert | holiday_clinic | event
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Parent-submitted requests (schedule change, package change, general enquiry).
export const requests = pgTable("requests", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  enrollmentId: integer("enrollmentId").notNull(),
  // schedule_change | package_change | general_enquiry
  type: text("type").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  // open | in_review | resolved
  status: text("status").notNull().default("open"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Academy-wide announcements shown on the dashboard.
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// Parent activity / login audit log for admins.
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  // login | profile_update | request_submitted | document_download | activation
  action: text("action").notNull(),
  detail: text("detail"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})
