/**
 * Couple Features TypeScript Interfaces
 * 
 * Defines types for couple linking, invitations, and shared memories
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// ENUMS
// ============================================================================

export enum CoupleStatus {
  ACTIVE = 'active',
  DISCONNECTED = 'disconnected'
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export enum ShareMode {
  VIEW_ONLY = 'view_only'  // Partner can only view (read-only)
}

export enum UserCoupleStatus {
  SINGLE = 'single',
  LINKED = 'linked'
}

// ============================================================================
// MAIN INTERFACES
// ============================================================================

/**
 * Couple - Represents a linked couple relationship
 */
export interface Couple {
  // Core Info
  coupleId: string;
  
  // Members
  user1Id: string;
  user2Id: string;
  user1Name: string;
  user2Name: string;
  user1Avatar?: string;
  user2Avatar?: string;
  
  // Relationship Info
  relationshipName?: string;      // e.g., "Minh & Linh"
  coupleAvatar?: string;
  anniversaryDate?: Date | Timestamp;
  
  // Status
  status: CoupleStatus;
  
  // Settings
  shareMode: ShareMode;  // Always VIEW_ONLY
  settings?: {
    autoShareNewMemories?: boolean;
  }
  
  // Metadata
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  disconnectedAt?: Date | Timestamp;
  disconnectedBy?: string;        // User ID who initiated disconnect
}

/**
 * CoupleInvitation - Represents a pending/responded invitation
 */
export interface CoupleInvitation {
  // Core Info
  invitationId: string;
  
  // Sender Info
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderEmail: string;
  
  // Receiver Info
  receiverId: string;
  receiverName: string;
  receiverEmail: string;
  
  // Status
  status: InvitationStatus;
  
  // Message
  message?: string;
  
  // Metadata
  createdAt: Date | Timestamp;
  expiresAt: Date | Timestamp;    // 7 days from creation
  respondedAt?: Date | Timestamp;
  coupleId?: string;              // Set after acceptance
}

/**
 * SharedMemory - Represents a memory shared with partner
 * (Used when shareMode = 'selected')
 */
export interface SharedMemory {
  // Core Info
  sharedId: string;
  
  // Memory Info
  memoryId: string;
  coupleId: string;
  
  // Sharing Info
  ownerId: string;                // Memory owner
  sharedWithId: string;           // Partner user ID
  
  // Permissions (always view-only)
  canView: boolean;  // Always true
  
  // Metadata
  sharedAt: Date | Timestamp;
  sharedBy: string;               // User ID who shared
  revokedAt?: Date | Timestamp;
  revokedBy?: string;
  
  // Memory Data (embedded for partner access)
  memoryData?: {
    id: string;
    title: string;
    text: string;
    date: string;
    location?: string;
    images: any[];
    tags?: string[];
    created_at: any;
    userId: string;
    isShared: boolean;
  };
}

// ============================================================================
// USER UPDATES
// ============================================================================

/**
 * CoupleSettings - User-specific couple settings
 */
export interface CoupleSettings {
  allowPartnerEdit: boolean;
  allowPartnerDelete: boolean;
  autoShareNewMemories: boolean;
  notifyOnPartnerMemory: boolean;
}

/**
 * UserCoupleInfo - Couple-related fields added to User interface
 */
export interface UserCoupleInfo {
  coupleId?: string;
  partnerId?: string;
  partnerName?: string;
  coupleStatus: UserCoupleStatus;
  coupleSettings?: CoupleSettings;
}

// ============================================================================
// MEMORY UPDATES
// ============================================================================

/**
 * MemorySharingInfo - Sharing-related fields added to Memory interface
 */
export interface MemorySharingInfo {
  isShared: boolean;
  sharedWith?: string[];          // Array of user IDs
  sharedAt?: Date | Timestamp;
  
  // Collaboration
  collaborators?: string[];       // Users who can edit
  lastEditedBy?: string;
  lastEditedAt?: Date | Timestamp;
  
  // Original owner (important for disconnect)
  originalOwnerId: string;
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * SendInvitationRequest - Params for sending couple invitation
 */
export interface SendInvitationRequest {
  receiverEmail: string;
  message?: string;
}

/**
 * AcceptInvitationRequest - Params for accepting invitation
 */
export interface AcceptInvitationRequest {
  invitationId: string;
  relationshipName?: string;
  anniversaryDate?: Date;
}

/**
 * ShareMemoryRequest - Params for sharing a memory
 */
export interface ShareMemoryRequest {
  memoryId: string;
}

/**
 * UpdateCoupleSettingsRequest - Params for updating couple settings
 */
export interface UpdateCoupleSettingsRequest {
  relationshipName?: string;
  coupleAvatar?: string;
  anniversaryDate?: Date;
  autoShareNewMemories?: boolean;
}

// ============================================================================
// QUERY RESULTS
// ============================================================================

/**
 * CoupleWithPartnerInfo - Couple with enriched partner information
 */
export interface CoupleWithPartnerInfo extends Couple {
  partnerUserId: string;
  partnerName: string;
  partnerAvatar?: string;
  partnerEmail?: string;
}

/**
 * SharedMemoryWithDetails - SharedMemory with actual memory data
 */
export interface SharedMemoryWithDetails extends SharedMemory {
  memory?: any; // Memory interface from existing types
}

/**
 * CoupleStats - Statistics for couple dashboard
 */
export interface CoupleStats {
  totalSharedMemories: number;
  sharedByMe: number;
  sharedWithMe: number;
  daysTogether: number;
  totalPhotos: number;
  mostActiveMonth: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * NotificationType for couple-related notifications
 */
export enum CoupleNotificationType {
  INVITATION_RECEIVED = 'couple_invitation_received',
  INVITATION_ACCEPTED = 'couple_invitation_accepted',
  INVITATION_REJECTED = 'couple_invitation_rejected',
  MEMORY_SHARED = 'couple_memory_shared',
  MEMORY_EDITED = 'couple_memory_edited',
  MEMORY_COMMENTED = 'couple_memory_commented',
  COUPLE_DISCONNECTED = 'couple_disconnected',
  PARTNER_NEW_MEMORY = 'couple_partner_new_memory'
}

/**
 * CoupleNotification - Notification payload
 */
export interface CoupleNotification {
  type: CoupleNotificationType;
  coupleId?: string;
  partnerId: string;
  partnerName: string;
  invitationId?: string;
  memoryId?: string;
  message?: string;
  timestamp: Date | Timestamp;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if user can perform action on couple
 */
export interface CouplePermissions {
  canEditSettings: boolean;
  canDisconnect: boolean;
  canShareMemories: boolean;
  canEditPartnerMemories: boolean;
  canDeletePartnerMemories: boolean;
}

/**
 * Couple action validation result
 */
export interface CoupleActionValidation {
  isValid: boolean;
  error?: string;
  permissions?: CouplePermissions;
}
