import { sql } from "drizzle-orm";
import {
  text,
  integer,
  real,
  sqliteTable,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  // Roles: super_admin sees all data & approves; sport_admin sees/edits assigned sports only
  // "admin" and "editor" kept as aliases for backward compat with existing records
  role: text("role", { enum: ["super_admin", "sport_admin", "viewer", "admin", "editor"] })
    .notNull()
    .default("viewer"),
  province: text("province"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const players = sqliteTable("players", {
  id: text("id").primaryKey(),
  fullName: text("full_name").notNull(),
  employeeId: text("employee_id").notNull().unique(),
  branch: text("branch").notNull(),
  sport: text("sport").notNull().default("Athletics"),
  gender: text("gender", { enum: ["M", "F"] }).notNull(),
  dateOfBirth: text("date_of_birth"),
  joinedYear: integer("joined_year"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  photoUrl: text("photo_url"),
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", {
    enum: ["inter_province", "nationalized", "coaching_camp", "local", "international"],
  }).notNull(),
  eventDate: text("event_date").notNull(),
  year: integer("year").notNull(),
  location: text("location"),
  notes: text("notes"),
  locked: integer("locked", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const results = sqliteTable(
  "results",
  {
    id: text("id").primaryKey(),
    playerId: text("player_id")
      .notNull()
      .references(() => players.id),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id),
    place: text("place", { enum: ["1", "2", "3", "participated"] }).notNull(),
    bestAthlete: integer("best_athlete", { mode: "boolean" })
      .notNull()
      .default(false),
    meetRecord: integer("meet_record", { mode: "boolean" })
      .notNull()
      .default(false),
    sport: text("sport"),
    discipline: text("discipline"),
    gender: text("gender", { enum: ["M", "F"] }),
    ageCategory: text("age_category"),
    performance: text("performance"),
    performanceValue: real("performance_value"),
    marksAwarded: real("marks_awarded").notNull(),
    notes: text("notes"),
    enteredBy: text("entered_by").references(() => users.id),
    // Dual control: pending until approved by super_admin. Default approved for existing records.
    status: text("status", { enum: ["pending", "approved", "rejected"] })
      .notNull()
      .default("approved"),
    reviewNotes: text("review_notes"),
    reviewedBy: text("reviewed_by").references(() => users.id),
    reviewedAt: text("reviewed_at"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    uniqueIndex("results_player_event_discipline_uniq").on(
      t.playerId, t.eventId, t.discipline, t.gender, t.ageCategory
    ),
  ]
);

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  action: text("action", { enum: ["create", "update", "delete", "approve", "reject"] }).notNull(),
  entity: text("entity", {
    enum: ["player", "event", "result", "user", "import_batch"],
  }).notNull(),
  entityId: text("entity_id").notNull(),
  before: text("before"),
  after: text("after"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const ageCategories = sqliteTable("age_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const sports = sqliteTable("sports", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const sportDisciplines = sqliteTable(
  "sport_disciplines",
  {
    id: text("id").primaryKey(),
    sportId: text("sport_id")
      .notNull()
      .references(() => sports.id),
    name: text("name").notNull(),
    // What unit to record for performance (seconds, metres, kilograms, points, none)
    performanceUnit: text("performance_unit", {
      enum: ["seconds", "metres", "centimetres", "kilograms", "points", "none"],
    }).notNull().default("none"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [uniqueIndex("sport_discipline_uniq").on(t.sportId, t.name)]
);

// Maps sport_admin users to the sports they are responsible for
export const userSportAssignments = sqliteTable(
  "user_sport_assignments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    sportId: text("sport_id").notNull().references(() => sports.id),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [uniqueIndex("user_sport_assignment_uniq").on(t.userId, t.sportId)]
);

// Stores pending Excel import batches awaiting super_admin approval
export const importBatches = sqliteTable("import_batches", {
  id: text("id").primaryKey(),
  uploadedBy: text("uploaded_by").notNull().references(() => users.id),
  type: text("type", { enum: ["players", "results"] }).notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] })
    .notNull()
    .default("pending"),
  sportId: text("sport_id").references(() => sports.id),
  rawData: text("raw_data").notNull(),   // JSON array of parsed rows
  summary: text("summary").notNull(),    // JSON: { total, valid, warnings, errors }
  reviewNotes: text("review_notes"),
  reviewedBy: text("reviewed_by").references(() => users.id),
  reviewedAt: text("reviewed_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type User = typeof users.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Result = typeof results.$inferSelect;
export type AuditLog = typeof auditLog.$inferSelect;
export type Sport = typeof sports.$inferSelect;
export type SportDiscipline = typeof sportDisciplines.$inferSelect;
export type AgeCategory = typeof ageCategories.$inferSelect;
export type UserSportAssignment = typeof userSportAssignments.$inferSelect;
export type ImportBatch = typeof importBatches.$inferSelect;
