/**
 * useCouple Hook
 * 
 * React hook for managing couple state and operations
 * Provides real-time updates via Firestore listeners
 */

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import type {
  Couple,
  CoupleInvitation,
  CoupleWithPartnerInfo,
  SendInvitationRequest,
  AcceptInvitationRequest,
  ShareMemoryRequest,
  UpdateCoupleSettingsRequest
} from '../types/couple';
import {
  sendCoupleInvitation,
  acceptCoupleInvitation,
  rejectCoupleInvitation,
  cancelCoupleInvitation,
  disconnectCouple,
  updateCoupleSettings,
  shareMemoryWithPartner,
  unshareMemory,
  getActiveCoupleByUserId
} from '../services/coupleService';

// Determine collection names based on environment
const ENV_PREFIX = import.meta.env.VITE_ENV_PREFIX || '';

interface UseCoupleReturn {
  // State
  couple: CoupleWithPartnerInfo | null;
  loading: boolean;
  error: string | null;
  
  // Invitations
  receivedInvitations: CoupleInvitation[];
  sentInvitations: CoupleInvitation[];
  invitationsLoading: boolean;
  
  // Actions
  sendInvitation: (request: SendInvitationRequest) => Promise<{ success: boolean; error?: string }>;
  acceptInvitation: (request: AcceptInvitationRequest) => Promise<{ success: boolean; error?: string }>;
  rejectInvitation: (invitationId: string) => Promise<{ success: boolean; error?: string }>;
  cancelInvitation: (invitationId: string) => Promise<{ success: boolean; error?: string }>;
  disconnect: () => Promise<{ success: boolean; error?: string }>;
  updateSettings: (updates: UpdateCoupleSettingsRequest) => Promise<{ success: boolean; error?: string }>;
  shareMemory: (request: ShareMemoryRequest) => Promise<{ success: boolean; error?: string }>;
  unshare: (memoryId: string) => Promise<{ success: boolean; error?: string }>;
  refresh: () => Promise<void>;
}

