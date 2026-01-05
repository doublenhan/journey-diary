/**
 * Couple Service - Firebase Firestore Operations
 * 
 * Handles all couple-related database operations:
 * - Send/Accept/Reject invitations
 * - Create/Update/Disconnect couples
 * - Share/Unshare memories
 * - Query couple data
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  serverTimestamp,
  Timestamp,
  documentId
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { ShareMode } from '../types/couple';
import type {
  Couple,
  CoupleInvitation,
  SharedMemory,
  SendInvitationRequest,
  AcceptInvitationRequest,
  ShareMemoryRequest,
  UpdateCoupleSettingsRequest,
  CoupleWithPartnerInfo,
  CoupleStatus,
  InvitationStatus,
  UserCoupleStatus
} from '../types/couple';

// ============================================================================
// COLLECTION REFERENCES
// ============================================================================

// Determine collection names based on environment
const ENV_PREFIX = import.meta.env.VITE_ENV_PREFIX || '';

const couplesCollection = collection(db, `${ENV_PREFIX}couples`);
const invitationsCollection = collection(db, `${ENV_PREFIX}coupleInvitations`);
const sharedMemoriesCollection = collection(db, `${ENV_PREFIX}sharedMemories`);
const usersCollection = collection(db, `${ENV_PREFIX}users`);
const memoriesCollection = collection(db, `${ENV_PREFIX}memories`);

// ============================================================================
// INVITATION OPERATIONS
// ============================================================================

/**
 * Send couple invitation to another user
 */
export async function sendCoupleInvitation(
  senderId: string,
  request: SendInvitationRequest
): Promise<{ success: boolean; invitationId?: string; error?: string }> {
  try {
    // 1. Check if sender already has an active couple
    const existingCouple = await getActiveCoupleByUserId(senderId);
    if (existingCouple) {
      return { success: false, error: 'You are already linked with a partner' };
    }

    // 2. Check if sender has pending invitation
    const pendingInvitations = await getPendingInvitationsBySender(senderId);
    if (pendingInvitations.length > 0) {
      return { success: false, error: 'You already have a pending invitation' };
    }

    // 3. Find receiver by email
    const receiverQuery = query(
      usersCollection,
      where('email', '==', request.receiverEmail),
      limit(1)
    );
    const receiverSnapshot = await getDocs(receiverQuery);
    
    if (receiverSnapshot.empty) {
      return { success: false, error: 'User not found with this email' };
    }

    const receiverDoc = receiverSnapshot.docs[0];
    const receiverId = receiverDoc.id;
    const receiverData = receiverDoc.data();

    // 4. Prevent self-invitation
    if (senderId === receiverId) {
      return { success: false, error: 'Cannot invite yourself' };
    }

    // 5. Check if receiver already has a couple
    const receiverCouple = await getActiveCoupleByUserId(receiverId);
    if (receiverCouple) {
      return { success: false, error: 'This user is already linked with another partner' };
    }

    // 6. Get sender info
    const senderDoc = await getDoc(doc(usersCollection, senderId));
    if (!senderDoc.exists()) {
      return { success: false, error: 'Sender not found' };
    }
    const senderData = senderDoc.data();

    // 7. Create invitation
    const invitation: any = {
      senderId,
      senderName: senderData.displayName || 'Unknown',
      receiverId,
      receiverName: receiverData.displayName || 'Unknown',
      status: 'pending' as InvitationStatus,
      message: request.message,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7 days
    };
    
    // Only add optional fields if they exist
    if (senderData.photoURL) invitation.senderAvatar = senderData.photoURL;
    if (senderData.email) invitation.senderEmail = senderData.email;
    if (receiverData.email) invitation.receiverEmail = receiverData.email;

    const invitationRef = await addDoc(invitationsCollection, invitation);

    return { success: true, invitationId: invitationRef.id };
  } catch (error) {
    console.error('Error sending couple invitation:', error);
    return { success: false, error: 'Failed to send invitation' };
  }
}

/**
 * Accept couple invitation
 */
