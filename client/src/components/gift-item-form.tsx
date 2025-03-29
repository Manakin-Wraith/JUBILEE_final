import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { GiftItem, insertGiftItemSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Extend the schema with validation
const formSchema = insertGiftItemSchema.omit({ position: true }).extend({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  price: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(["high", "medium", "low"], {
    required_error: "Please select a priority",
  }),
  link: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

interface GiftItemFormProps {
  listId: number;
  item?: GiftItem;
  onSuccess: () => void;
}

export default function GiftItemForm({ listId, item, onSuccess }: GiftItemFormProps) {
  const { toast } = useToast();
  const isEditMode = !!item;
  
  // Initialize the form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item?.name || "",
      description: item?.description || "",
      price: item?.price || "",
      category: item?.category || "",
      priority: (item?.priority as "high" | "medium" | "low") || "medium",
      link: item?.link || "",
    },
  });
  
  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const dataToSend = {
        ...values,
        listId,
      };
      
      const res = await apiRequest("POST", `/api/gift-lists/${listId}/items`, dataToSend);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/gift-lists", listId, "items"] });
      toast({
        title: "Success",
        description: "Gift item added successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add gift item: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await apiRequest("PUT", `/api/gift-items/${item!.id}`, values);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/gift-lists", listId, "items"] });
      toast({
        title: "Success",
        description: "Gift item updated successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update gift item: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: FormValues) => {
    // Normalize empty strings to undefined for optional URL
    const normalizedValues = {
      ...values,
      link: values.link === "" ? undefined : values.link,
    };
    
    if (isEditMode) {
      updateMutation.mutate(normalizedValues);
    } else {
      createMutation.mutate(normalizedValues);
    }
  };
  
  // Available categories
  const categories = [
    "Electronics",
    "Books",
    "Clothing",
    "Home & Kitchen",
    "Toys & Games",
    "Beauty & Personal Care",
    "Sports & Outdoors",
    "Jewelry",
    "Other"
  ];
  
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">{isEditMode ? "Edit Gift Item" : "Add Gift Item"}</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gift Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Bluetooth Speaker"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="$0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category (Optional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="link"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add any details about this gift..."
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onSuccess}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : isEditMode 
                  ? "Update Item" 
                  : "Add Item"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
