import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";

interface ShareListFormProps {
  listId: number;
  onSuccess: () => void;
}

// Form validation schema
const formSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function ShareListForm({ listId, onSuccess }: ShareListFormProps) {
  const { toast } = useToast();
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  });
  
  const shareMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      await apiRequest("POST", `/api/gift-lists/${listId}/share`, { username: values.username });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Gift list shared successfully",
      });
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to share list: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: FormValues) => {
    shareMutation.mutate(values);
  };
  
  return (
    <div>
      <DialogHeader>
        <DialogTitle>Share Gift List</DialogTitle>
        <DialogDescription>
          Enter the username of the person you want to share this list with.
        </DialogDescription>
      </DialogHeader>
      
      <div className="py-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter username to share with" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onSuccess}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={shareMutation.isPending}
              >
                {shareMutation.isPending ? (
                  "Sharing..."
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Share List
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}