export async function acceptCoupleInvitation(
  userId: string,
  request: AcceptInvitationRequest
): Promise<{ success: boolean; coupleId?: string; error?: string }> {
  try {
    const batch = writeBatch(db);

    // 1. Get invitation
    const invitationRef = doc(invitationsCollection, request.invitationId);
    const invitationDoc = await getDoc(invitationRef);
    
    if (!invitationDoc.exists()) {
      return { success: false, error: 'Invitation not found' };
    }

    const invitation = invitationDoc.data() as CoupleInvitation;

    // 2. Validate invitation
    if (invitation.receiverId !== userId) {
      return { success: false, error: 'This invitation is not for you' };
    }

    if (invitation.status !== 'pending') {
      return { success: false, error: 'Invitation already responded' };
    }

    if (invitation.expiresAt && (invitation.expiresAt as Timestamp).toDate() < new Date()) {
      batch.update(invitationRef, { status: 'expired' });
      await batch.commit();
      return { success: false, error: 'Invitation has expired' };
    }

    // 3. Check if either user already has a couple
    const senderCouple = await getActiveCoupleByUserId(invitation.senderId);
    const receiverCouple = await getActiveCoupleByUserId(userId);
    
    if (senderCouple || receiverCouple) {
      return { success: false, error: 'One of you is already linked with another partner' };
    }

    // 4. Get receiver info
    const receiverDoc = await getDoc(doc(usersCollection, userId));
    const receiverData = receiverDoc.exists() ? receiverDoc.data() : null;
    const receiverAvatar = receiverData?.photoURL || '';
    const receiverDisplayName = receiverData?.displayName || invitation.receiverName || 'Unknown';

    // 5. Create couple
    const coupleData: Omit<Couple, 'coupleId'> = {
      user1Id: invitation.senderId,
      user2Id: userId,
      user1Name: invitation.senderName || 'Unknown',
      user2Name: receiverDisplayName,
      user1Avatar: invitation.senderAvatar || '',
      user2Avatar: receiverAvatar,
      
      relationshipName: request.relationshipName || 'Our Relationship',
      ...(request.anniversaryDate && { anniversaryDate: Timestamp.fromDate(request.anniversaryDate) }),
      
      status: 'active' as CoupleStatus,
      
      shareMode: ShareMode.VIEW_ONLY,
      
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any
    };

    const coupleRef = await addDoc(couplesCollection, coupleData);
    const coupleId = coupleRef.id;

    // 6. Update invitation
    batch.update(invitationRef, {
      status: 'accepted',
      respondedAt: serverTimestamp(),
      coupleId
    });

    // 7. Update receiver user (only the current user - they have permission)
    const user2Ref = doc(usersCollection, userId);
    batch.update(user2Ref, {
      coupleId,
      partnerId: invitation.senderId,
      partnerName: invitation.senderName || 'Unknown',
      partnerEmail: invitation.senderEmail,
      coupleStatus: 'linked' as UserCoupleStatus
    });

    await batch.commit();

    // 8. Update sender user separately (after batch commit)
    // This needs to be done by the sender themselves or by a Cloud Function
    // For now, update it directly (this might fail due to permissions, but couple is already created)
    try {
      const user1Ref = doc(usersCollection, invitation.senderId);
      await updateDoc(user1Ref, {
        coupleId,
        partnerId: userId,
        partnerName: receiverDisplayName,
        partnerEmail: receiverData?.email,
        coupleStatus: 'linked' as UserCoupleStatus
      });
    } catch (permissionError) {
      console.warn('Could not update sender user document (will be updated when they refresh):', permissionError);
      // This is expected if we don't have permission - the sender's data will be updated
      // when they reload the page or through a Cloud Function trigger
    }

    return { success: true, coupleId };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return { success: false, error: 'Failed to accept invitation' };
  }
}

/**
 * Reject couple invitation
 */
