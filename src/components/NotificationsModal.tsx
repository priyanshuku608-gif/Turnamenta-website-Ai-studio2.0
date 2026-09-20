import React, { useEffect } from 'react';
import { X, Bell, Trophy, ArrowDownLeft, ArrowUpRight, CheckCircle, Info } from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import { UserNotification } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationsAsRead } = useTournament();

  useEffect(() => {
    if (isOpen) {
      markNotificationsAsRead();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getIcon = (type?: string) => {
    switch (type) {
      case 'match_start':
        return <Trophy className="w-5 h-5 text-amber-400" />;
      case 'deposit':
        return <ArrowDownLeft className="w-5 h-5 text-emerald-400" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-5 h-5 text-blue-400" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-[#B6FF3C]" />;
      default:
        return <Info className="w-5 h-5 text-cyan-400" />;
    }
  };

  const formatTimestamp = (ts: number | string) => {
    const d = new Date(Number(ts));
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md max-h-[85vh] bg-[#1E293B] border border-slate-700 rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl flex flex-col text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[#B6FF3C]">
              <Bell className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-base text-white">Notifications</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800/80 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto py-3 space-y-2.5 flex-1 pr-1">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Bell className="w-10 h-10 mx-auto mb-2 text-slate-600 opacity-60" />
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Updates about tournaments, deposits, and room keys will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notif, idx) => (
              <div
                key={notif.id || idx}
                className="bg-[#0F172A] border border-slate-800/80 rounded-xl p-3.5 flex gap-3 hover:border-slate-700 transition"
              >
                <div className="shrink-0 w-9 h-9 rounded-xl bg-slate-800/80 flex items-center justify-center">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-200 truncate">{notif.title}</h3>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {formatTimestamp(notif.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed break-words">
                    {notif.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
