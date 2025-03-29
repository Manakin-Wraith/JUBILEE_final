import { users, giftLists, giftItems, sharedLists } from "@shared/schema";
import type { 
  User, InsertUser, 
  GiftList, InsertGiftList, 
  GiftItem, InsertGiftItem, 
  SharedList, InsertSharedList 
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private giftLists: Map<number, GiftList>;
  private giftItems: Map<number, GiftItem>;
  private sharedLists: Map<number, SharedList>;
  
  currentUserId: number;
  currentGiftListId: number;
  currentGiftItemId: number;
  currentSharedListId: number;
  sessionStore: session.SessionStore;
  
  constructor() {
    this.users = new Map();
    this.giftLists = new Map();
    this.giftItems = new Map();
    this.sharedLists = new Map();
    
    this.currentUserId = 1;
    this.currentGiftListId = 1;
    this.currentGiftItemId = 1;
    this.currentSharedListId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Gift list operations
  async createGiftList(insertList: InsertGiftList): Promise<GiftList> {
    const id = this.currentGiftListId++;
    const createdAt = new Date();
    const list: GiftList = { ...insertList, id, createdAt };
    
    this.giftLists.set(id, list);
    return list;
  }
  
  async getGiftList(id: number): Promise<GiftList | undefined> {
    return this.giftLists.get(id);
  }
  
  async getGiftListsByUserId(userId: number): Promise<GiftList[]> {
    return Array.from(this.giftLists.values()).filter(
      (list) => list.userId === userId
    );
  }
  
  async updateGiftList(id: number, listUpdates: Partial<GiftList>): Promise<GiftList | undefined> {
    const list = this.giftLists.get(id);
    if (!list) return undefined;
    
    const updatedList = { ...list, ...listUpdates };
    this.giftLists.set(id, updatedList);
    return updatedList;
  }
  
  async deleteGiftList(id: number): Promise<boolean> {
    // Delete related gift items
    const itemsToDelete = Array.from(this.giftItems.values()).filter(
      (item) => item.listId === id
    );
    
    for (const item of itemsToDelete) {
      this.giftItems.delete(item.id);
    }
    
    // Delete related shared lists
    const sharesToDelete = Array.from(this.sharedLists.values()).filter(
      (share) => share.listId === id
    );
    
    for (const share of sharesToDelete) {
      this.sharedLists.delete(share.id);
    }
    
    return this.giftLists.delete(id);
  }
  
  // Gift item operations
  async createGiftItem(insertItem: InsertGiftItem): Promise<GiftItem> {
    const id = this.currentGiftItemId++;
    const item: GiftItem = { ...insertItem, id, claimedBy: null, claimedAt: null };
    
    this.giftItems.set(id, item);
    return item;
  }
  
  async getGiftItem(id: number): Promise<GiftItem | undefined> {
    return this.giftItems.get(id);
  }
  
  async getGiftItemsByListId(listId: number): Promise<GiftItem[]> {
    return Array.from(this.giftItems.values())
      .filter((item) => item.listId === listId)
      .sort((a, b) => a.position - b.position);
  }
  
  async updateGiftItem(id: number, itemUpdates: Partial<GiftItem>): Promise<GiftItem | undefined> {
    const item = this.giftItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...itemUpdates };
    this.giftItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async claimGiftItem(id: number, userId: number): Promise<GiftItem | undefined> {
    const item = this.giftItems.get(id);
    if (!item || item.claimedBy) return undefined;
    
    const claimedItem = { 
      ...item, 
      claimedBy: userId, 
      claimedAt: new Date() 
    };
    
    this.giftItems.set(id, claimedItem);
    return claimedItem;
  }
  
  async unclaimGiftItem(id: number): Promise<GiftItem | undefined> {
    const item = this.giftItems.get(id);
    if (!item) return undefined;
    
    const unclaimedItem = { 
      ...item, 
      claimedBy: null, 
      claimedAt: null 
    };
    
    this.giftItems.set(id, unclaimedItem);
    return unclaimedItem;
  }
  
  async deleteGiftItem(id: number): Promise<boolean> {
    return this.giftItems.delete(id);
  }
  
  async updateGiftItemPositions(items: { id: number, position: number }[]): Promise<boolean> {
    try {
      for (const { id, position } of items) {
        const item = this.giftItems.get(id);
        if (item) {
          this.giftItems.set(id, { ...item, position });
        }
      }
      return true;
    } catch (error) {
      return false;
    }
  }
  
  // Shared list operations
  async shareList(insertSharedList: InsertSharedList): Promise<SharedList> {
    const id = this.currentSharedListId++;
    const sharedAt = new Date();
    const sharedList: SharedList = { ...insertSharedList, id, sharedAt };
    
    this.sharedLists.set(id, sharedList);
    return sharedList;
  }
  
  async getSharedList(id: number): Promise<SharedList | undefined> {
    return this.sharedLists.get(id);
  }
  
  async getSharedListsByUserId(userId: number): Promise<{ sharedList: SharedList, giftList: GiftList }[]> {
    const userShares = Array.from(this.sharedLists.values()).filter(
      (share) => share.userId === userId
    );
    
    return userShares.map(share => {
      const giftList = this.giftLists.get(share.listId);
      return {
        sharedList: share,
        giftList: giftList!
      };
    }).filter(item => item.giftList !== undefined);
  }
  
  async deleteSharedList(id: number): Promise<boolean> {
    return this.sharedLists.delete(id);
  }
}

export const storage = new MemStorage();