export async function rejectCoupleInvitation(
  userId: string,
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const invitationRef = doc(invitationsCollection, invitationId);
    const invitationDoc = await getDoc(invitationRef);
    
    if (!invitationDoc.exists()) {
      return { success: false, error: 'Invitation not found' };
    }

    const invitation = invitationDoc.data() as CoupleInvitation;

    if (invitation.receiverId !== userId) {
      return { success: false, error: 'This invitation is not for you' };
    }

    if (invitation.status !== 'pending') {
      return { success: false, error: 'Invitation already responded' };
    }

    await updateDoc(invitationRef, {
      status: 'rejected',
      respondedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error rejecting invitation:', error);
    return { success: false, error: 'Failed to reject invitation' };
  }
}

/**
 * Cancel sent invitation
 */
export async function cancelCoupleInvitation(
  userId: string,
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const invitationRef = doc(invitationsCollection, invitationId);
    const invitationDoc = await getDoc(invitationRef);
    
    if (!invitationDoc.exists()) {
      return { success: false, error: 'Invitation not found' };
    }

    const invitation = invitationDoc.data() as CoupleInvitation;

    if (invitation.senderId !== userId) {
      return { success: false, error: 'You can only cancel your own invitations' };
    }

    if (invitation.status !== 'pending') {
      return { success: false, error: 'Cannot cancel responded invitation' };
    }

    await deleteDoc(invitationRef);

    return { success: true };
  } catch (error) {
    console.error('Error canceling invitation:', error);
    return { success: false, error: 'Failed to cancel invitation' };
  }
}

// ============================================================================
// COUPLE OPERATIONS
// ============================================================================

/**
 * Disconnect couple - removes all sharing and couple link
 */
export async function disconnectCouple(
  userId: string,
  coupleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Get couple
    const coupleRef = doc(couplesCollection, coupleId);
    const coupleDoc = await getDoc(coupleRef);
    
    if (!coupleDoc.exists()) {
      return { success: false, error: 'Couple not found' };
    }

    const couple = coupleDoc.data() as Couple;

    // 2. Verify user is part of couple
    if (couple.user1Id !== userId && couple.user2Id !== userId) {
      return { success: false, error: 'You are not part of this couple' };
    }

    // 3. Update ONLY current user document (CRITICAL - must succeed)
    try {
      const currentUserRef = doc(usersCollection, userId);
      await updateDoc(currentUserRef, {
        coupleId: null,
        partnerId: null,
        partnerName: null,
        partnerEmail: null,
        coupleStatus: 'single' as UserCoupleStatus
      });
      console.log('✅ User document cleaned up successfully');
    } catch (userUpdateError) {
      console.error('❌ Failed to update user document:', userUpdateError);
      // This is critical - if we can't update user, return error
      return { success: false, error: 'Failed to update your profile. Please try again.' };
    }

    // 4. Delete current user's shared memories (best effort)
    try {
      const sharedMemoriesQuery = query(
        sharedMemoriesCollection,
        where('coupleId', '==', coupleId),
        where('ownerId', '==', userId)
      );
      const sharedMemoriesSnapshot = await getDocs(sharedMemoriesQuery);
      
      if (sharedMemoriesSnapshot.docs.length > 0) {
        const deletePromises = sharedMemoriesSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        console.log('✅ Shared memories deleted:', sharedMemoriesSnapshot.docs.length);
      }
    } catch (deleteError) {
      console.warn('⚠️ Could not delete shared memories (not critical):', deleteError);
    }

    // 5. Update current user's memories (best effort)
    try {
      const sharedMemoriesQuery = query(
        sharedMemoriesCollection,
        where('coupleId', '==', coupleId),
        where('ownerId', '==', userId)
      );
      const sharedMemoriesSnapshot = await getDocs(sharedMemoriesQuery);
      const memoryIds = sharedMemoriesSnapshot.docs.map(doc => doc.data().memoryId);
      
      if (memoryIds.length > 0) {
        const updatePromises: Promise<void>[] = [];
        for (let i = 0; i < memoryIds.length; i += 10) {
          const chunk = memoryIds.slice(i, i + 10);
          try {
            const memoriesQuery = query(
              memoriesCollection,
              where(documentId(), 'in', chunk),
              where('userId', '==', userId)
            );
            const memoriesSnapshot = await getDocs(memoriesQuery);
            
            memoriesSnapshot.docs.forEach(memoryDoc => {
              updatePromises.push(
                updateDoc(memoryDoc.ref, {
                  isShared: false,
                  sharedWith: [],
                  collaborators: [],
                  lastEditedBy: null,
                  lastEditedAt: null
                }).catch(err => {
                  console.warn('⚠️ Failed to update memory:', memoryDoc.id, err);
                })
              );
            });
          } catch (chunkError) {
            console.warn('⚠️ Could not query memory chunk:', chunkError);
          }
        }
        
        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
          console.log('✅ Memories updated:', updatePromises.length);
        }
      }
    } catch (memoryUpdateError) {
      console.warn('⚠️ Could not update memories (not critical):', memoryUpdateError);
    }

    // 6. Delete couple document (triggers real-time listener for both users)
    try {
      await deleteDoc(coupleRef);
      console.log('✅ Couple document deleted');
    } catch (coupleDeleteError) {
      console.warn('⚠️ Could not delete couple document (not critical):', coupleDeleteError);
    }

    // 7. Update partner user document (best effort - for immediate sync)
    try {
      const partnerId = couple.user1Id === userId ? couple.user2Id : couple.user1Id;
      const partnerRef = doc(usersCollection, partnerId);
      await updateDoc(partnerRef, {
        coupleId: null,
        partnerId: null,
        partnerName: null,
        partnerEmail: null,
        coupleStatus: 'single' as UserCoupleStatus
      });
      console.log('✅ Partner user document updated immediately');
    } catch (permissionError) {
      // This is expected due to permissions - partner will auto-cleanup via real-time listener
      console.log('ℹ️ Partner will be updated via real-time listener when couple document is deleted');
    }

    console.log('🎉 Disconnect completed successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error disconnecting couple:', error);
    return { success: false, error: 'Failed to disconnect couple' };
  }
}

