import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import NavBar from "@/components/nav-bar";
import Footer from "@/components/footer";
import QuickActions from "@/components/quick-actions";
import UpcomingEvents from "@/components/upcoming-events";
import GiftListCard from "@/components/gift-list-card";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { GiftList } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  
  // Fetch user's gift lists
  const { data: giftLists, isLoading } = useQuery<GiftList[]>({
    queryKey: ["/api/gift-lists"],
  });
  
  // Filter gift lists based on search term and type filter
  const filteredLists = giftLists?.filter(list => {
    const matchesSearch = list.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (list.description && list.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterType === "all" || list.type === filterType;
    
    return matchesSearch && matchesFilter;
  });
  
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-2">
              Welcome back, {user?.displayName || user?.username}!
            </h1>
            <p className="text-gray-500">Manage your gift lists and see what friends have shared with you.</p>
          </div>
          
          <QuickActions />
          <UpcomingEvents />
          
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading font-semibold">My Lists</h2>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search lists..."
                    className="pl-8 pr-3 py-2"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                </div>
                <Select
                  value={filterType}
                  onValueChange={setFilterType}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="wedding">Wedding</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <Skeleton className="h-2 w-full" />
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <Skeleton className="h-5 w-20 mb-2" />
                          <Skeleton className="h-6 w-40" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-full mb-4" />
                      <div className="flex justify-between items-center mb-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex -space-x-2">
                          <Skeleton className="h-7 w-7 rounded-full" />
                          <Skeleton className="h-7 w-7 rounded-full" />
                        </div>
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredLists && filteredLists.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredLists.map((list) => (
                  <GiftListCard key={list.id} list={list} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-100">
                <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No gift lists found</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  {searchTerm || filterType !== "all" 
                    ? "Try changing your search or filter criteria"
                    : "Create your first gift list to get started!"}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
