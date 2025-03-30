import { users, giftLists, giftItems, sharedLists } from "@shared/schema";
import type { 
  User, InsertUser, 
  GiftList, InsertGiftList, 
  GiftItem, InsertGiftItem, 
  SharedList, InsertSharedList 
} from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, and, desc, isNull } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

// Interface with CRUD methods
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Gift list operations
  createGiftList(list: InsertGiftList): Promise<GiftList>;
  getGiftList(id: number): Promise<GiftList | undefined>;
  getGiftListsByUserId(userId: number): Promise<GiftList[]>;
  updateGiftList(id: number, list: Partial<GiftList>): Promise<GiftList | undefined>;
  deleteGiftList(id: number): Promise<boolean>;
  
  // Gift item operations
  createGiftItem(item: InsertGiftItem): Promise<GiftItem>;
  getGiftItem(id: number): Promise<GiftItem | undefined>;
  getGiftItemsByListId(listId: number): Promise<GiftItem[]>;
  updateGiftItem(id: number, item: Partial<GiftItem>): Promise<GiftItem | undefined>;
  claimGiftItem(id: number, userId: number): Promise<GiftItem | undefined>;
  unclaimGiftItem(id: number): Promise<GiftItem | undefined>;
  deleteGiftItem(id: number): Promise<boolean>;
  updateGiftItemPositions(items: { id: number, position: number }[]): Promise<boolean>;
  
  // Shared list operations
  shareList(shareInfo: InsertSharedList): Promise<SharedList>;
  getSharedList(id: number): Promise<SharedList | undefined>;
  getSharedListsByUserId(userId: number): Promise<{ sharedList: SharedList, giftList: GiftList }[]>;
  deleteSharedList(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      tableName: 'session'
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Gift list operations
  async createGiftList(insertList: InsertGiftList): Promise<GiftList> {
    const [list] = await db.insert(giftLists).values(insertList).returning();
    return list;
  }
  
  async getGiftList(id: number): Promise<GiftList | undefined> {
    const [list] = await db.select().from(giftLists).where(eq(giftLists.id, id));
    return list;
  }
  
  async getGiftListsByUserId(userId: number): Promise<GiftList[]> {
    return await db.select().from(giftLists).where(eq(giftLists.userId, userId));
  }
  
  async updateGiftList(id: number, listUpdates: Partial<GiftList>): Promise<GiftList | undefined> {
    const [updatedList] = await db
      .update(giftLists)
      .set(listUpdates)
      .where(eq(giftLists.id, id))
      .returning();
    return updatedList;
  }
  
  async deleteGiftList(id: number): Promise<boolean> {
    try {
      // Delete related gift items
      await db.delete(giftItems).where(eq(giftItems.listId, id));
      
      // Delete related shared lists
      await db.delete(sharedLists).where(eq(sharedLists.listId, id));
      
      // Delete the list itself
      const result = await db.delete(giftLists).where(eq(giftLists.id, id)).returning({ id: giftLists.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting gift list:", error);
      return false;
    }
  }
  
  // Gift item operations
  async createGiftItem(insertItem: InsertGiftItem): Promise<GiftItem> {
    const [item] = await db.insert(giftItems).values(insertItem).returning();
    return item;
  }
  
  async getGiftItem(id: number): Promise<GiftItem | undefined> {
    const [item] = await db.select().from(giftItems).where(eq(giftItems.id, id));
    return item;
  }
  
  async getGiftItemsByListId(listId: number): Promise<GiftItem[]> {
    return await db
      .select()
      .from(giftItems)
      .where(eq(giftItems.listId, listId))
      .orderBy(giftItems.position);
  }
  
  async updateGiftItem(id: number, itemUpdates: Partial<GiftItem>): Promise<GiftItem | undefined> {
    const [updatedItem] = await db
      .update(giftItems)
      .set(itemUpdates)
      .where(eq(giftItems.id, id))
      .returning();
    return updatedItem;
  }
  
  async claimGiftItem(id: number, userId: number): Promise<GiftItem | undefined> {
    const [item] = await db
      .update(giftItems)
      .set({ 
        claimedBy: userId, 
        claimedAt: new Date() 
      })
      .where(and(
        eq(giftItems.id, id),
        isNull(giftItems.claimedBy)  // Only claim if not already claimed
      ))
      .returning();
    return item;
  }
  
  async unclaimGiftItem(id: number): Promise<GiftItem | undefined> {
    const [item] = await db
      .update(giftItems)
      .set({ 
        claimedBy: null, 
        claimedAt: null 
      })
      .where(eq(giftItems.id, id))
      .returning();
    return item;
  }
  
  async deleteGiftItem(id: number): Promise<boolean> {
    const result = await db.delete(giftItems).where(eq(giftItems.id, id)).returning({ id: giftItems.id });
    return result.length > 0;
  }
  
  async updateGiftItemPositions(items: { id: number, position: number }[]): Promise<boolean> {
    try {
      for (const { id, position } of items) {
        await db
          .update(giftItems)
          .set({ position })
          .where(eq(giftItems.id, id));
      }
      return true;
    } catch (error) {
      console.error("Error updating item positions:", error);
      return false;
    }
  }
  
  // Shared list operations
  async shareList(insertSharedList: InsertSharedList): Promise<SharedList> {
    const [sharedList] = await db.insert(sharedLists).values(insertSharedList).returning();
    return sharedList;
  }
  
  async getSharedList(id: number): Promise<SharedList | undefined> {
    const [sharedList] = await db.select().from(sharedLists).where(eq(sharedLists.id, id));
    return sharedList;
  }
  
  async getSharedListsByUserId(userId: number): Promise<{ sharedList: SharedList, giftList: GiftList }[]> {
    const shares = await db.select().from(sharedLists).where(eq(sharedLists.userId, userId));
    
    const result: { sharedList: SharedList, giftList: GiftList }[] = [];
    
    for (const share of shares) {
      const [list] = await db.select().from(giftLists).where(eq(giftLists.id, share.listId));
      if (list) {
        result.push({
          sharedList: share,
          giftList: list
        });
      }
    }
    
    return result;
  }
  
  async deleteSharedList(id: number): Promise<boolean> {
    const result = await db.delete(sharedLists).where(eq(sharedLists.id, id)).returning({ id: sharedLists.id });
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