/**
 * Update couple settings
 */
export async function updateCoupleSettings(
  userId: string,
  coupleId: string,
  updates: UpdateCoupleSettingsRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    const coupleRef = doc(couplesCollection, coupleId);
    const coupleDoc = await getDoc(coupleRef);
    
    if (!coupleDoc.exists()) {
      return { success: false, error: 'Couple not found' };
    }

    const couple = coupleDoc.data() as Couple;

    if (couple.user1Id !== userId && couple.user2Id !== userId) {
      return { success: false, error: 'You are not part of this couple' };
    }

    const updateData: any = {
      updatedAt: serverTimestamp()
    };

    if (updates.relationshipName !== undefined) updateData.relationshipName = updates.relationshipName;
    if (updates.coupleAvatar !== undefined) updateData.coupleAvatar = updates.coupleAvatar;
    if (updates.anniversaryDate !== undefined) {
      updateData.anniversaryDate = updates.anniversaryDate 
        ? Timestamp.fromDate(updates.anniversaryDate) 
        : null;
    }
    
    // Handle nested settings
    if (updates.autoShareNewMemories !== undefined) {
      updateData['settings.autoShareNewMemories'] = updates.autoShareNewMemories;
    }

    await updateDoc(coupleRef, updateData);

    return { success: true };
  } catch (error) {
    console.error('Error updating couple settings:', error);
    return { success: false, error: 'Failed to update settings' };
  }
}

// ============================================================================
// MEMORY SHARING OPERATIONS
// ============================================================================

/**
 * Share a memory with partner
 */
export async function shareMemoryWithPartner(
  userId: string,
  coupleId: string,
  request: ShareMemoryRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Get couple
    const couple = await getCoupleById(coupleId);
    if (!couple) {
      return { success: false, error: 'Couple not found' };
    }

    if (couple.user1Id !== userId && couple.user2Id !== userId) {
      return { success: false, error: 'You are not part of this couple' };
    }

    const partnerId = couple.user1Id === userId ? couple.user2Id : couple.user1Id;

    // 2. Get memory
    const memoryRef = doc(memoriesCollection, request.memoryId);
    const memoryDoc = await getDoc(memoryRef);
    
    if (!memoryDoc.exists()) {
      return { success: false, error: 'Memory not found' };
    }

    const memory = memoryDoc.data();

    if (memory.userId !== userId) {
      return { success: false, error: 'You can only share your own memories' };
    }

    // 3. Check if already shared
    const existingShare = await getSharedMemory(request.memoryId, coupleId, userId);
    if (existingShare) {
      return { success: false, error: 'Memory already shared' };
    }

    const batch = writeBatch(db);

    // 4. Create shared memory document with memory data
    const memoryData: any = {
      id: request.memoryId,
      title: memory.title || '',
      text: memory.text || memory.content || memory.description || '',
      date: memory.date || memory.created_at || serverTimestamp(),
      images: memory.photos || memory.images || [], // Use photos first, then images
      tags: memory.tags || [],
      userId: memory.userId,
      isShared: true
    };

    // Only add optional fields if they exist
    if (memory.location) {
      memoryData.location = memory.location;
    }
    if (memory.created_at) {
      memoryData.created_at = memory.created_at;
    }

    const sharedMemory: Omit<SharedMemory, 'sharedId'> = {
      memoryId: request.memoryId,
      coupleId,
      ownerId: userId,
      sharedWithId: partnerId,
      canView: true,  // Always view-only
      sharedAt: serverTimestamp() as any,
      sharedBy: userId,
      memoryData
    };

    await addDoc(sharedMemoriesCollection, sharedMemory);

    // 5. Update memory document
    batch.update(memoryRef, {
      isShared: true,
      sharedWith: [partnerId],
      sharedAt: serverTimestamp() as any
    });

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('Error sharing memory:', error);
    return { success: false, error: 'Failed to share memory' };
  }
}

