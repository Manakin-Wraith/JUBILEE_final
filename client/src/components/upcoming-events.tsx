import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { GiftList } from "@shared/schema";
import { compareAsc, format, addDays, differenceInDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

export default function UpcomingEvents() {
  const [, navigate] = useLocation();
  
  // Fetch user's gift lists
  const { data: giftLists, isLoading } = useQuery<GiftList[]>({
    queryKey: ["/api/gift-lists"],
  });
  
  // Get lists with dates and sort them by date ascending
  const upcomingEvents = giftLists
    ?.filter(list => list.eventDate)
    .sort((a, b) => {
      if (a.eventDate && b.eventDate) {
        return compareAsc(new Date(a.eventDate), new Date(b.eventDate));
      }
      return 0;
    })
    .slice(0, 3); // Show only 3 upcoming events
  
  // Calculate days remaining
  const getDaysRemaining = (date: Date | string) => {
    const eventDate = new Date(date);
    const today = new Date();
    return differenceInDays(eventDate, today);
  };
  
  // Get background class based on event type
  const getTypeClassAndColor = (type: string) => {
    switch (type) {
      case "birthday":
        return { bg: "bg-primary-500", className: "celebration-bg" };
      case "wedding":
        return { bg: "bg-secondary-500", className: "celebration-bg" };
      case "holiday":
        return { bg: "bg-accent-500", className: "celebration-bg" };
      default:
        return { bg: "bg-gray-500", className: "bg-gray-50" };
    }
  };
  
  // Get badge class based on event type
  const getBadgeClass = (type: string) => {
    switch (type) {
      case "birthday":
        return "bg-primary-50 text-primary-600";
      case "wedding":
        return "bg-secondary-50 text-secondary-600";
      case "holiday":
        return "bg-accent-50 text-accent-600";
      default:
        return "bg-gray-50 text-gray-600";
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-heading font-semibold">Upcoming Events</h2>
        <a 
          href="#" 
          className="text-secondary text-sm font-medium hover:underline"
          onClick={(e) => {
            e.preventDefault();
            navigate("/calendar");
          }}
        >
          View Calendar
        </a>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(3)].map((_, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 flex items-center">
              <Skeleton className="w-12 h-12 rounded-lg mr-4" />
              <div className="flex-grow">
                <Skeleton className="h-5 w-40 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))
        ) : upcomingEvents && upcomingEvents.length > 0 ? (
          upcomingEvents.map((event) => {
            if (!event.eventDate) return null;
            
            const eventDate = new Date(event.eventDate);
            const daysRemaining = getDaysRemaining(eventDate);
            const { bg, className } = getTypeClassAndColor(event.type);
            const badgeClass = getBadgeClass(event.type);
            
            return (
              <div
                key={event.id}
                className={`bg-gray-50 rounded-lg p-4 flex items-center cursor-pointer ${className}`}
                onClick={() => navigate(`/list/${event.id}`)}
              >
                <div className={`w-12 h-12 rounded-lg ${bg} flex flex-shrink-0 items-center justify-center text-white mr-4`}>
                  <div className="text-center">
                    <div className="text-xs font-bold">
                      {format(eventDate, "MMM").toUpperCase()}
                    </div>
                    <div className="text-lg font-bold leading-none">
                      {format(eventDate, "d")}
                    </div>
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="font-medium text-gray-900">{event.title}</h3>
                  <p className="text-xs text-gray-500">
                    {daysRemaining === 0 
                      ? "Today" 
                      : daysRemaining === 1 
                        ? "Tomorrow" 
                        : `In ${daysRemaining} days`}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`inline-block px-2 py-1 rounded-full ${badgeClass} text-xs font-medium`}>
                    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-3 text-center py-6">
            <p className="text-gray-500">No upcoming events. Create a gift list with an event date to see it here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
