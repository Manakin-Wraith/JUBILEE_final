import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ShareListFormProps {
  listId: number;
  onSuccess: () => void;
}

export default function ShareListForm({ listId, onSuccess }: ShareListFormProps) {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  
  const shareMutation = useMutation({
    mutationFn: async (username: string) => {
      await apiRequest("POST", `/api/gift-lists/${listId}/share`, { username });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Gift list shared successfully",
      });
      setUsername("");
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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      shareMutation.mutate(username);
    }
  };
  
  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Share Gift List</h2>
      <p className="text-gray-500 mb-4">Enter the username of the person you want to share this list with.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input 
            type="text" 
            className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        
        <div className="flex justify-end space-x-2 mt-6">
          <button 
            type="button" 
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={onSuccess}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary-600"
            disabled={shareMutation.isPending}
          >
            {shareMutation.isPending ? "Sharing..." : "Share List"}
          </button>
        </div>
      </form>
    </div>
  );
}