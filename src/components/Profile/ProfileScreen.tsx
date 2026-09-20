import React, { useState } from 'react';
import { 
  Clock, 
  UserPlus, 
  Send, 
  ShieldCheck, 
  FileText, 
  RefreshCw, 
  Scale, 
  LogOut, 
  LogIn, 
  Edit3, 
  ChevronRight, 
  User as UserIcon,
  Trophy,
  Swords,
  Award,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTournament } from '../../context/TournamentContext';
import { ReferAndEarnModal } from './ReferAndEarnModal';
import { MatchHistoryModal } from './MatchHistoryModal';
import { PolicyModal, PolicyType } from './PolicyModal';
import { EditNameModal } from './EditNameModal';
import { Tournament } from '../../types';

interface ProfileScreenProps {
  onRoomKeyClick: (t: Tournament) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onRoomKeyClick }) => {
  const { currentUser, userProfile, signOutUser, openAuthModal } = useAuth();
  const { settings } = useTournament();

  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [activePolicy, setActivePolicy] = useState<PolicyType | null>(null);

  const displayName = userProfile?.displayName || currentUser?.displayName || 'Player';
  const email = userProfile?.email || currentUser?.email || 'player@battlepro.app';
  const initial = (displayName.charAt(0) || 'P').toUpperCase();

  const totalMatches = userProfile?.totalMatches || 0;
  const wonMatches = userProfile?.wonMatches || 0;
  const totalWinnings = Number(userProfile?.totalEarnings || userProfile?.winningCash || 0).toFixed(2);

  const handleTelegramClick = () => {
    const link = settings.telegramLink || 'https://t.me/battlepro_support';
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const handleProtectedAction = (action: () => void) => {
    if (!currentUser) {
      openAuthModal(action);
    } else {
      action();
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in font-['Poppins',sans-serif]">
      {/* 1. Profile Identity Header */}
      <div className="text-center pt-2 space-y-3">
        {/* Avatar with Soft Accent Glow & Ring */}
        <div className="relative inline-block group">
          {/* Ambient accent glow */}
          <div className="absolute -inset-1 rounded-full bg-[#B6FF3C]/20 blur-xl scale-110 pointer-events-none transition-all duration-300 group-hover:bg-[#B6FF3C]/35" />

          {/* Glowing accent ring */}
          <div className="relative p-1 rounded-full bg-gradient-to-tr from-[#B6FF3C] via-[#B6FF3C]/70 to-emerald-400 shadow-[0_0_22px_rgba(182,255,60,0.35)]">
            <div className="p-0.5 rounded-full bg-[#0B1120]">
              {currentUser && userProfile?.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt={displayName}
                  className="w-22 h-22 sm:w-24 sm:h-24 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-full bg-[#131C31] flex items-center justify-center font-black text-3xl text-[#B6FF3C]">
                  {currentUser ? initial : <UserIcon className="w-10 h-10 text-slate-500" />}
                </div>
              )}
            </div>
          </div>

          {/* Clearly Tappable Edit Pencil Floating Badge */}
          {currentUser && (
            <button
              onClick={() => setIsEditNameOpen(true)}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#131C31] border-2 border-[#B6FF3C] text-[#B6FF3C] hover:bg-[#B6FF3C] hover:text-black transition-all flex items-center justify-center shadow-lg shadow-black/80 active:scale-90 cursor-pointer"
              aria-label="Edit Name"
              title="Edit Profile Name"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Name and Email */}
        <div>
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-xl font-extrabold text-white tracking-wide">
              {currentUser ? displayName : 'Guest Player'}
            </h2>
            {currentUser && (
              <button
                onClick={() => setIsEditNameOpen(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                aria-label="Edit Name"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            {currentUser ? email : 'Sign in to sync your match stats & earnings'}
          </p>

          {currentUser && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-2 rounded-full bg-[#B6FF3C]/10 border border-[#B6FF3C]/20 text-[10px] font-semibold text-[#B6FF3C]">
              <Sparkles className="w-3 h-3" />
              <span>Verified Competitor</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Stats Row (Matches Played, Matches Won, Total Winnings) */}
      <div className="bg-[#131C31] border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 shadow-xl grid grid-cols-3 divide-x divide-slate-800/70">
        <div className="px-1 text-center flex flex-col items-center justify-center">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-1.5">
            <Swords className="w-3.5 h-3.5" />
          </div>
          <div className="text-base sm:text-lg font-black text-white">{totalMatches}</div>
          <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">Played</div>
        </div>

        <div className="px-1 text-center flex flex-col items-center justify-center">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-1.5">
            <Trophy className="w-3.5 h-3.5" />
          </div>
          <div className="text-base sm:text-lg font-black text-white">{wonMatches}</div>
          <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">Won</div>
        </div>

        <div className="px-1 text-center flex flex-col items-center justify-center">
          <div className="w-7 h-7 rounded-lg bg-[#B6FF3C]/10 text-[#B6FF3C] flex items-center justify-center mb-1.5">
            <Award className="w-3.5 h-3.5" />
          </div>
          <div className="text-base sm:text-lg font-black text-[#B6FF3C]">₹{totalWinnings}</div>
          <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">Winnings</div>
        </div>
      </div>

      {/* 3. Grouped Navigation Sections */}
      <div className="space-y-5">
        {/* Section 1: Account Group */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-2 flex items-center gap-1.5">
            <span>Account</span>
          </h3>

          <div className="bg-[#131C31] border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg divide-y divide-slate-800/60">
            {/* Match History */}
            <button
              onClick={() => handleProtectedAction(() => setIsHistoryModalOpen(true))}
              className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition active:scale-[0.99] group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-white">Match History</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400">View joined rooms and match results</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Refer & Earn */}
            <button
              onClick={() => handleProtectedAction(() => setIsReferModalOpen(true))}
              className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition active:scale-[0.99] group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-white">Refer & Earn</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400">Invite squad friends for cash bonuses</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>

        {/* Section 2: Support & Legal Group */}
        <div>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-2 flex items-center gap-1.5">
            <span>Support & Legal</span>
          </h3>

          <div className="bg-[#131C31] border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg divide-y divide-slate-800/60">
            {/* Contact Us on Telegram */}
            <button
              onClick={handleTelegramClick}
              className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition active:scale-[0.99] group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-white">Contact Us on Telegram</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400">Official tournament support channel</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Privacy Policy */}
            <button
              onClick={() => setActivePolicy('privacy')}
              className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition active:scale-[0.99] group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-white">Privacy Policy</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400">Security & personal data encryption</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Terms & Conditions */}
            <button
              onClick={() => setActivePolicy('terms')}
              className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition active:scale-[0.99] group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-white">Terms & Conditions</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400">Match rules and platform agreement</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Refund Policy */}
            <button
              onClick={() => setActivePolicy('refund')}
              className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition active:scale-[0.99] group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 group-hover:scale-105 transition-transform">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-white">Refund Policy</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400">Match cancellation & refund terms</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Fair Play Policy */}
            <button
              onClick={() => setActivePolicy('fairplay')}
              className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition active:scale-[0.99] group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#B6FF3C]/10 border border-[#B6FF3C]/20 flex items-center justify-center text-[#B6FF3C] group-hover:scale-105 transition-transform">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-white">Fair Play Policy</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400">Anti-cheat standards & penalties</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>

        {/* Section 3: Distinct Logout / Sign In Action */}
        <div className="pt-2">
          {currentUser ? (
            <button
              onClick={() => setIsLogoutConfirmOpen(true)}
              className="w-full p-3.5 sm:p-4 rounded-2xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 flex items-center justify-between text-left transition active:scale-[0.99] group cursor-pointer shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
                  <LogOut className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-red-400">Log Out</div>
                  <div className="text-[10px] sm:text-[11px] text-red-400/60 font-medium">Safely exit your account session</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400/50 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          ) : (
            <button
              onClick={() => openAuthModal()}
              className="w-full p-3.5 sm:p-4 rounded-2xl bg-[#B6FF3C]/10 hover:bg-[#B6FF3C]/15 border border-[#B6FF3C]/30 flex items-center justify-between text-left transition active:scale-[0.99] group cursor-pointer shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#B6FF3C]/20 border border-[#B6FF3C]/30 flex items-center justify-center text-[#B6FF3C] group-hover:scale-105 transition-transform">
                  <LogIn className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-[#B6FF3C]">Sign In / Register</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Access your wallet and match entries</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#B6FF3C]/60 group-hover:text-[#B6FF3C] group-hover:translate-x-0.5 transition-all" />
            </button>
          )}
        </div>

        {/* Platform Version Footnote */}
        <div className="text-center pt-2 text-[10px] text-slate-500 font-medium">
          BattlePro Esports Arena v{settings.appVersion || '1.0.0'}
        </div>
      </div>

      {/* Confirmation Modal for Logout */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-[#131C31] border border-slate-700/90 rounded-2xl p-5 shadow-2xl text-slate-100 animate-scale-up">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Log Out?</h3>
                <p className="text-xs text-slate-400">Are you sure you want to log out?</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-5 bg-[#0B1120] p-3 rounded-xl border border-slate-800/80">
              You will need to sign in again to view your match history, join tournaments, and manage your wallet balance.
            </p>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogoutConfirmOpen(false);
                  signOutUser();
                }}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-red-500/20 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Yes, Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Modals */}
      <ReferAndEarnModal
        isOpen={isReferModalOpen}
        onClose={() => setIsReferModalOpen(false)}
      />

      <MatchHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onRoomKeyClick={onRoomKeyClick}
      />

      <PolicyModal
        type={activePolicy}
        isOpen={!!activePolicy}
        onClose={() => setActivePolicy(null)}
      />

      <EditNameModal
        isOpen={isEditNameOpen}
        onClose={() => setIsEditNameOpen(false)}
      />
    </div>
  );
};