export function useCouple(userId?: string): UseCoupleReturn {
  const [couple, setCouple] = useState<CoupleWithPartnerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [receivedInvitations, setReceivedInvitations] = useState<CoupleInvitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<CoupleInvitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(true);

  // ============================================================================
  // FETCH COUPLE DATA
  // ============================================================================

  const fetchCouple = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const coupleData = await getActiveCoupleByUserId(userId);
      setCouple(coupleData);
      setError(null);
    } catch (err) {
      console.error('Error fetching couple:', err);
      setError('Failed to load couple data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ============================================================================
  // REAL-TIME LISTENERS
  // ============================================================================

  // Listen to couple changes
  useEffect(() => {
    if (!userId) {
      setCouple(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribe2: (() => void) | null = null;
    let isActive = true;
    let hasCheckedUser2 = false;

    // Helper function to cleanup user document when couple is deleted
    const cleanupUserDocument = async () => {
      try {
        const userRef = doc(collection(db, `${ENV_PREFIX}users`), userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists() && userDoc.data()?.coupleId) {
          await updateDoc(userRef, {
            coupleId: null,
            partnerId: null,
            partnerName: null,
            partnerEmail: null,
            coupleStatus: 'single'
          });
          console.log('🔄 Auto-cleanup: User document cleaned up after partner disconnect');
        }
      } catch (error) {
        console.warn('⚠️ Could not auto-cleanup user document:', error);
      }
    };

    // Listen to couples where user is user1
    const q1 = query(
      collection(db, `${ENV_PREFIX}couples`),
      where('user1Id', '==', userId),
      where('status', '==', 'active'),
      limit(1)
    );

    const unsubscribe1 = onSnapshot(
      q1,
      (snapshot) => {
        if (!isActive) return;
        
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const coupleData = { coupleId: doc.id, ...doc.data() } as Couple;
          
          // Enrich with partner info
          const enriched: CoupleWithPartnerInfo = {
            ...coupleData,
            partnerUserId: coupleData.user2Id,
            partnerName: coupleData.user2Name,
            partnerAvatar: coupleData.user2Avatar
          };
          
          setCouple(enriched);
          setError(null);
          setLoading(false);
          hasCheckedUser2 = false;
        } else if (!hasCheckedUser2) {
          hasCheckedUser2 = true;
          // Try user2
          const q2 = query(
            collection(db, `${ENV_PREFIX}couples`),
            where('user2Id', '==', userId),
            where('status', '==', 'active'),
            limit(1)
          );

          unsubscribe2 = onSnapshot(
            q2,
            async (snapshot2) => {
              if (!isActive) return;
              
              if (!snapshot2.empty) {
                const doc = snapshot2.docs[0];
                const coupleData = { coupleId: doc.id, ...doc.data() } as Couple;
                
                const enriched: CoupleWithPartnerInfo = {
                  ...coupleData,
                  partnerUserId: coupleData.user1Id,
                  partnerName: coupleData.user1Name,
                  partnerAvatar: coupleData.user1Avatar
                };
                
                setCouple(enriched);
                setError(null);
              } else {
                // No couple found in both queries - cleanup user document
                setCouple(null);
                await cleanupUserDocument();
              }
              setLoading(false);
            },
            (error) => {
              if (!isActive) return;
              console.error('Error listening to couple (user2):', error);
              setError('Failed to listen to couple updates');
              setLoading(false);
            }
          );
        }
      },
      (error) => {
        if (!isActive) return;
        console.error('Error listening to couple (user1):', error);
        setError('Failed to listen to couple updates');
        setLoading(false);
      }
    );

    return () => {
      isActive = false;
      unsubscribe1();
      if (unsubscribe2) unsubscribe2();
    };
  }, [userId]);

  // Listen to received invitations
  useEffect(() => {
    if (!userId) {
      setReceivedInvitations([]);
      return;
    }

    const q = query(
      collection(db, `${ENV_PREFIX}coupleInvitations`),
      where('receiverId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const invitations = snapshot.docs.map(doc => ({
          invitationId: doc.id,
          ...doc.data()
        })) as CoupleInvitation[];
        
        setReceivedInvitations(invitations);
        setInvitationsLoading(false);
      },
      (error) => {
        console.error('Error listening to received invitations:', error);
        setInvitationsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Listen to sent invitations
  useEffect(() => {
    if (!userId) {
      setSentInvitations([]);
      return;
    }

    const q = query(
      collection(db, `${ENV_PREFIX}coupleInvitations`),
      where('senderId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const invitations = snapshot.docs.map(doc => ({
          invitationId: doc.id,
          ...doc.data()
        })) as CoupleInvitation[];
        
        setSentInvitations(invitations);
      },
      (error) => {
        console.error('Error listening to sent invitations:', error);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const sendInvitation = useCallback(async (request: SendInvitationRequest) => {
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    return await sendCoupleInvitation(userId, request);
  }, [userId]);

  const acceptInvitation = useCallback(async (request: AcceptInvitationRequest) => {
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    return await acceptCoupleInvitation(userId, request);
  }, [userId]);

  const rejectInvitation = useCallback(async (invitationId: string) => {
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    return await rejectCoupleInvitation(userId, invitationId);
  }, [userId]);

  const cancelInvitation = useCallback(async (invitationId: string) => {
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    return await cancelCoupleInvitation(userId, invitationId);
  }, [userId]);

  const disconnect = useCallback(async () => {
    if (!userId || !couple) {
      return { success: false, error: 'No active couple' };
    }

    const result = await disconnectCouple(userId, couple.coupleId);
    
    // Force reset state immediately on success (don't wait for listener)
    if (result.success) {
      setCouple(null);
      console.log('🔄 Couple state reset immediately after disconnect');
    }
    
    return result;
  }, [userId, couple]);

  const updateSettings = useCallback(async (updates: UpdateCoupleSettingsRequest) => {
    if (!userId || !couple) {
      return { success: false, error: 'No active couple' };
    }

    return await updateCoupleSettings(userId, couple.coupleId, updates);
  }, [userId, couple]);

  const shareMemory = useCallback(async (request: ShareMemoryRequest) => {
    if (!userId || !couple) {
      return { success: false, error: 'No active couple' };
    }

    return await shareMemoryWithPartner(userId, couple.coupleId, request);
  }, [userId, couple]);

  const unshare = useCallback(async (memoryId: string) => {
    if (!userId || !couple) {
      return { success: false, error: 'No active couple' };
    }

    return await unshareMemory(userId, memoryId, couple.coupleId);
  }, [userId, couple]);

  const refresh = useCallback(async () => {
    await fetchCouple();
  }, [fetchCouple]);

  return {
    // State
    couple,
    loading,
    error,
    
    // Invitations
    receivedInvitations,
    sentInvitations,
    invitationsLoading,
    
    // Actions
    sendInvitation,
    acceptInvitation,
    rejectInvitation,
    cancelInvitation,
    disconnect,
    updateSettings,
    shareMemory,
    unshare,
    refresh
  };
}
