import { pgTable, text, serial, integer, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  email: text("email").notNull().unique(),
});

export const usersRelations = relations(users, ({ many }) => ({
  lists: many(giftLists),
  sharedLists: many(sharedLists, { relationName: "shared_with" }),
  sharedByMe: many(sharedLists, { relationName: "shared_by" }),
}));

export const giftLists = pgTable("gift_lists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  eventDate: timestamp("event_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const giftListsRelations = relations(giftLists, ({ one, many }) => ({
  user: one(users, {
    fields: [giftLists.userId],
    references: [users.id],
  }),
  items: many(giftItems),
  shares: many(sharedLists),
}));

export const giftItems = pgTable("gift_items", {
  id: serial("id").primaryKey(),
  listId: integer("list_id")
    .notNull()
    .references(() => giftLists.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price"),
  category: text("category"),
  priority: text("priority").default("medium"),
  link: text("link"),
  imageUrl: text("image_url"),
  claimedBy: integer("claimed_by").references(() => users.id, { onDelete: "set null" }),
  claimedAt: timestamp("claimed_at"),
  position: integer("position").default(0),
});

export const giftItemsRelations = relations(giftItems, ({ one }) => ({
  list: one(giftLists, {
    fields: [giftItems.listId],
    references: [giftLists.id],
  }),
  claimedByUser: one(users, {
    fields: [giftItems.claimedBy],
    references: [users.id],
  }),
}));

export const sharedLists = pgTable("shared_lists", {
  id: serial("id").primaryKey(),
  listId: integer("list_id")
    .notNull()
    .references(() => giftLists.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sharedBy: integer("shared_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sharedAt: timestamp("shared_at").defaultNow(),
});

export const sharedListsRelations = relations(sharedLists, ({ one }) => ({
  list: one(giftLists, {
    fields: [sharedLists.listId],
    references: [giftLists.id],
  }),
  user: one(users, {
    fields: [sharedLists.userId],
    references: [users.id],
    relationName: "shared_with",
  }),
  sharedByUser: one(users, {
    fields: [sharedLists.sharedBy],
    references: [users.id],
    relationName: "shared_by",
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  email: true,
});

export const insertGiftListSchema = createInsertSchema(giftLists).pick({
  userId: true,
  title: true,
  description: true,
  type: true,
  eventDate: true,
});

export const insertGiftItemSchema = createInsertSchema(giftItems).pick({
  listId: true,
  name: true,
  description: true,
  price: true,
  category: true,
  priority: true,
  link: true,
  imageUrl: true,
  position: true,
});

export const insertSharedListSchema = createInsertSchema(sharedLists).pick({
  listId: true,
  userId: true,
  sharedBy: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type GiftList = typeof giftLists.$inferSelect;
export type InsertGiftList = z.infer<typeof insertGiftListSchema>;

export type GiftItem = typeof giftItems.$inferSelect;
export type InsertGiftItem = z.infer<typeof insertGiftItemSchema>;

export type SharedList = typeof sharedLists.$inferSelect;
export type InsertSharedList = z.infer<typeof insertSharedListSchema>;