/**
 * Unshare a memory (revoke access)
 */
export async function unshareMemory(
  userId: string,
  memoryId: string,
  coupleId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Find shared memory document
    const sharedMemoryQuery = query(
      sharedMemoriesCollection,
      where('memoryId', '==', memoryId),
      where('coupleId', '==', coupleId),
      where('ownerId', '==', userId),
      limit(1)
    );
    
    const sharedMemorySnapshot = await getDocs(sharedMemoryQuery);
    
    if (sharedMemorySnapshot.empty) {
      return { success: false, error: 'Shared memory not found' };
    }

    const sharedMemoryDoc = sharedMemorySnapshot.docs[0];
    const sharedMemory = sharedMemoryDoc.data() as SharedMemory;

    if (sharedMemory.ownerId !== userId) {
      return { success: false, error: 'Only the owner can unshare' };
    }

    const batch = writeBatch(db);

    // 2. Delete shared memory document
    batch.delete(sharedMemoryDoc.ref);

    // 3. Update memory document
    const memoryRef = doc(memoriesCollection, memoryId);
    batch.update(memoryRef, {
      isShared: false,
      sharedWith: [],
      collaborators: []
    });

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('Error unsharing memory:', error);
    return { success: false, error: 'Failed to unshare memory' };
  }
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Get active couple for a user
 */
export async function getActiveCoupleByUserId(userId: string): Promise<CoupleWithPartnerInfo | null> {
  try {
    // First, check if user document has coupleId
    const userDoc = await getDoc(doc(usersCollection, userId));
    const userData = userDoc.exists() ? userDoc.data() : null;
    const userCoupleId = userData?.coupleId;

    // Query where user is user1
    const q1 = query(
      couplesCollection,
      where('user1Id', '==', userId),
      where('status', '==', 'active'),
      limit(1)
    );
    
    const snapshot1 = await getDocs(q1);
    
    if (!snapshot1.empty) {
      const doc = snapshot1.docs[0];
      const couple = { coupleId: doc.id, ...doc.data() } as Couple;
      return enrichCoupleWithPartnerInfo(couple, userId);
    }

    // Query where user is user2
    const q2 = query(
      couplesCollection,
      where('user2Id', '==', userId),
      where('status', '==', 'active'),
      limit(1)
    );
    
    const snapshot2 = await getDocs(q2);
    
    if (!snapshot2.empty) {
      const doc = snapshot2.docs[0];
      const couple = { coupleId: doc.id, ...doc.data() } as Couple;
      return enrichCoupleWithPartnerInfo(couple, userId);
    }

    // No active couple found, but user document has coupleId
    // This means couple was disconnected by partner - clean up user document
    if (userCoupleId) {
      try {
        await updateDoc(doc(usersCollection, userId), {
          coupleId: null,
          partnerId: null,
          partnerName: null,
          partnerEmail: null,
          coupleStatus: 'single' as UserCoupleStatus
        });
        console.log('Cleaned up user document after couple disconnect');
      } catch (cleanupError) {
        console.warn('Could not clean up user document:', cleanupError);
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting active couple:', error);
    return null;
  }
}

/**
 * Get couple by ID
 */
export async function getCoupleById(coupleId: string): Promise<Couple | null> {
  try {
    const coupleDoc = await getDoc(doc(couplesCollection, coupleId));
    
    if (!coupleDoc.exists()) {
      return null;
    }

    return { coupleId: coupleDoc.id, ...coupleDoc.data() } as Couple;
  } catch (error) {
    console.error('Error getting couple:', error);
    return null;
  }
}

/**
 * Get pending invitations received by user
 */
export async function getPendingInvitationsReceived(userId: string): Promise<CoupleInvitation[]> {
  try {
    const q = query(
      invitationsCollection,
      where('receiverId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      invitationId: doc.id,
      ...doc.data()
    })) as CoupleInvitation[];
  } catch (error) {
    console.error('Error getting pending invitations:', error);
    return [];
  }
}

/**
 * Get pending invitations sent by user
 */
export async function getPendingInvitationsBySender(userId: string): Promise<CoupleInvitation[]> {
  try {
    const q = query(
      invitationsCollection,
      where('senderId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      invitationId: doc.id,
      ...doc.data()
    })) as CoupleInvitation[];
  } catch (error) {
    console.error('Error getting sent invitations:', error);
    return [];
  }
}

