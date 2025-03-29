import { GiftItem as GiftItemType } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, ExternalLink, Gift, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import GiftItemForm from "./gift-item-form";

interface GiftItemProps {
  item: GiftItemType;
  isOwner: boolean;
  listId: number;
}

export default function GiftItem({ item, isOwner, listId }: GiftItemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Determine if the current user claimed this item
  const isClaimedByCurrentUser = item.claimedBy === user?.id;
  
  // Claim item mutation
  const claimMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/gift-items/${item.id}/claim`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gift-lists", listId, "items"] });
      toast({
        title: "Success",
        description: "Item claimed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to claim item: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Unclaim item mutation
  const unclaimMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/gift-items/${item.id}/unclaim`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gift-lists", listId, "items"] });
      toast({
        title: "Success",
        description: "Item unclaimed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to unclaim item: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Delete item mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/gift-items/${item.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gift-lists", listId, "items"] });
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete item: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Get priority badge class
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-secondary-50 text-secondary-700";
      case "medium":
        return "bg-gray-100 text-gray-700";
      case "low":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };
  
  // Get icon based on category (simplified example)
  const getCategoryIcon = (category?: string) => {
    if (!category) return null;
    
    switch (category.toLowerCase()) {
      case "electronics":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case "books":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case "clothing":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
    }
  };
  
  // Format for is claimed
  const isClaimed = !!item.claimedBy;
  
  return (
    <div className={`gift-item ${isClaimed ? 'bg-gray-50' : 'bg-white'} rounded-lg border border-gray-100 p-4 flex items-start gift-item-shadow ${!isClaimed ? 'gift-item-hover' : ''} transition-all duration-200`}>
      <div className={`w-16 h-16 rounded-lg ${isClaimed ? 'bg-gray-200' : 'bg-gray-100'} flex items-center justify-center flex-shrink-0 mr-4 relative`}>
        {getCategoryIcon(item.category)}
        {isClaimed && (
          <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      
      <div className="flex-grow">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center">
              <h3 className={`font-medium ${isClaimed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                {item.name}
              </h3>
              {isClaimed && (
                <Badge className="ml-2 bg-green-500 text-white hover:bg-green-500">Claimed</Badge>
              )}
            </div>
            <div className="flex items-center flex-wrap mt-1">
              {item.price && (
                <span className={`text-sm ${isClaimed ? 'text-gray-400 line-through' : 'text-accent-500 font-medium'}`}>
                  {item.price}
                </span>
              )}
              
              {item.category && (
                <>
                  <span className="mx-2 text-gray-300">•</span>
                  <span className={`text-xs ${isClaimed ? 'text-gray-400' : 'text-gray-500'} inline-flex items-center`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {item.category}
                  </span>
                </>
              )}
              
              {item.priority && (
                <>
                  <span className="mx-2 text-gray-300">•</span>
                  <Badge variant="outline" className={`${getPriorityBadgeClass(item.priority)}`}>
                    {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} Priority
                  </Badge>
                </>
              )}
            </div>
          </div>
          
          {isOwner && !isClaimed && (
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-gray-600"
                title="Edit"
                onClick={() => setEditDialogOpen(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-red-500"
                title="Delete"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline"
                size="icon"
                className="border border-gray-100 hover:bg-gray-50"
                title="Drag to reorder"
              >
                <GripVertical className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          )}
        </div>
        
        {item.description && (
          <p className={`text-sm ${isClaimed ? 'text-gray-400' : 'text-gray-500'} mt-2 mb-3`}>
            {item.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          {item.link ? (
            <a 
              href={item.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`text-sm ${isClaimed ? 'text-gray-400' : 'text-secondary hover:text-secondary-600'} inline-flex items-center`}
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View Product
            </a>
          ) : (
            <div></div> // Empty div for layout
          )}
          
          {!isOwner && !isClaimed && (
            <Button
              size="sm"
              className="claim-button bg-primary hover:bg-primary-600 text-white"
              onClick={() => claimMutation.mutate()}
              disabled={claimMutation.isPending}
            >
              <Gift className="h-3 w-3 mr-1" />
              {claimMutation.isPending ? "Claiming..." : "Claim This Gift"}
            </Button>
          )}
          
          {isClaimedByCurrentUser && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => unclaimMutation.mutate()}
              disabled={unclaimMutation.isPending}
            >
              {unclaimMutation.isPending ? "Unclaiming..." : "Unclaim Gift"}
            </Button>
          )}
          
          {isClaimed && !isClaimedByCurrentUser && (
            <div className="text-sm text-gray-400">
              <span>Claimed by someone</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Edit Item Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <GiftItemForm 
            listId={listId}
            item={item}
            onSuccess={() => setEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this gift item. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600"
              onClick={() => {
                deleteMutation.mutate();
                setDeleteDialogOpen(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
