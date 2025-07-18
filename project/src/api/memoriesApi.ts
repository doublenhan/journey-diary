// Define the interface for Milestone/Memory
export interface Milestone {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'first_date' | 'anniversary' | 'trip' | 'engagement' | 'moving_in' | 'special_moment';
  mood: 'ecstatic' | 'happy' | 'romantic' | 'nostalgic' | 'excited' | 'peaceful';
  iconType?: string;  // Store the icon type instead of a React component
  isUpcoming?: boolean;
  photos?: string[];
  achievement?: {
    title: string;
    description: string;
    badgeType?: string;  // Store the badge type instead of a React component
  };
}

// Helper function to convert backend data to frontend format
const processMemoryData = (milestone: Milestone): Milestone => {
  // Map the type to the appropriate icon type
  let iconType;
  let badgeType;
  
  switch (milestone.type) {
    case 'first_date':
      iconType = 'coffee';
      break;
    case 'anniversary':
      iconType = milestone.isUpcoming ? 'bell' : 'star';
      break;
    case 'trip':
      iconType = 'plane';
      break;
    case 'moving_in':
      iconType = 'home';
      break;
    case 'engagement':
      iconType = 'ring';
      break;
    case 'special_moment':
      iconType = 'heart';
      break;
    default:
      iconType = 'heart';
  }

  // Assign badge based on type or milestone
  if (milestone.achievement) {
    switch (milestone.type) {
      case 'first_date':
        badgeType = 'heart';
        break;
      case 'anniversary':
        badgeType = milestone.isUpcoming ? 'sparkles' : 'award';
        break;
      case 'trip':
        badgeType = 'map-pin';
        break;
      case 'moving_in':
        badgeType = 'crown';
        break;
      case 'special_moment':
        badgeType = 'gift';
        break;
      default:
        badgeType = 'award';
    }
  }

  return {
    ...milestone,
    iconType,
    achievement: milestone.achievement ? {
      ...milestone.achievement,
      badgeType
    } : undefined
  };
};

class MemoriesApi {
  // Base URL for API calls
  private readonly baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  constructor() {
    // Initialize with API base URL
    console.log('MemoriesApi initialized with baseUrl:', this.baseUrl);
  }

  /**
   * Fetch all memories/milestones for the journey tracker
   */
  async getJourneyMilestones(): Promise<Milestone[]> {
    try {
      console.log('Fetching journey milestones from:', `${this.baseUrl}/memories`);
      
      // Make a real API call to get memories from Cloudinary
      const response = await fetch(`${this.baseUrl}/memories`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch memories: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Received memories data:', data);
      
      if (!data.memories || !Array.isArray(data.memories)) {
        console.warn('Invalid memories data format:', data);
        return [];
      }
      
      // Map the Cloudinary memories to our Milestone format
      const milestones = data.memories.map((memory: any) => {
        // Determine the type of milestone based on tags or content
        let type: Milestone['type'] = 'special_moment';
        let mood: Milestone['mood'] = 'happy';
        
        // Extract type and mood from tags if available
        if (memory.tags && memory.tags.length > 0) {
          for (const tag of memory.tags) {
            if (['first_date', 'anniversary', 'trip', 'engagement', 'moving_in', 'special_moment'].includes(tag)) {
              type = tag as Milestone['type'];
            }
            if (['ecstatic', 'happy', 'romantic', 'nostalgic', 'excited', 'peaceful'].includes(tag)) {
              mood = tag as Milestone['mood'];
            }
          }
        }

        // Check if this is an upcoming event
        const isUpcoming = new Date(memory.date) > new Date();
        
        // Extract photos from the memory
        const photos = memory.images && Array.isArray(memory.images) 
          ? memory.images.map((img: any) => img.secure_url)
          : [];
        
        // Create a descriptive achievement based on the memory content
        const achievement = {
          title: memory.title.includes(':') ? memory.title.split(':')[1].trim() : `${type.charAt(0).toUpperCase() + type.slice(1)} Milestone`,
          description: memory.text || `A special memory captured on ${new Date(memory.date).toLocaleDateString()}`
        };
        
        return {
          id: memory.id || `memory-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          date: memory.date || new Date().toISOString(),
          title: memory.title || 'Untitled Memory',
          description: memory.text || '',
          type,
          mood,
          photos,
          isUpcoming,
          achievement
        };
      });
      
      console.log('Processed milestones:', milestones.length);
      return milestones.map(processMemoryData);
    } catch (error) {
      console.error('Error fetching journey milestones:', error);
      throw error;
    }
  }

  /**
   * Add a new milestone/memory
   */
  async addMilestone(milestone: Omit<Milestone, 'id' | 'iconType' | 'achievement'> & {
    achievement?: Omit<NonNullable<Milestone['achievement']>, 'badgeType'>
  }): Promise<Milestone> {
    try {
      // For creating a new memory in Cloudinary, we need to use the upload API
      // We'll assume we're adding metadata only for now (without image)
      
      // Create tags from the milestone type and mood
      const tags = [milestone.type, milestone.mood];
      
      // Create the memory data
      const memoryData = {
        title: milestone.title,
        text: milestone.description,
        date: milestone.date,
        tags,
        ...(milestone.achievement ? {
          achievement_title: milestone.achievement.title,
          achievement_description: milestone.achievement.description
        } : {})
      };
      
      const response = await fetch(`${this.baseUrl}/cloudinary/create-memory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memoryData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add memory: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Map the created memory to our Milestone format
      const newMilestone: Milestone = {
        id: data.memory_id || String(Date.now()),
        title: milestone.title,
        date: milestone.date,
        description: milestone.description,
        type: milestone.type,
        mood: milestone.mood,
        photos: [],
        isUpcoming: new Date(milestone.date) > new Date(),
        achievement: milestone.achievement
      };
      
      return processMemoryData(newMilestone);
    } catch (error) {
      console.error('Error adding milestone:', error);
      throw error;
    }
  }
}

export const memoriesApi = new MemoriesApi();
export default memoriesApi;