/**
 * Get shared memories for a couple
 */
export async function getSharedMemoriesForCouple(
  coupleId: string,
  userId: string
): Promise<SharedMemory[]> {
  try {
    const q = query(
      sharedMemoriesCollection,
      where('coupleId', '==', coupleId),
      where('sharedWithId', '==', userId),
      orderBy('sharedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      sharedId: doc.id,
      ...doc.data()
    })) as SharedMemory[];
  } catch (error) {
    console.error('Error getting shared memories:', error);
    return [];
  }
}

/**
 * Get all couples for a user (including disconnected - for history)
 */
export async function getAllCouplesForUser(userId: string): Promise<Couple[]> {
  try {
    const q1 = query(
      couplesCollection,
      where('user1Id', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const q2 = query(
      couplesCollection,
      where('user2Id', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1),
      getDocs(q2)
    ]);
    
    const couples1 = snapshot1.docs.map(doc => ({
      coupleId: doc.id,
      ...doc.data()
    })) as Couple[];
    
    const couples2 = snapshot2.docs.map(doc => ({
      coupleId: doc.id,
      ...doc.data()
    })) as Couple[];
    
    return [...couples1, ...couples2].sort((a, b) => {
      const aTime = (a.createdAt as Timestamp).toMillis();
      const bTime = (b.createdAt as Timestamp).toMillis();
      return bTime - aTime;
    });
  } catch (error) {
    console.error('Error getting all couples:', error);
    return [];
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get user avatar
 */
async function getUserAvatar(userId: string): Promise<string | undefined> {
  try {
    const userDoc = await getDoc(doc(usersCollection, userId));
    return userDoc.exists() ? userDoc.data().photoURL : undefined;
  } catch (error) {
    console.error('Error getting user avatar:', error);
    return undefined;
  }
}

/**
 * Enrich couple data with partner info
 */
function enrichCoupleWithPartnerInfo(couple: Couple, userId: string): CoupleWithPartnerInfo {
  const isUser1 = couple.user1Id === userId;
  
  return {
    ...couple,
    partnerUserId: isUser1 ? couple.user2Id : couple.user1Id,
    partnerName: isUser1 ? couple.user2Name : couple.user1Name,
    partnerAvatar: isUser1 ? couple.user2Avatar : couple.user1Avatar
  };
}

/**
 * Get shared memory by memoryId and coupleId
 */
async function getSharedMemory(memoryId: string, coupleId: string, userId: string): Promise<SharedMemory | null> {
  try {
    // Query with ownerId to satisfy Firestore rules
    const q = query(
      sharedMemoriesCollection,
      where('memoryId', '==', memoryId),
      where('coupleId', '==', coupleId),
      where('ownerId', '==', userId),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { sharedId: doc.id, ...doc.data() } as SharedMemory;
  } catch (error) {
    console.error('Error getting shared memory:', error);
    return null;
  }
}
