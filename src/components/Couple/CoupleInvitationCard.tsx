/**
 * CoupleInvitationCard Component
 * 
 * Displays received couple invitation with accept/reject actions
 */

import { useState } from 'react';
import { Heart, X, Check, Clock } from 'lucide-react';
import type { CoupleInvitation } from '../../types/couple';

interface CoupleInvitationCardProps {
  invitation: CoupleInvitation;
  onAccept: (invitationId: string) => Promise<void>;
  onReject: (invitationId: string) => Promise<void>;
  onCancel?: (invitationId: string) => Promise<void>;
  mode?: 'received' | 'sent';
}

export function CoupleInvitationCard({
  invitation,
  onAccept,
  onReject,
  onCancel,
  mode = 'received'
}: CoupleInvitationCardProps) {
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const handleAccept = async () => {
    try {
      setAccepting(true);
      await onAccept(invitation.invitationId);
    } catch (error) {
      console.error('Failed to accept invitation:', error);
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    try {
      setRejecting(true);
      await onReject(invitation.invitationId);
    } catch (error) {
      console.error('Failed to reject invitation:', error);
    } finally {
      setRejecting(false);
    }
  };

  const handleCancel = async () => {
    if (!onCancel) return;
    
    try {
      setCanceling(true);
      await onCancel(invitation.invitationId);
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
    } finally {
      setCanceling(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return '';
    return timestamp.toDate().toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = invitation.expiresAt && 
    (invitation.expiresAt instanceof Date 
      ? invitation.expiresAt 
      : invitation.expiresAt.toDate()) < new Date();

  return (
    <div className={`
      relative bg-white rounded-2xl shadow-md p-5 
      border transition-all duration-200 overflow-hidden group
      ${isExpired 
        ? 'border-gray-200 opacity-60' 
        : 'border-pink-100 hover:border-pink-200 hover:shadow-lg'
      }
    `}>
      {/* Animated background gradient */}
      {!isExpired && (
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 via-purple-50/50 to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      
      {/* Header */}
      <div className="relative flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-md overflow-hidden flex-shrink-0">
            {invitation.senderAvatar ? (
              <img 
                src={invitation.senderAvatar} 
                alt={invitation.senderName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Heart className="w-5 h-5 text-white" fill="white" />
            )}
          </div>
          
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-0.5">
              {mode === 'received' ? invitation.senderName : invitation.receiverName}
            </h3>
            <p className="text-xs text-gray-500">
              {mode === 'received' ? invitation.senderEmail : invitation.receiverEmail}
            </p>
          </div>
        </div>

        {isExpired && (
          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
            Hết hạn
          </span>
        )}
      </div>

      {/* Message */}
      {invitation.message && (
        <div className="relative mb-4 p-3 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl border border-pink-100">
          <p className="text-sm text-gray-700 italic">
            "{invitation.message}"
          </p>
        </div>
      )}

      {/* Metadata */}
      <div className="relative flex items-center gap-3 text-xs mb-4">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg">
          <Clock className="w-3 h-3" />
          <span className="font-medium">{formatDate(invitation.createdAt)}</span>
        </div>
        
        {invitation.expiresAt && !isExpired && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-600 rounded-lg">
            <Clock className="w-3 h-3" />
            <span className="font-medium">Hết hạn {formatDate(invitation.expiresAt)}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {!isExpired && (
        <div className="relative flex gap-2">
          {mode === 'received' ? (
            <>
              <button
                onClick={handleAccept}
                disabled={accepting || rejecting}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm hover:shadow"
              >
                {accepting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Chấp nhận</span>
                  </>
                )}
              </button>

              <button
                onClick={handleReject}
                disabled={accepting || rejecting}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
              >
                {rejecting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-gray-700 border-t-transparent rounded-full animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    <span>Từ chối</span>
                  </>
                )}
              </button>
            </>
          ) : (
            // Sent mode - can only cancel
            onCancel && (
              <button
                onClick={handleCancel}
                disabled={canceling}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
              >
                {canceling ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-gray-700 border-t-transparent rounded-full animate-spin" />
                    <span>Đang hủy...</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    <span>Hủy lời mời</span>
                  </>
                )}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
