/**
 * CoupleStatusBadge Component
 * 
 * Shows current couple connection status in header/navbar
 */

import { Heart, Users, Link as LinkIcon } from 'lucide-react';
import type { CoupleWithPartnerInfo } from '../../types/couple';

interface CoupleStatusBadgeProps {
  couple: CoupleWithPartnerInfo | null;
  onClick?: () => void;
  variant?: 'compact' | 'full';
}

export function CoupleStatusBadge({ 
  couple, 
  onClick,
  variant = 'compact' 
}: CoupleStatusBadgeProps) {
  if (!couple) return null;

  const { partnerName, partnerAvatar } = couple;

  if (variant === 'compact') {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-full hover:from-pink-100 hover:to-purple-100 transition-all"
      >
        {partnerAvatar ? (
          <img 
            src={partnerAvatar} 
            alt={partnerName}
            className="w-6 h-6 rounded-full object-cover ring-2 ring-pink-200"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
            <Heart className="w-3 h-3 text-white" />
          </div>
        )}
        
        <span className="text-sm font-medium text-gray-700">
          {partnerName}
        </span>
        
        <LinkIcon className="w-3 h-3 text-pink-500" />
      </button>
    );
  }

  // Full variant
  return (
    <div 
      onClick={onClick}
      className={`
        flex items-center gap-3 p-4 bg-white rounded-lg shadow-md 
        border-2 border-pink-200
        ${onClick ? 'cursor-pointer hover:border-pink-300 transition-all' : ''}
      `}
    >
      {/* Partner Avatar */}
      <div className="relative">
        {partnerAvatar ? (
          <img 
            src={partnerAvatar} 
            alt={partnerName}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-pink-200"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
        )}
        
        {/* Status indicator */}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
      </div>

      {/* Partner Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">{partnerName}</h3>
          <LinkIcon className="w-4 h-4 text-pink-500" />
        </div>
        <p className="text-sm text-gray-500">Đã kết nối</p>
      </div>

      {/* Connection Icon */}
      <div className="p-2 bg-pink-50 rounded-full">
        <Users className="w-5 h-5 text-pink-500" />
      </div>
    </div>
  );
}
