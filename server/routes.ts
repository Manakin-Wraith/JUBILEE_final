import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertGiftListSchema, insertGiftItemSchema, insertSharedListSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Gift Lists CRUD
  app.get("/api/gift-lists", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const userId = req.user!.id;
    const lists = await storage.getGiftListsByUserId(userId);
    res.json(lists);
  });
  
  app.get("/api/gift-lists/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const listId = parseInt(req.params.id);
    const list = await storage.getGiftList(listId);
    
    if (!list) return res.status(404).send("Gift list not found");
    
    // Only allow access to own lists or shared lists
    if (list.userId !== req.user!.id) {
      const userShares = await storage.getSharedListsByUserId(req.user!.id);
      const hasAccess = userShares.some(share => share.giftList.id === listId);
      
      if (!hasAccess) return res.status(403).send("Unauthorized to view this list");
    }
    
    res.json(list);
  });
  
  app.post("/api/gift-lists", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const userId = req.user!.id;
      const validatedData = insertGiftListSchema.parse({
        ...req.body,
        userId
      });
      
      const newList = await storage.createGiftList(validatedData);
      res.status(201).json(newList);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).send("Server error");
    }
  });
  
  app.put("/api/gift-lists/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const listId = parseInt(req.params.id);
    const list = await storage.getGiftList(listId);
    
    if (!list) return res.status(404).send("Gift list not found");
    if (list.userId !== req.user!.id) return res.status(403).send("Unauthorized to update this list");
    
    try {
      const updatedList = await storage.updateGiftList(listId, req.body);
      res.json(updatedList);
    } catch (error) {
      res.status(500).send("Server error");
    }
  });
  
  app.delete("/api/gift-lists/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const listId = parseInt(req.params.id);
    const list = await storage.getGiftList(listId);
    
    if (!list) return res.status(404).send("Gift list not found");
    if (list.userId !== req.user!.id) return res.status(403).send("Unauthorized to delete this list");
    
    const success = await storage.deleteGiftList(listId);
    
    if (success) {
      res.status(204).send();
    } else {
      res.status(500).send("Failed to delete list");
    }
  });
  
  // Gift Items CRUD
  app.get("/api/gift-lists/:listId/items", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const listId = parseInt(req.params.listId);
    const list = await storage.getGiftList(listId);
    
    if (!list) return res.status(404).send("Gift list not found");
    
    // Check if user has access to the list
    if (list.userId !== req.user!.id) {
      const userShares = await storage.getSharedListsByUserId(req.user!.id);
      const hasAccess = userShares.some(share => share.giftList.id === listId);
      
      if (!hasAccess) return res.status(403).send("Unauthorized to view this list");
    }
    
    const items = await storage.getGiftItemsByListId(listId);
    res.json(items);
  });
  
  app.post("/api/gift-lists/:listId/items", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const listId = parseInt(req.params.listId);
    const list = await storage.getGiftList(listId);
    
    if (!list) return res.status(404).send("Gift list not found");
    if (list.userId !== req.user!.id) return res.status(403).send("Unauthorized to add items to this list");
    
    try {
      // Get current items to determine position
      const currentItems = await storage.getGiftItemsByListId(listId);
      const nextPosition = currentItems.length;
      
      const validatedData = insertGiftItemSchema.parse({
        ...req.body,
        listId,
        position: nextPosition
      });
      
      const newItem = await storage.createGiftItem(validatedData);
      res.status(201).json(newItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).send("Server error");
    }
  });
  
  app.put("/api/gift-items/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const itemId = parseInt(req.params.id);
    const item = await storage.getGiftItem(itemId);
    
    if (!item) return res.status(404).send("Gift item not found");
    
    // Check if user owns the list containing this item
    const list = await storage.getGiftList(item.listId);
    if (!list || list.userId !== req.user!.id) {
      return res.status(403).send("Unauthorized to update this item");
    }
    
    try {
      const updatedItem = await storage.updateGiftItem(itemId, req.body);
      res.json(updatedItem);
    } catch (error) {
      res.status(500).send("Server error");
    }
  });
  
  app.delete("/api/gift-items/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const itemId = parseInt(req.params.id);
    const item = await storage.getGiftItem(itemId);
    
    if (!item) return res.status(404).send("Gift item not found");
    
    // Check if user owns the list containing this item
    const list = await storage.getGiftList(item.listId);
    if (!list || list.userId !== req.user!.id) {
      return res.status(403).send("Unauthorized to delete this item");
    }
    
    const success = await storage.deleteGiftItem(itemId);
    
    if (success) {
      res.status(204).send();
    } else {
      res.status(500).send("Failed to delete item");
    }
  });
  
  // Claim/unclaim gift items
  app.post("/api/gift-items/:id/claim", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const itemId = parseInt(req.params.id);
    const item = await storage.getGiftItem(itemId);
    
    if (!item) return res.status(404).send("Gift item not found");
    if (item.claimedBy) return res.status(400).send("Item already claimed");
    
    // Get the list to check if user has access
    const list = await storage.getGiftList(item.listId);
    if (!list) return res.status(404).send("Gift list not found");
    
    // Users cannot claim items from their own lists
    if (list.userId === req.user!.id) {
      return res.status(403).send("Cannot claim items from your own list");
    }
    
    // Check if the user has access to the list via sharing
    const userShares = await storage.getSharedListsByUserId(req.user!.id);
    const hasAccess = userShares.some(share => share.giftList.id === list.id);
    
    if (!hasAccess) {
      return res.status(403).send("Unauthorized to claim this item");
    }
    
    try {
      const claimedItem = await storage.claimGiftItem(itemId, req.user!.id);
      res.json(claimedItem);
    } catch (error) {
      res.status(500).send("Server error");
    }
  });
  
  app.post("/api/gift-items/:id/unclaim", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const itemId = parseInt(req.params.id);
    const item = await storage.getGiftItem(itemId);
    
    if (!item) return res.status(404).send("Gift item not found");
    if (!item.claimedBy) return res.status(400).send("Item not claimed yet");
    
    // Only the user who claimed it can unclaim
    if (item.claimedBy !== req.user!.id) {
      return res.status(403).send("Only the user who claimed this item can unclaim it");
    }
    
    try {
      const unclaimedItem = await storage.unclaimGiftItem(itemId);
      res.json(unclaimedItem);
    } catch (error) {
      res.status(500).send("Server error");
    }
  });
  
  // Update item positions (for drag-and-drop reordering)
  app.post("/api/gift-lists/:listId/items/reorder", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const listId = parseInt(req.params.listId);
    const list = await storage.getGiftList(listId);
    
    if (!list) return res.status(404).send("Gift list not found");
    if (list.userId !== req.user!.id) return res.status(403).send("Unauthorized to reorder items in this list");
    
    try {
      const items = req.body.items;
      if (!Array.isArray(items)) {
        return res.status(400).send("Invalid items array");
      }
      
      const success = await storage.updateGiftItemPositions(items);
      
      if (success) {
        const updatedItems = await storage.getGiftItemsByListId(listId);
        res.json(updatedItems);
      } else {
        res.status(500).send("Failed to reorder items");
      }
    } catch (error) {
      res.status(500).send("Server error");
    }
  });
  
  // Shared Lists
  app.get("/api/shared-lists", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const userId = req.user!.id;
    const sharedLists = await storage.getSharedListsByUserId(userId);
    res.json(sharedLists);
  });
  
  app.post("/api/gift-lists/:listId/share", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const listId = parseInt(req.params.listId);
    const list = await storage.getGiftList(listId);
    
    if (!list) return res.status(404).send("Gift list not found");
    if (list.userId !== req.user!.id) return res.status(403).send("Unauthorized to share this list");
    
    try {
      const { username } = req.body;
      if (!username) return res.status(400).send("Username is required");
      
      const targetUser = await storage.getUserByUsername(username);
      if (!targetUser) return res.status(404).send("User not found");
      
      // Don't share with yourself
      if (targetUser.id === req.user!.id) {
        return res.status(400).send("Cannot share list with yourself");
      }
      
      // Check if already shared
      const userShares = await storage.getSharedListsByUserId(targetUser.id);
      const alreadyShared = userShares.some(share => share.giftList.id === listId);
      
      if (alreadyShared) {
        return res.status(400).send("List already shared with this user");
      }
      
      const validatedData = insertSharedListSchema.parse({
        listId,
        userId: targetUser.id,
        sharedBy: req.user!.id
      });
      
      const sharedList = await storage.shareList(validatedData);
      res.status(201).json(sharedList);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).send("Server error");
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
