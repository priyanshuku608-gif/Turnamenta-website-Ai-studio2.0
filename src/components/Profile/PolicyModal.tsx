import React from 'react';
import { X, ShieldCheck, FileText, RefreshCw, Scale, FileQuestion } from 'lucide-react';
import { useTournament } from '../../context/TournamentContext';

export type PolicyType = 'privacy' | 'terms' | 'refund' | 'fairplay';

interface PolicyModalProps {
  type: PolicyType | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ type, isOpen, onClose }) => {
  const { settings } = useTournament();

  if (!isOpen || !type) return null;

  const getDetails = () => {
    switch (type) {
      case 'privacy':
        return {
          title: 'Privacy Policy',
          icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
          content: settings.policyPrivacy?.trim() || null,
        };
      case 'terms':
        return {
          title: 'Terms & Conditions',
          icon: <FileText className="w-5 h-5 text-blue-400" />,
          content: settings.policyTerms?.trim() || null,
        };
      case 'refund':
        return {
          title: 'Refund Policy',
          icon: <RefreshCw className="w-5 h-5 text-yellow-400" />,
          content: settings.policyRefund?.trim() || null,
        };
      case 'fairplay':
        return {
          title: 'Fair Play Policy',
          icon: <Scale className="w-5 h-5 text-[#B6FF3C]" />,
          content: settings.policyFairPlay?.trim() || null,
        };
    }
  };

  const details = getDetails();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#131C31] border border-slate-700/80 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col text-slate-100 overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0B1120] border border-slate-800 flex items-center justify-center shadow-inner">
              {details.icon}
            </div>
            <div>
              <h2 className="font-bold text-base text-white tracking-wide">{details.title}</h2>
              <span className="text-[10px] text-slate-400 font-medium">Official Platform Guidelines</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#0B1120] border border-slate-800 text-slate-400 hover:text-white transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="py-4 overflow-y-auto flex-1 pr-1 space-y-4">
          {details.content ? (
            <div className="p-4 bg-[#0B1120]/70 rounded-2xl border border-slate-800/80 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap break-words font-normal">
              {details.content}
            </div>
          ) : (
            <div className="py-10 px-4 text-center flex flex-col items-center justify-center bg-[#0B1120]/40 rounded-2xl border border-dashed border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400 mb-3 shadow-sm">
                <FileQuestion className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">This policy hasn't been added yet</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                The platform administrator has not published this policy document yet. Please check back later or contact support.
              </p>
            </div>
          )}

          <div className="p-3 bg-[#0B1120] rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-[#B6FF3C] shrink-0"></div>
            <span>For questions regarding platform rules, contact our official support team on Telegram.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 font-bold text-xs rounded-xl text-slate-200 transition active:scale-[0.99] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
