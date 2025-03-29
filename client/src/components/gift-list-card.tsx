import { GiftList } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Share2, Pencil, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import GiftListForm from "./gift-list-form";
import ShareListForm from "./share-list-form";

interface GiftListCardProps {
  list: GiftList;
  isShared?: boolean;
}

// Define interface for items with claiming information
interface GiftItemWithClaim {
  id: number;
  claimedBy: number | null;
}

export default function GiftListCard({ list, isShared = false }: GiftListCardProps) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Fetch gift items for this list to show claimed count
  const { data: items } = useQuery<GiftItemWithClaim[]>({
    queryKey: ["/api/gift-lists", list.id, "items"],
    enabled: !!list.id,
  });
  
  // Delete list mutation
  const deleteMutation = useMutation({
    mutationFn: async (listId: number) => {
      await apiRequest("DELETE", `/api/gift-lists/${listId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gift-lists"] });
      toast({
        title: "Success",
        description: "Gift list deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete list: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Count claimed items
  const claimedItemsCount = items?.filter(item => item.claimedBy !== null).length || 0;
  const totalItemsCount = items?.length || 0;
  
  // Determine list type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case "birthday": return "bg-primary-500";
      case "wedding": return "bg-secondary-500";
      case "holiday": return "bg-accent-500";
      default: return "bg-gray-500";
    }
  };
  
  // Determine badge class based on event type
  const getBadgeClass = (type: string) => {
    switch (type) {
      case "birthday": return "bg-primary-50 text-primary-600";
      case "wedding": return "bg-secondary-50 text-secondary-600";
      case "holiday": return "bg-accent-50 text-accent-600";
      default: return "bg-gray-50 text-gray-600";
    }
  };
  
  return (
    <div 
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={(e) => {
        // Don't navigate if clicking on dropdown menu or buttons
        if ((e.target as HTMLElement).closest('.click-stop')) {
          e.stopPropagation();
          return;
        }
        navigate(`/list/${list.id}`);
      }}
    >
      <div className={`h-2 ${getTypeColor(list.type)} w-full`}></div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className={`inline-block px-2 py-1 rounded-full ${getBadgeClass(list.type)} text-xs font-medium mb-2`}>
              {list.type.charAt(0).toUpperCase() + list.type.slice(1)}
            </span>
            <h3 className="font-heading font-semibold text-lg">{list.title}</h3>
          </div>
          
          {!isShared && (
            <div className="flex space-x-1 click-stop">
              <button 
                className="text-gray-400 hover:text-gray-600 p-1"
                onClick={() => setEditDialogOpen(true)}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-gray-400 hover:text-gray-600 p-1">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShareDialogOpen(true)}>
                    Share List
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-red-500">
                    Delete List
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        
        <p className="text-gray-500 text-sm mb-4">{list.description}</p>
        
        <div className="flex justify-between items-center text-sm mb-4">
          <div>
            <span className="text-gray-500">{totalItemsCount} items</span>
            {totalItemsCount > 0 && (
              <>
                <span className="mx-2 text-gray-300">•</span>
                <span className="text-green-600 font-medium">{claimedItemsCount} claimed</span>
              </>
            )}
          </div>
          {list.eventDate && (
            <div className="text-gray-500">
              <span className="inline-flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {format(new Date(list.eventDate), "MMM d, yyyy")}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex -space-x-2">
            <Avatar className="w-7 h-7 border-2 border-white">
              <AvatarFallback className="bg-secondary-100 text-secondary-700 text-xs">
                {user?.displayName?.substring(0, 2).toUpperCase() || user?.username?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* This would show additional avatars for people who have access to the list */}
          </div>
          
          {!isShared && (
            <div className="click-stop">
              <button 
                className="text-secondary hover:text-secondary-600 text-sm font-medium flex items-center"
                onClick={() => setShareDialogOpen(true)}
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Edit List Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <VisuallyHidden>
            <DialogTitle>Edit Gift List</DialogTitle>
          </VisuallyHidden>
          <GiftListForm 
            list={list}
            onSuccess={() => setEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Share List Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <VisuallyHidden>
            <DialogTitle>Share Gift List</DialogTitle>
          </VisuallyHidden>
          <ShareListForm 
            listId={list.id}
            onSuccess={() => setShareDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the gift list and all its items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600"
              onClick={() => {
                deleteMutation.mutate(list.id);
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


