import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import NavBar from "@/components/nav-bar";
import Footer from "@/components/footer";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { GiftList } from "@shared/schema";
import { useState } from "react";
import { format, isSameDay } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Gift, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { DayProps, DayContent } from "react-day-picker";

export default function Calendar() {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [, navigate] = useLocation();
  
  // Fetch user's gift lists
  const { data: giftLists, isLoading } = useQuery<GiftList[]>({
    queryKey: ["/api/gift-lists"],
  });
  
  // Filter lists for the selected date
  const listsForSelectedDate = date ? giftLists?.filter(list => {
    if (!list.eventDate) return false;
    
    try {
      const eventDate = new Date(list.eventDate);
      return !isNaN(eventDate.getTime()) && isSameDay(eventDate, date);
    } catch (error) {
      console.error("Error comparing dates:", error, list.eventDate);
      return false;
    }
  }) : [];
  
  // Create a map of dates with events for the calendar highlighting
  const eventDates = giftLists?.reduce((dates, list) => {
    if (list.eventDate) {
      try {
        const eventDate = new Date(list.eventDate);
        if (!isNaN(eventDate.getTime())) {
          const dateStr = format(eventDate, "yyyy-MM-dd");
          dates[dateStr] = true;
        }
      } catch (error) {
        console.error("Error parsing list event date:", error, list.eventDate);
      }
    }
    return dates;
  }, {} as Record<string, boolean>) || {};
  
  // Custom style for calendar - adds event dots without using custom Day components
  const calendarStyles = giftLists?.reduce((styles, list) => {
    if (list.eventDate) {
      try {
        const eventDate = new Date(list.eventDate);
        if (!isNaN(eventDate.getTime())) {
          // Create a unique class name for each event date
          const dateKey = format(eventDate, "yyyy-MM-dd");
          styles += `
            .rdp-day_${dateKey} button::after {
              content: '';
              position: absolute;
              bottom: 4px;
              left: 50%;
              transform: translateX(-50%);
              width: 4px;
              height: 4px;
              background-color: var(--primary);
              border-radius: 50%;
            }
          `;
        }
      } catch (error) {
        console.error("Error parsing list event date:", error, list.eventDate);
      }
    }
    return styles;
  }, "") || "";
  
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-2">Gift Calendar</h1>
            <p className="text-gray-500">Track all your gift-giving occasions in one place</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  {isLoading ? (
                    <Skeleton className="h-[350px] w-full" />
                  ) : (
                    <>
                      <style>{calendarStyles}</style>
                      <CalendarComponent
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border"
                        modifiersClassNames={{
                          selected: "bg-primary text-primary-foreground",
                          today: "bg-accent text-accent-foreground",
                        }}
                        modifiers={{
                          ...giftLists?.reduce((modifiers, list) => {
                            if (list.eventDate) {
                              try {
                                const eventDate = new Date(list.eventDate);
                                if (!isNaN(eventDate.getTime())) {
                                  const dateKey = format(eventDate, "yyyy-MM-dd");
                                  modifiers[dateKey] = eventDate;
                                }
                              } catch (error) {
                                console.error("Error creating modifier:", error);
                              }
                            }
                            return modifiers;
                          }, {} as Record<string, Date>) || {}
                        }}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Events for Selected Date */}
            <div>
              <div className="sticky top-4">
                <h2 className="text-lg font-medium mb-4 flex items-center">
                  <CalendarIcon className="mr-2 h-5 w-5 text-gray-400" />
                  {date ? (
                    <span>Events on {format(date, "MMMM d, yyyy")}</span>
                  ) : (
                    <span>Select a date</span>
                  )}
                </h2>
                
                {isLoading ? (
                  [...Array(2)].map((_, index) => (
                    <Card key={index} className="mb-4">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <Skeleton className="h-5 w-16 mb-2" />
                            <Skeleton className="h-6 w-40 mb-1" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : listsForSelectedDate && listsForSelectedDate.length > 0 ? (
                  listsForSelectedDate.map(list => (
                    <Card key={list.id} className="mb-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/list/${list.id}`)}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <Badge className={`mb-2 
                              ${list.type === "birthday" ? "bg-primary-50 text-primary-600 hover:bg-primary-50" : 
                                list.type === "wedding" ? "bg-secondary-50 text-secondary-600 hover:bg-secondary-50" : 
                                list.type === "holiday" ? "bg-accent-50 text-accent-600 hover:bg-accent-50" : 
                                "bg-gray-50 text-gray-600 hover:bg-gray-50"}`}
                            >
                              {list.type.charAt(0).toUpperCase() + list.type.slice(1)}
                            </Badge>
                            <h3 className="font-medium mb-1">{list.title}</h3>
                            <p className="text-xs text-gray-500">{list.description}</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-100">
                    <Gift className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No events</h3>
                    <p className="text-sm text-gray-500">
                      {date 
                        ? `There are no gift lists scheduled for ${format(date, "MMMM d, yyyy")}`
                        : "Select a date to see events"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
