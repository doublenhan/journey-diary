import React, { useState, useEffect } from 'react';
import { Heart, Calendar, ArrowLeft, Star, Gift, Camera, MapPin, Sparkles, Award, Crown, Coffee, Plane, Home, BellRing as Ring } from 'lucide-react';
import { memoriesApi, Milestone as ApiMilestone } from './api/memoriesApi';
import './styles/JourneyTracker.css';

// Extended milestone interface for the component with React elements
interface Milestone extends Omit<ApiMilestone, 'iconType' | 'achievement'> {
  icon: React.ReactNode;
  achievement?: {
    title: string;
    description: string;
    badge: React.ReactNode;
  };
}

interface JourneyTrackerProps {
  onBack?: () => void;
}

function JourneyTracker({ onBack }: JourneyTrackerProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<string[] | null>(null);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);  
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [celebrationActive, setCelebrationActive] = useState<string | null>(null);
  const [floatingElements, setFloatingElements] = useState<Array<{ id: number; x: number; y: number; type: 'heart' | 'star' | 'sparkle' }>>([]);

  // Convert API milestone to component milestone with React elements
  const convertToComponentMilestone = (apiMilestone: ApiMilestone): Milestone => {
    // Convert icon type to React element
    let icon: React.ReactNode;
    switch (apiMilestone.iconType) {
      case 'coffee':
        icon = <Coffee className="w-6 h-6" />;
        break;
      case 'heart':
        icon = <Heart className="w-6 h-6" />;
        break;
      case 'star':
        icon = <Star className="w-6 h-6" />;
        break;
      case 'bell':
        icon = <Ring className="w-6 h-6" />;
        break;
      case 'plane':
        icon = <Plane className="w-6 h-6" />;
        break;
      case 'home':
        icon = <Home className="w-6 h-6" />;
        break;
      default:
        icon = <Heart className="w-6 h-6" />;
    }

    // Convert badge type to React element if achievement exists
    let achievement = undefined;
    if (apiMilestone.achievement) {
      let badge: React.ReactNode;
      switch (apiMilestone.achievement.badgeType) {
        case 'heart':
          badge = <Heart className="w-8 h-8 text-pink-500" />;
          break;
        case 'gift':
          badge = <Gift className="w-8 h-8 text-red-500" />;
          break;
        case 'map-pin':
          badge = <MapPin className="w-8 h-8 text-green-500" />;
          break;
        case 'award':
          badge = <Award className="w-8 h-8 text-yellow-500" />;
          break;
        case 'crown':
          badge = <Crown className="w-8 h-8 text-purple-500" />;
          break;
        case 'sparkles':
          badge = <Sparkles className="w-8 h-8 text-pink-600" />;
          break;
        default:
          badge = <Award className="w-8 h-8 text-blue-500" />;
      }

      achievement = {
        title: apiMilestone.achievement.title,
        description: apiMilestone.achievement.description,
        badge
      };
    }

    // Return the component milestone
    return {
      ...apiMilestone,
      icon,
      achievement
    };
  };

  // Fetch data from API
  useEffect(() => {
    const fetchMilestones = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await memoriesApi.getJourneyMilestones();
        // Convert API milestones to component milestones with React elements
        const componentMilestones = data.map(convertToComponentMilestone);
        // Sort by date
        const sortedMilestones = componentMilestones.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setMilestones(sortedMilestones);
      } catch (error) {
        console.error('Failed to fetch milestones:', error);
        setError('Unable to load your journey milestones. Please try again later.');
        // Set empty milestones array if there's an error
        setMilestones([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMilestones();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMoodEmoji = (mood: string) => {
    const moodMap = {
      ecstatic: '🥰',
      happy: '😊',
      romantic: '💕',
      nostalgic: '🥺',
      excited: '🤩',
      peaceful: '😌'
    };
    return moodMap[mood as keyof typeof moodMap] || '😊';
  };

  const getMoodColor = (mood: string) => {
    const colorMap = {
      ecstatic: 'from-pink-400 to-rose-400',
      happy: 'from-yellow-400 to-orange-400',
      romantic: 'from-red-400 to-pink-400',
      nostalgic: 'from-purple-400 to-indigo-400',
      excited: 'from-blue-400 to-cyan-400',
      peaceful: 'from-green-400 to-teal-400'
    };
    return colorMap[mood as keyof typeof colorMap] || 'from-pink-400 to-rose-400';
  };

  const celebrateMilestone = (milestone: Milestone, event: React.MouseEvent) => {
    setCelebrationActive(milestone.id);
    
    // Create floating elements
    const rect = event.currentTarget.getBoundingClientRect();
    const elements = [];
    
    for (let i = 0; i < 15; i++) {
      elements.push({
        id: Date.now() + i,
        x: rect.left + Math.random() * rect.width,
        y: rect.top + Math.random() * rect.height,
        type: ['heart', 'star', 'sparkle'][Math.floor(Math.random() * 3)] as 'heart' | 'star' | 'sparkle'
      });
    }
    
    setFloatingElements(elements);
    
    // Clear celebration after animation
    setTimeout(() => {
      setCelebrationActive(null);
      setFloatingElements([]);
    }, 3000);
  };

  const getDaysUntil = (dateString: string) => {
    const today = new Date();
    const targetDate = new Date(dateString);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="journey-tracker-page">
      {/* Header */}
      <header className="journey-header">
        <div className="journey-header-container">
          <div className="journey-header-content">
            <button 
              onClick={onBack}
              className="back-button"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="back-button-text">Back</span>
            </button>
            
            <div className="header-logo">
              <div className="header-logo-icon">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="header-logo-text">Love Journal</span>
            </div>
            
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="journey-main">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">
            Our Love
            <span className="gradient-text"> Journey</span>
          </h1>
          <p className="page-subtitle">
            Track your relationship's beautiful milestones and celebrate every precious moment together
          </p>
        </div>

        {/* Journey Timeline */}
        <div className="timeline-container">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading your beautiful journey...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <div className="error-icon">❌</div>
              <h3>Something went wrong</h3>
              <p>{error}</p>
              <button 
                className="error-retry-btn"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          ) : milestones.length === 0 ? (
            <div className="empty-container">
              <div className="empty-icon">📝</div>
              <h3>No Milestones Yet</h3>
              <p>Your journey is just beginning! Add your first special moment.</p>
            </div>
          ) : (
            <>
              <div className="timeline-line"></div>
              {milestones.map((milestone, index) => (
            <div 
              key={milestone.id}
              className={`milestone-item ${milestone.isUpcoming ? 'milestone-upcoming' : ''} ${
                celebrationActive === milestone.id ? 'milestone-celebrating' : ''
              }`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {/* Timeline Node */}
              <div className="timeline-node">
                <div className={`timeline-icon bg-gradient-to-r ${getMoodColor(milestone.mood)}`}>
                  {milestone.icon}
                </div>
                {milestone.isUpcoming && (
                  <div className="upcoming-pulse"></div>
                )}
              </div>

              {/* Milestone Card */}
              <div 
                className="milestone-card"
                onClick={(e) => celebrateMilestone(milestone, e)}
              >
                {/* Card Header */}
                <div className="milestone-header">
                  <div className="milestone-date">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(milestone.date)}</span>
                    {milestone.isUpcoming && (
                      <span className="upcoming-badge">
                        {getDaysUntil(milestone.date)} days to go!
                      </span>
                    )}
                  </div>
                  
                  <div className="mood-indicator">
                    <span className="mood-emoji">{getMoodEmoji(milestone.mood)}</span>
                    <span className="mood-text">{milestone.mood}</span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="milestone-content">
                  <h3 className="milestone-title">{milestone.title}</h3>
                  <p className="milestone-description">{milestone.description}</p>
                  
                  {/* Photos */}
                  {milestone.photos && milestone.photos.length > 0 && (
                    <div className="milestone-photos">
                      {milestone.photos.slice(0, 3).map((photo, photoIndex) => (
                        <img
                          key={photoIndex}
                          src={photo}
                          alt={`${milestone.title} photo ${photoIndex + 1}`}
                          className="milestone-photo"
                           onClick={() => {
                            setSelectedPhotos(milestone.photos || []);
                            setActivePhoto(photo);
                          }}
                        />
                      ))}
                      {milestone.photos.length > 3 && (
                        <div className="photo-count">
                          +{milestone.photos.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Achievement Badge */}
                {/* {milestone.achievement && (
                  <div className="achievement-badge">
                    <div className="achievement-icon">
                      {milestone.achievement.badge}
                    </div>
                    <div className="achievement-text">
                      <h4 className="achievement-title">{milestone.achievement.title}</h4>
                      <p className="achievement-description">{milestone.achievement.description}</p>
                    </div>
                  </div>
                )} */}

                {/* Celebration Effects */}
                {celebrationActive === milestone.id && (
                  <div className="celebration-overlay">
                    <div className="celebration-text">🎉 Celebrating! 🎉</div>
                  </div>
                )}
              </div>
            </div>
          ))}
            </>
          )}
        </div>

        {/* Stats Section */}
        <div className="stats-section">
          <h2 className="stats-title">Your Love Story by the Numbers</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <Heart className="w-8 h-8 text-pink-500" />
              </div>
              <div className="stat-number">{milestones.length}</div>
              <div className="stat-label">Milestones</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
              <div className="stat-number">
                {Math.floor((new Date().getTime() - new Date(milestones[0]?.date || '').getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="stat-label">Days Together</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <Camera className="w-8 h-8 text-green-500" />
              </div>
              <div className="stat-number">
                {milestones.reduce((total, milestone) => total + (milestone.photos?.length || 0), 0)}
              </div>
              <div className="stat-label">Photos Shared</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <Award className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="stat-number">
                {milestones.filter(m => m.achievement).length}
              </div>
              <div className="stat-label">Achievements</div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Celebration Elements */}
      {floatingElements.map(element => (
        <div
          key={element.id}
          className={`floating-element floating-${element.type}`}
          style={{
            left: element.x,
            top: element.y,
          }}
        >
          {element.type === 'heart' && <Heart className="w-4 h-4 fill-current text-pink-500" />}
          {element.type === 'star' && <Star className="w-4 h-4 fill-current text-yellow-500" />}
          {element.type === 'sparkle' && <Sparkles className="w-4 h-4 fill-current text-purple-500" />}
        </div>
      ))}
      {/* Photo Popup */}
      {selectedPhotos && activePhoto && (
        <div className="photo-popup-overlay" onClick={() => setSelectedPhotos(null)}>
          <div className="photo-popup-content" onClick={(e) => e.stopPropagation()}>
            <img src={activePhoto} alt="Selected" className="photo-popup-main" />
            <div className="photo-popup-thumbnails">
              {selectedPhotos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Thumbnail ${index}`}
                  className={`photo-popup-thumb ${photo === activePhoto ? 'active' : ''}`}
                  onClick={() => setActivePhoto(photo)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JourneyTracker;