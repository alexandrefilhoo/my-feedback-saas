import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  primaryKey,
} from "drizzle-orm/pg-core";

// 1. ORGANIZATIONS (Tenants)
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(), // e.g. app.com/board/acme
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. USERS
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(), // Ties user to Auth provider
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. MEMBERSHIPS (Maps Users to Organizations with Roles)
export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  role: varchar("role", { length: 50 }).default("member").notNull(), // 'admin' | 'member'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. POSTS / FEEDBACK TICKETS
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  authorId: uuid("author_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 50 }).default("under_review").notNull(), // 'under_review' | 'in_progress' | 'completed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. UPVOTES (Ensures 1 vote per user per post)
export const upvotes = pgTable(
  "upvotes",
  {
    postId: uuid("post_id")
      .references(() => posts.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.postId, table.userId] }),
  }),
);
