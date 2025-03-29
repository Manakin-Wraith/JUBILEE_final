import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import GiftListForm from "@/components/gift-list-form";
import { Calendar, PlusCircle, Share2, Settings } from "lucide-react";
import { useLocation } from "wouter";

export default function QuickActions() {
  const [, navigate] = useLocation();
  const [listFormOpen, setListFormOpen] = useState(false);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <button 
        onClick={() => setListFormOpen(true)}
        className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-center flex-col hover:border-primary transition-all duration-200"
      >
        <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center mb-3">
          <PlusCircle className="h-5 w-5 text-primary" />
        </div>
        <span className="text-sm font-medium">New Gift List</span>
      </button>
      
      <button 
        onClick={() => navigate("/calendar")}
        className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-center flex-col hover:border-secondary transition-all duration-200"
      >
        <div className="w-10 h-10 rounded-full bg-secondary-50 flex items-center justify-center mb-3">
          <Calendar className="h-5 w-5 text-secondary" />
        </div>
        <span className="text-sm font-medium">Add Event</span>
      </button>
      
      <button 
        onClick={() => navigate("/my-lists")}
        className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-center flex-col hover:border-accent transition-all duration-200"
      >
        <div className="w-10 h-10 rounded-full bg-accent-50 flex items-center justify-center mb-3">
          <Share2 className="h-5 w-5 text-accent" />
        </div>
        <span className="text-sm font-medium">Share List</span>
      </button>
      
      <button className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-center flex-col hover:border-gray-300 transition-all duration-200">
        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-3">
          <Settings className="h-5 w-5 text-gray-500" />
        </div>
        <span className="text-sm font-medium">Settings</span>
      </button>
      
      <Dialog open={listFormOpen} onOpenChange={setListFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <GiftListForm 
            onSuccess={() => {
              setListFormOpen(false);
              navigate("/my-lists");
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
