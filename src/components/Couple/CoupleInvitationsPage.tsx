/**
 * CoupleInvitationsPage Component
 * 
 * Page to view and manage couple invitations (received & sent)
 */

import { useState } from 'react';
import { Heart, Inbox, Send as SendIcon, Plus, Settings, ArrowLeft, Check, UserCheck, Sparkles, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCouple } from '../../hooks/useCouple';
import { CoupleInvitationCard } from './CoupleInvitationCard';
import { SendCoupleInvitationModal } from './SendCoupleInvitationModal';
import { useLanguage } from '../../hooks/useLanguage';

interface CoupleInvitationsPageProps {
  userId: string;
}

export function CoupleInvitationsPage({ userId }: CoupleInvitationsPageProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    couple,
    receivedInvitations,
    sentInvitations,
    invitationsLoading,
    error,
    sendInvitation,
    acceptInvitation,
    rejectInvitation,
    cancelInvitation
  } = useCouple(userId);

  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [showSendModal, setShowSendModal] = useState(false);

  const handleSendInvitation = async (email: string, message: string) => {
    const result = await sendInvitation({
      receiverEmail: email,
      message
    });
    
    // Throw error if failed so modal can catch it
    if (!result.success) {
      throw new Error(result.error || 'Failed to send invitation');
    }
  };

  const handleAccept = async (invitationId: string) => {
    const result = await acceptInvitation({ invitationId });
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to accept invitation');
    }
  };

  const handleReject = async (invitationId: string) => {
    await rejectInvitation(invitationId);
  };

  const handleCancel = async (invitationId: string) => {
    await cancelInvitation(invitationId);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-violet-50 via-fuchsia-50 to-pink-50">
      {/* Premium Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-violet-400/30 to-fuchsia-400/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-pink-400/25 to-rose-400/25 rounded-full blur-3xl animate-float-delay-1"></div>
        <div className="absolute -bottom-40 left-1/3 w-[550px] h-[550px] bg-gradient-to-br from-purple-400/20 to-indigo-400/20 rounded-full blur-3xl animate-float-delay-2"></div>
      </div>

      <div className="relative z-10 min-h-screen">
        {/* Back Button */}
        <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-3 sm:pb-4">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-2 sm:py-2.5 bg-white/70 backdrop-blur-xl hover:bg-white/90 rounded-xl sm:rounded-2xl transition-all duration-300 shadow-lg shadow-violet-500/10 hover:shadow-xl hover:shadow-violet-500/20 border border-white/50"
          >
            <ArrowLeft className="w-4 h-4 text-violet-700 group-hover:-translate-x-1 transition-transform duration-300" strokeWidth={2.5} />
            <span className="text-violet-700 font-bold text-xs sm:text-sm">{t('couple.invitations.back')}</span>
          </button>
        </div>

        {/* Hero Header - Mobile Optimized */}
        <div className="mx-4 sm:mx-8 mt-3 sm:mt-4 mb-6 sm:mb-8">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-2xl shadow-violet-500/10">
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-pink-500/5"></div>
            
            {/* Decorative Elements - Hide on mobile for performance */}
            <div className="hidden sm:block absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-400/10 to-transparent rounded-full blur-3xl"></div>
            <div className="hidden sm:block absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-pink-400/10 to-transparent rounded-full blur-3xl"></div>

            <div className="relative px-4 sm:px-10 py-6 sm:py-12">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-0">
                {/* Left: Icon & Title */}
                <div className="flex items-start gap-3 sm:gap-6">
                  {/* Icon with Badge - Smaller on mobile */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute -inset-2 sm:-inset-3 bg-gradient-to-br from-violet-500/20 via-fuchsia-500/20 to-pink-500/20 rounded-2xl sm:rounded-3xl blur-xl"></div>
                    <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 p-0.5 shadow-xl">
                      <div className="w-full h-full rounded-2xl sm:rounded-3xl bg-white flex items-center justify-center">
                        <Heart className="w-8 h-8 sm:w-12 sm:h-12 text-fuchsia-500" fill="currentColor" />
                      </div>
                    </div>
                    {couple && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg border-2 sm:border-3 border-white ring-2 ring-emerald-200">
                        <Check className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div className="pt-0.5 sm:pt-1 flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent mb-1 sm:mb-2 tracking-tight leading-tight">
                      {t('couple.invitations.title')}
                    </h1>
                    <p className="text-gray-500 text-xs sm:text-base font-medium max-w-md line-clamp-2 sm:line-clamp-none">
                      {t('couple.invitations.subtitle')}
                    </p>
                  </div>
                </div>

                {/* Right: Action Buttons - Stack on mobile */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => navigate('/couple/settings')}
                    className="group flex items-center justify-center sm:justify-start gap-2 sm:gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] rounded-xl sm:rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <Settings className="w-4 sm:w-4.5 h-4 sm:h-4.5 text-gray-600 group-hover:rotate-90 transition-transform duration-300" strokeWidth={2.5} />
                    <span className="text-gray-700 font-bold text-xs sm:text-sm">{t('couple.invitations.settings')}</span>
                  </button>
                  
                  <button
                    onClick={() => setShowSendModal(true)}
                    disabled={!!couple}
                    className={`group relative overflow-hidden flex items-center justify-center sm:justify-start gap-2 sm:gap-2.5 px-5 sm:px-6 py-2.5 sm:py-3 text-white rounded-xl sm:rounded-2xl transition-all duration-300 font-bold shadow-xl ${
                      couple 
                        ? 'bg-gray-400 cursor-not-allowed opacity-60' 
                        : 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-700 hover:via-fuchsia-700 hover:to-pink-700 shadow-violet-500/30 hover:shadow-2xl hover:shadow-fuchsia-500/40 active:scale-[0.98] sm:hover:scale-105'
                    }`}
                  >
                    {!couple && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    )}
                    <Plus className={`relative w-4 sm:w-5 h-4 sm:h-5 text-white ${!couple ? 'group-hover:rotate-90' : ''} transition-transform duration-300`} strokeWidth={2.5} />
                    <span className="relative text-xs sm:text-sm">{t('couple.invitations.sendInvitation')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Couple Connected Banner - Premium */}
        {couple && (
          <div className="mx-8 mb-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 p-0.5 shadow-2xl shadow-emerald-500/30">
              <div className="relative bg-white rounded-3xl p-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-green-50/50"></div>
                <div className="relative flex items-center gap-5">
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Check className="w-7 h-7 text-white" strokeWidth={3} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-0.5">
                      {t('couple.invitations.connected')}
                    </h3>
                    <p className="text-gray-600 font-semibold text-sm">
                      {t('couple.invitations.connectedWith')} <span className="text-emerald-600 font-bold">{couple.partnerName || couple.partnerEmail}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Box - Premium Steps with Timeline */}
        {!couple && (
          <div className="mx-8 mb-8">
            <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-xl shadow-violet-500/10 p-10">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-pink-500/5"></div>
              
              {/* Decorative background patterns */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-violet-400/5 via-fuchsia-400/5 to-transparent rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-pink-400/5 via-rose-400/5 to-transparent rounded-full blur-3xl"></div>
              
              <div className="relative">
                {/* Timeline connector - responsive (vertical on mobile, horizontal on desktop) */}
                <div className="absolute left-[30px] top-[60px] bottom-[60px] w-0.5 bg-gradient-to-b from-violet-200 via-fuchsia-200 to-pink-200 lg:hidden"></div>
                <div className="hidden lg:block absolute left-[60px] right-[60px] top-[30px] h-0.5 bg-gradient-to-r from-violet-200 via-fuchsia-200 to-pink-200"></div>
                
                <div className="space-y-6 lg:space-y-0 lg:flex lg:gap-6">
                  {/* Step 1 - Send Invitation */}
                  <div className="group relative flex flex-col items-start gap-4 p-6 rounded-2xl bg-gradient-to-br from-white via-white to-violet-50/30 hover:from-violet-50 hover:via-fuchsia-50/50 hover:to-pink-50/30 border border-violet-100/50 hover:border-violet-300 shadow-lg shadow-violet-500/5 hover:shadow-2xl hover:shadow-violet-500/20 transition-all duration-500 hover:scale-[1.02] cursor-default lg:flex-1 lg:items-center lg:text-center">
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Icon Container with Badge */}
                    <div className="relative flex-shrink-0 z-10">
                      {/* Badge number - positioned to not be covered */}
                      <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center text-sm font-black shadow-lg shadow-violet-500/40 ring-4 ring-white group-hover:scale-110 transition-transform duration-300 z-20">
                        1
                      </div>
                      
                      {/* Icon with gradient background */}
                      <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-violet-600 p-0.5 shadow-xl shadow-violet-500/30 group-hover:shadow-2xl group-hover:shadow-violet-500/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                        <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center">
                          <Mail className="w-8 h-8 text-violet-500 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500" strokeWidth={2} />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 relative z-10">
                      <div className="flex flex-col gap-2 mb-3 lg:items-center">
                        <h3 className="text-lg font-black bg-gradient-to-r from-violet-700 via-purple-600 to-violet-600 bg-clip-text text-transparent">
                          {t('couple.invitations.step1Title')}
                        </h3>
                        <div className="inline-flex px-2.5 py-1 rounded-lg bg-violet-100 group-hover:bg-violet-200 border border-violet-200 group-hover:border-violet-300 transition-colors duration-300 self-start lg:self-center">
                          <span className="text-violet-700 text-xs font-black">First Step</span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm font-medium leading-relaxed">
                        {t('couple.invitations.step1Desc')}
                      </p>
                    </div>
                  </div>

                  {/* Step 2 - Partner Accepts */}
                  <div className="group relative flex flex-col items-start gap-4 p-6 rounded-2xl bg-gradient-to-br from-white via-white to-fuchsia-50/30 hover:from-fuchsia-50 hover:via-pink-50/50 hover:to-rose-50/30 border border-fuchsia-100/50 hover:border-fuchsia-300 shadow-lg shadow-fuchsia-500/5 hover:shadow-2xl hover:shadow-fuchsia-500/20 transition-all duration-500 hover:scale-[1.02] cursor-default lg:flex-1 lg:items-center lg:text-center">
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-fuchsia-500/0 via-fuchsia-500/5 to-fuchsia-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Icon Container with Badge */}
                    <div className="relative flex-shrink-0 z-10">
                      {/* Badge number - positioned to not be covered */}
                      <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white flex items-center justify-center text-sm font-black shadow-lg shadow-fuchsia-500/40 ring-4 ring-white group-hover:scale-110 transition-transform duration-300 z-20">
                        2
                      </div>
                      
                      {/* Icon with gradient background */}
                      <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-fuchsia-600 p-0.5 shadow-xl shadow-fuchsia-500/30 group-hover:shadow-2xl group-hover:shadow-fuchsia-500/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                        <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center">
                          <UserCheck className="w-8 h-8 text-fuchsia-500 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500" strokeWidth={2} />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 relative z-10">
                      <div className="flex flex-col gap-2 mb-3 lg:items-center">
                        <h3 className="text-lg font-black bg-gradient-to-r from-fuchsia-700 via-pink-600 to-fuchsia-600 bg-clip-text text-transparent">
                          {t('couple.invitations.step2Title')}
                        </h3>
                        <div className="inline-flex px-2.5 py-1 rounded-lg bg-fuchsia-100 group-hover:bg-fuchsia-200 border border-fuchsia-200 group-hover:border-fuchsia-300 transition-colors duration-300 self-start lg:self-center">
                          <span className="text-fuchsia-700 text-xs font-black">Waiting</span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm font-medium leading-relaxed">
                        {t('couple.invitations.step2Desc')}
                      </p>
                    </div>
                  </div>

                  {/* Step 3 - Start Sharing */}
                  <div className="group relative flex flex-col items-start gap-4 p-6 rounded-2xl bg-gradient-to-br from-white via-white to-pink-50/30 hover:from-pink-50 hover:via-rose-50/50 hover:to-orange-50/30 border border-pink-100/50 hover:border-pink-300 shadow-lg shadow-pink-500/5 hover:shadow-2xl hover:shadow-pink-500/20 transition-all duration-500 hover:scale-[1.02] cursor-default lg:flex-1 lg:items-center lg:text-center">
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/0 via-pink-500/5 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Icon Container with Badge */}
                    <div className="relative flex-shrink-0 z-10">
                      {/* Badge number - positioned to not be covered */}
                      <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center text-sm font-black shadow-lg shadow-pink-500/40 ring-4 ring-white group-hover:scale-110 transition-transform duration-300 z-20">
                        3
                      </div>
                      
                      {/* Icon with gradient background */}
                      <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 p-0.5 shadow-xl shadow-pink-500/30 group-hover:shadow-2xl group-hover:shadow-pink-500/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                        <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-pink-500 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500" strokeWidth={2} fill="currentColor" />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 relative z-10">
                      <div className="flex flex-col gap-2 mb-3 lg:items-center">
                        <h3 className="text-lg font-black bg-gradient-to-r from-pink-700 via-rose-600 to-pink-600 bg-clip-text text-transparent">
                          {t('couple.invitations.step3Title')}
                        </h3>
                        <div className="inline-flex px-2.5 py-1 rounded-lg bg-pink-100 group-hover:bg-pink-200 border border-pink-200 group-hover:border-pink-300 transition-colors duration-300 self-start lg:self-center">
                          <span className="text-pink-700 text-xs font-black">Together ✨</span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm font-medium leading-relaxed">
                        {t('couple.invitations.step3Desc')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Segmented Control Tabs */}
        <div className="mx-8 mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-2xl p-1.5 shadow-lg border border-white/60">
            <div className="flex gap-1.5">
              <button
                onClick={() => setActiveTab('received')}
                className={`relative flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-bold transition-all duration-300 overflow-hidden ${
                  activeTab === 'received'
                    ? 'text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {activeTab === 'received' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600"></div>
                )}
                <Inbox className={`relative w-4.5 h-4.5 ${activeTab === 'received' ? 'scale-110' : ''} transition-transform duration-300`} strokeWidth={2.5} />
                <span className="relative text-sm">{t('couple.invitations.received')}</span>
                {receivedInvitations.length > 0 && (
                  <span className={`relative min-w-[24px] h-6 px-2 rounded-lg flex items-center justify-center text-xs font-black transition-all duration-300 ${
                    activeTab === 'received' ? 'bg-white/25 text-white' : 'bg-violet-100 text-violet-600'
                  }`}>
                    {receivedInvitations.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('sent')}
                className={`relative flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-bold transition-all duration-300 overflow-hidden ${
                  activeTab === 'sent'
                    ? 'text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {activeTab === 'sent' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600"></div>
                )}
                <SendIcon className={`relative w-4.5 h-4.5 ${activeTab === 'sent' ? 'scale-110' : ''} transition-transform duration-300`} strokeWidth={2.5} />
                <span className="relative text-sm">{t('couple.invitations.sent')}</span>
                {sentInvitations.length > 0 && (
                  <span className={`relative min-w-[24px] h-6 px-2 rounded-lg flex items-center justify-center text-xs font-black transition-all duration-300 ${
                    activeTab === 'sent' ? 'bg-white/25 text-white' : 'bg-fuchsia-100 text-fuchsia-600'
                  }`}>
                    {sentInvitations.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-8 mb-8">
            <div className="relative overflow-hidden rounded-2xl bg-red-50 border border-red-200 px-5 py-4 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-rose-500/5"></div>
              <p className="relative text-red-700 font-semibold text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {invitationsLoading ? (
          <div className="mx-8">
            <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-xl p-24 flex flex-col items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-pink-500/5"></div>
              <div className="relative mb-8">
                <div className="absolute inset-0 animate-spin">
                  <div className="h-16 w-16 border-4 border-violet-200 rounded-full"></div>
                </div>
                <div className="absolute inset-0 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}>
                  <div className="h-16 w-16 border-t-4 border-fuchsia-500 rounded-full"></div>
                </div>
                <Heart className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 text-fuchsia-500 animate-pulse" fill="currentColor" />
              </div>
              <p className="relative text-gray-600 text-base font-bold">{t('couple.invitations.loadingInvitations')}</p>
            </div>
          </div>
        ) : (
          <div className="mx-8 pb-12">
            {activeTab === 'received' && (
              <>
                {receivedInvitations.length === 0 ? (
                  <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-xl p-20 text-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-pink-500/5"></div>
                    <div className="absolute top-10 right-10 w-40 h-40 bg-violet-500/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 left-10 w-40 h-40 bg-pink-500/5 rounded-full blur-3xl"></div>
                    
                    <div className="relative">
                      <div className="relative inline-block mb-8">
                        <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/20 to-pink-500/20 rounded-3xl blur-2xl animate-pulse"></div>
                        <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 p-0.5 shadow-2xl">
                          <div className="w-full h-full rounded-3xl bg-white flex items-center justify-center">
                            <Inbox className="w-14 h-14 text-fuchsia-500" strokeWidth={2} />
                          </div>
                        </div>
                      </div>
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-black bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent mb-3">
                        {t('couple.invitations.noInvitationsYet')}
                      </h3>
                      <p className="text-gray-500 text-sm max-w-sm mx-auto font-medium">
                        {t('couple.invitations.noInvitationsMessage')}
                      </p>
                    </div>
                  </div>
                ) : (
                  receivedInvitations.map(invitation => (
                    <CoupleInvitationCard
                      key={invitation.invitationId}
                      invitation={invitation}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      onCancel={handleCancel}
                      mode="received"
                    />
                  ))
                )}
              </>
            )}

            {activeTab === 'sent' && (
              <>
                {sentInvitations.length === 0 ? (
                  <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-xl p-20 text-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-pink-500/5"></div>
                    <div className="absolute top-10 left-10 w-40 h-40 bg-fuchsia-500/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-10 w-40 h-40 bg-violet-500/5 rounded-full blur-3xl"></div>
                    
                    <div className="relative">
                      <div className="relative inline-block mb-8">
                        <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/20 to-pink-500/20 rounded-3xl blur-2xl animate-pulse"></div>
                        <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 p-0.5 shadow-2xl">
                          <div className="w-full h-full rounded-3xl bg-white flex items-center justify-center">
                            <SendIcon className="w-14 h-14 text-violet-500" strokeWidth={2} />
                          </div>
                        </div>
                      </div>
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-black bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent mb-3">
                        {t('couple.invitations.noSentInvitations')}
                      </h3>
                      <p className="text-gray-500 text-sm mb-10 max-w-sm mx-auto font-medium">
                        {t('couple.invitations.noSentMessage')}
                      </p>
                      <button
                        onClick={() => setShowSendModal(true)}
                        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-700 hover:via-fuchsia-700 hover:to-pink-700 text-white rounded-2xl transition-all duration-300 font-bold shadow-2xl shadow-violet-500/30 hover:shadow-fuchsia-500/40 hover:scale-105 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <Plus className="relative w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-300" strokeWidth={2.5} />
                        <span className="relative text-sm">{t('couple.invitations.sendInvitationNow')}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  sentInvitations.map(invitation => (
                    <CoupleInvitationCard
                      key={invitation.invitationId}
                      invitation={invitation}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      onCancel={handleCancel}
                      mode="sent"
                    />
                  ))
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Send Invitation Modal */}
      <SendCoupleInvitationModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onSend={handleSendInvitation}
      />
    </div>
  );
}
