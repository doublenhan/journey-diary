import React from 'react';
import { Calendar, Plus, Edit, Trash2, MapPin, Clock } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date: string;
  type: 'dating' | 'wedding' | 'birthday' | 'child_birth' | 'child_birthday' | 'anniversary' | 'custom';
  description?: string;
  location?: string;
  icon: React.ReactNode;
  color: string;
}

interface EventsPageProps {
  theme: any;
  events: Event[];
  onAddEvent: () => void;
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (id: string) => void;
}

const EventsPage: React.FC<EventsPageProps> = ({ 
  theme, 
  events, 
  onAddEvent, 
  onEditEvent, 
  onDeleteEvent 
}) => {
  const calculateTimeSince = (dateString: string) => {
    const eventDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - eventDate.getTime());
    
    const years = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    const days = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));
    
    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}, ${months} month${months > 1 ? 's' : ''}`;
    } else if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''}, ${days} day${days > 1 ? 's' : ''}`;
    } else {
      return `${days} day${days > 1 ? 's' : ''}`;
    }
  };

  const getNextAnniversary = (dateString: string) => {
    const eventDate = new Date(dateString);
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Set anniversary to current year
    const anniversary = new Date(eventDate);
    anniversary.setFullYear(currentYear);
    
    // If anniversary has passed this year, set to next year
    if (anniversary < now) {
      anniversary.setFullYear(currentYear + 1);
    }
    
    const diffTime = anniversary.getTime() - now.getTime();
    const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return daysUntil;
  };

  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
            Our Special Moments
          </h2>
          <p style={{ color: theme.colors.textSecondary }}>
            Track and celebrate all your important milestones together
          </p>
        </div>
        <button
          onClick={onAddEvent}
          className="btn-primary flex items-center space-x-2"
          style={{ background: theme.colors.buttonGradient }}
        >
          <Plus className="w-4 h-4" />
          <span>Add Event</span>
        </button>
      </div>

      {/* Events Timeline */}
      <div className="space-y-6">
        {sortedEvents.map((event) => {
          const timeSince = calculateTimeSince(event.date);
          const nextAnniversary = getNextAnniversary(event.date);
          const isUpcoming = nextAnniversary <= 30;

          return (
            <div
              key={event.id}
              className={`event-card relative overflow-hidden group ${isUpcoming ? 'animate-glow' : ''}`}
              style={{
                backgroundColor: theme.colors.cardBg,
                borderColor: isUpcoming ? event.color : theme.colors.border
              }}
            >
              {/* Action buttons */}
              <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={() => onEditEvent(event)}
                  className="p-2 rounded-lg bg-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                  style={{ color: theme.colors.primary }}
                  title="Edit Event"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteEvent(event.id)}
                  className="p-2 rounded-lg bg-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-red-500 hover:text-red-600"
                  title="Delete Event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Upcoming indicator */}
              {isUpcoming && (
                <div 
                  className="absolute top-0 left-0 px-3 py-1 text-xs text-white font-medium rounded-br-lg"
                  style={{ backgroundColor: event.color }}
                >
                  {nextAnniversary === 0 ? 'Today!' : `${nextAnniversary} days`}
                </div>
              )}

              <div className="flex items-start space-x-4">
                {/* Event Icon */}
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                  style={{ backgroundColor: event.color + '20', color: event.color }}
                >
                  {event.icon}
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0 pr-20">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold" style={{ color: theme.colors.textPrimary }}>
                      {event.title}
                    </h3>
                    <div className="text-right">
                      <div className="text-sm font-medium" style={{ color: event.color }}>
                        {new Date(event.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-sm mb-3" style={{ color: theme.colors.textSecondary }}>
                      {event.description}
                    </p>
                  )}

                  {event.location && (
                    <div className="flex items-center mb-3 text-sm" style={{ color: theme.colors.textSecondary }}>
                      <MapPin className="w-4 h-4 mr-1" />
                      {event.location}
                    </div>
                  )}

                  {/* Time Counter */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-sm" style={{ color: theme.colors.primary }}>
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="font-medium">{timeSince} ago</span>
                      </div>
                      
                      {event.type !== 'custom' && (
                        <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
                          Next anniversary: {nextAnniversary === 0 ? 'Today!' : `${nextAnniversary} days`}
                        </div>
                      )}
                    </div>

                    {/* Anniversary Badge */}
                    {event.type !== 'custom' && (
                      <div 
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: theme.colors.primary + '20',
                          color: theme.colors.primary
                        }}
                      >
                        {new Date().getFullYear() - new Date(event.date).getFullYear()} years
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {events.length === 0 && (
          <div 
            className="text-center py-12 rounded-2xl border-2 border-dashed"
            style={{ borderColor: theme.colors.border }}
          >
            <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: theme.colors.border }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
              No events yet
            </h3>
            <p className="mb-4" style={{ color: theme.colors.textSecondary }}>
              Start by adding your first special moment together
            </p>
            <button
              onClick={onAddEvent}
              className="btn-primary"
              style={{ background: theme.colors.buttonGradient }}
            >
              Add Your First Event
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
