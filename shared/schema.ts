import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  email: text("email").notNull().unique(),
});

export const giftLists = pgTable("gift_lists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  eventDate: timestamp("event_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const giftItems = pgTable("gift_items", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price"),
  category: text("category"),
  priority: text("priority").default("medium"),
  link: text("link"),
  claimedBy: integer("claimed_by"),
  claimedAt: timestamp("claimed_at"),
  position: integer("position").default(0),
});

export const sharedLists = pgTable("shared_lists", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").notNull(),
  userId: integer("user_id").notNull(),
  sharedBy: integer("shared_by").notNull(),
  sharedAt: timestamp("shared_at").defaultNow(),
});

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
