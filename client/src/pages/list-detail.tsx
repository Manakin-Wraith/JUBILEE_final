import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import NavBar from "@/components/nav-bar";
import Footer from "@/components/footer";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, SlidersHorizontal, Pencil } from "lucide-react";
import { GiftList, GiftItem as GiftItemType } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import GiftItem from "@/components/gift-item";
import GiftItemForm from "@/components/gift-item-form";
import GiftListForm from "@/components/gift-list-form";
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
  DialogDescription,
  DialogHeader
} from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function ListDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [listFormOpen, setListFormOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const listId = id ? parseInt(id) : 0;
  
  // Refs for drag and drop
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  
  // Fetch gift list details
  const { 
    data: list,
    isLoading: isListLoading,
    error: listError
  } = useQuery<GiftList>({
    queryKey: ["/api/gift-lists", listId],
    retry: false,
  });
  
  // Fetch gift items
  const { 
    data: items,
    isLoading: areItemsLoading,
    error: itemsError
  } = useQuery<GiftItemType[]>({
    queryKey: ["/api/gift-lists", listId, "items"],
    enabled: !!list,
    retry: false,
  });
  
  // Mutation for reordering items
  const reorderMutation = useMutation({
    mutationFn: async (items: { id: number, position: number }[]) => {
      const res = await apiRequest("POST", `/api/gift-lists/${listId}/items/reorder`, { items });
      return await res.json();
    },
    onSuccess: (newItems: GiftItemType[]) => {
      queryClient.setQueryData(["/api/gift-lists", listId, "items"], newItems);
    },
    onError: (error) => {
      toast({
        title: "Failed to reorder items",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle drag start
  const handleDragStart = (position: number) => {
    dragItem.current = position;
  };
  
  // Handle drag over
  const handleDragOver = (position: number) => {
    dragOverItem.current = position;
  };
  
  // Handle drop to reorder items
  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null || !items) return;
    
    // Make a copy of the items array
    const itemsCopy = [...items];
    const draggedItemContent = itemsCopy[dragItem.current];
    
    // Remove the dragged item
    itemsCopy.splice(dragItem.current, 1);
    
    // Add it at the new position
    itemsCopy.splice(dragOverItem.current, 0, draggedItemContent);
    
    // Update the positions
    const updatedItems = itemsCopy.map((item, index) => ({
      id: item.id,
      position: index
    }));
    
    // Clear refs
    dragItem.current = null;
    dragOverItem.current = null;
    
    // Call the reorder mutation
    reorderMutation.mutate(updatedItems);
  };
  
  // Filter items based on the selected filter
  const filteredItems = items?.filter(item => {
    if (filter === "all") return true;
    if (filter === "claimed") return item.claimedBy !== null;
    if (filter === "unclaimed") return item.claimedBy === null;
    if (filter === "high") return item.priority === "high";
    if (filter === "medium") return item.priority === "medium";
    if (filter === "low") return item.priority === "low";
    return true;
  });
  
  // Check if the current user is the owner of the list
  const isOwner = list && user ? list.userId === user.id : false;
  
  // If there's an error, show it
  if (listError) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">Error loading gift list</h2>
            <p className="text-gray-500 mb-4">{(listError as Error).message}</p>
            <Button onClick={() => navigate("/")}>Go Back Home</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  // Format event date if available
  const formattedDate = list?.eventDate ? format(new Date(list.eventDate), "MMM d, yyyy") : null;
  
  // Determine list type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case "birthday": return "bg-primary-500";
      case "wedding": return "bg-secondary-500";
      case "holiday": return "bg-accent-500";
      default: return "bg-gray-500";
    }
  };
  
  const typeColorClass = list ? getTypeColor(list.type) : "bg-gray-500";
  
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className={`h-2 w-full ${typeColorClass}`}></div>
            <div className="p-5">
              {isListLoading ? (
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <div className="flex items-center mb-1">
                      <Skeleton className="h-6 w-20 mr-2" />
                      <Skeleton className="h-8 w-48" />
                    </div>
                    <Skeleton className="h-5 w-64" />
                  </div>
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                  <div>
                    <div className="flex items-center mb-1">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mr-2 
                        ${list?.type === "birthday" ? "bg-primary-50 text-primary-600" : 
                          list?.type === "wedding" ? "bg-secondary-50 text-secondary-600" : 
                          list?.type === "holiday" ? "bg-accent-50 text-accent-600" : 
                          "bg-gray-50 text-gray-600"}`}>
                        {list?.type ? list.type.charAt(0).toUpperCase() + list.type.slice(1) : ''}
                      </span>
                      <h2 className="font-heading font-bold text-xl">{list?.title}</h2>
                    </div>
                    <p className="text-gray-500 text-sm">{list?.description}</p>
                    {formattedDate && (
                      <p className="text-sm text-gray-500 mt-1">
                        <span className="inline-flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formattedDate}
                        </span>
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3 mt-4 md:mt-0">
                    {isOwner && (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={() => setListFormOpen(true)}
                          className="text-sm font-medium flex items-center"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit List
                        </Button>
                        <Button 
                          onClick={() => setItemFormOpen(true)}
                          className="text-sm font-medium flex items-center"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {/* Filter Bar */}
              <div className="mb-6 flex justify-end">
                <div className="flex items-center">
                  <SlidersHorizontal className="text-gray-400 h-4 w-4 mr-2" />
                  <Select
                    value={filter}
                    onValueChange={setFilter}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      <SelectItem value="claimed">Claimed Items</SelectItem>
                      <SelectItem value="unclaimed">Unclaimed Items</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="low">Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Gift Items List */}
              <div className="space-y-3">
                {areItemsLoading ? (
                  [...Array(3)].map((_, index) => (
                    <div key={index} className="bg-white rounded-lg border border-gray-100 p-4 flex items-start shadow-sm">
                      <Skeleton className="w-16 h-16 rounded-lg mr-4" />
                      <div className="flex-grow">
                        <div className="flex items-start justify-between">
                          <div>
                            <Skeleton className="h-6 w-40 mb-1" />
                            <div className="flex items-center mt-1">
                              <Skeleton className="h-4 w-16 mr-3" />
                              <Skeleton className="h-4 w-16 mr-3" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        </div>
                        <Skeleton className="h-4 w-full mt-3 mb-3" />
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-10 w-32" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : filteredItems && filteredItems.length > 0 ? (
                  filteredItems.map((item, index) => (
                    <div 
                      key={item.id}
                      draggable={isOwner}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={() => handleDragOver(index)}
                      onDragEnd={handleDrop}
                      className={reorderMutation.isPending && (dragItem.current === index || dragOverItem.current === index) ? "opacity-50" : ""}
                    >
                      <GiftItem 
                        item={item} 
                        isOwner={isOwner} 
                        listId={listId}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No items yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-4">
                      {filter !== "all"
                        ? "Try changing your filter selection"
                        : isOwner
                          ? "Add your first gift item to get started!"
                          : "This gift list doesn't have any items yet."}
                    </p>
                    {isOwner && (
                      <Button onClick={() => setItemFormOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Item
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Item Form Dialog */}
      <Dialog open={itemFormOpen} onOpenChange={setItemFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{list?.title ? `Add Item to ${list.title}` : 'Add Gift Item'}</DialogTitle>
            <DialogDescription>
              Add a new gift item to your wishlist. Fill out the form below with the details of the gift you'd like to receive.
            </DialogDescription>
          </DialogHeader>
          <GiftItemForm 
            listId={listId}
            onSuccess={() => setItemFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* List Edit Form Dialog */}
      <Dialog open={listFormOpen} onOpenChange={setListFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Gift List</DialogTitle>
            <DialogDescription>
              Make changes to your gift list details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <GiftListForm 
            list={list}
            onSuccess={() => setListFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}
