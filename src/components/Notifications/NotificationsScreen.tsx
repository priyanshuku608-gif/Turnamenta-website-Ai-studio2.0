import React, { useState, useMemo } from 'react';
import { Bell, Send, Trash2, X, AlertCircle, CheckCircle2, User, Users, Megaphone, Link as LinkIcon, Search, UserCheck } from 'lucide-react';
import { ref, push, set, remove, serverTimestamp } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useAdminData } from '../../context/AdminDataContext';
import { NotificationItem } from '../../types';

export const NotificationsScreen: React.FC = () => {
  const { notifications, users } = useAdminData();
  const { adminConfig, currentUser } = useAdminAuth();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'all' | 'specific_user'>('all');
  const [targetUid, setTargetUid] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isUserPickerOpen, setIsUserPickerOpen] = useState(false);
  const [type, setType] = useState<'info' | 'alert' | 'promotion' | 'tournament'>('info');
  const [link, setLink] = useState('');

  const selectedTargetUser = useMemo(
    () => users.find((u) => u.uid === targetUid),
    [users, targetUid]
  );

  const filteredTargetUsers = useMemo(() => {
    if (!userSearchTerm.trim()) return users.slice(0, 15);
    const term = userSearchTerm.toLowerCase();
    return users.filter((u) => {
      const name = (u.displayName || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const uid = u.uid.toLowerCase();
      return name.includes(term) || email.includes(term) || uid.includes(term);
    }).slice(0, 20);
  }, [users, userSearchTerm]);

  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!title.trim() || !message.trim()) {
      setErrorMsg('Notification title and message are required.');
      return;
    }

    if (target === 'specific_user' && !targetUid.trim()) {
      setErrorMsg('Please select or specify a target user UID.');
      return;
    }

    setSending(true);
    try {
      const adminUid = adminConfig?.adminUid || currentUser?.uid || 'admin';
      const newNotifRef = push(ref(db, 'notifications'));

      await set(newNotifRef, {
        title: title.trim(),
        message: message.trim(),
        target,
        targetUid: target === 'specific_user' ? targetUid.trim() : null,
        type,
        link: link.trim() || null,
        createdBy: adminUid,
        timestamp: serverTimestamp(),
      });

      setSuccessMsg('Broadcast notification dispatched successfully!');
      setTitle('');
      setMessage('');
      setLink('');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Error sending notification:', err);
      setErrorMsg(err.message || 'Failed to send notification.');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(ref(db, `notifications/${id}`));
      setDeleteId(null);
    } catch (err: any) {
      alert('Failed to delete notification: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-amber-400" />
            <span>Push Notifications & Broadcasts</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch announcements, match alerts, and custom direct messages to player apps.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Broadcast Form */}
        <div className="lg:col-span-1 bg-[#131C31] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#B6FF3C]" />
            <h2 className="font-bold text-sm text-white">Send Broadcast Announcement</h2>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/70 border border-red-500/40 rounded-xl flex items-center gap-2 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-emerald-200 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSend} className="space-y-3.5 text-xs">
            {/* Target Audience */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Audience Target</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTarget('all')}
                  className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition ${
                    target === 'all'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-[#0A0F1D] border-slate-700 text-slate-400'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>All Users</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTarget('specific_user')}
                  className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition ${
                    target === 'specific_user'
                      ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                      : 'bg-[#0A0F1D] border-slate-700 text-slate-400'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Specific User</span>
                </button>
              </div>
            </div>

            {target === 'specific_user' && (
              <div className="space-y-2 animate-fade-in">
                <label className="font-semibold text-slate-300 flex items-center justify-between text-xs">
                  <span>Recipient Player</span>
                  {selectedTargetUser && (
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /> Selected
                    </span>
                  )}
                </label>

                {selectedTargetUser || (targetUid && !isUserPickerOpen) ? (
                  <div className="p-3 bg-[#0A0F1D] border border-[#B6FF3C]/40 rounded-xl flex items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#B6FF3C]/10 border border-[#B6FF3C]/30 flex items-center justify-center text-[#B6FF3C] font-bold text-xs shrink-0">
                        {(selectedTargetUser?.displayName || selectedTargetUser?.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {selectedTargetUser?.displayName || 'Selected Player'}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {selectedTargetUser?.email || 'No email'}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 truncate">
                          UID: {targetUid}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setTargetUid('');
                        setUserSearchTerm('');
                        setIsUserPickerOpen(true);
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded-lg text-xs flex items-center gap-1.5 transition active:scale-95 shrink-0 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 text-slate-400" />
                      <span>Change</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={userSearchTerm}
                        onChange={(e) => {
                          setUserSearchTerm(e.target.value);
                          setIsUserPickerOpen(true);
                        }}
                        onFocus={() => setIsUserPickerOpen(true)}
                        placeholder="Search player by name, email, or UID..."
                        className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
                      />
                    </div>

                    {/* Results dropdown */}
                    <div className="max-h-48 overflow-y-auto bg-[#0A0F1D] border border-slate-800 rounded-xl divide-y divide-slate-800/60 shadow-xl">
                      {filteredTargetUsers.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-500">
                          No players found matching "{userSearchTerm}".
                        </div>
                      ) : (
                        filteredTargetUsers.map((u) => (
                          <button
                            key={u.uid}
                            type="button"
                            onClick={() => {
                              setTargetUid(u.uid);
                              setUserSearchTerm('');
                              setIsUserPickerOpen(false);
                            }}
                            className="w-full text-left p-2.5 hover:bg-slate-800/50 flex items-center justify-between gap-2.5 transition cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-[11px] shrink-0">
                                {(u.displayName || u.email || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white truncate">
                                  {u.displayName || 'Unnamed Player'}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {u.email}
                                </div>
                              </div>
                            </div>
                            <span className="font-mono text-[9px] text-slate-500 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded shrink-0">
                              {u.uid.slice(0, 8)}...
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Type */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Notification Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3 py-2 text-white outline-none"
              >
                <option value="info">Information (Blue)</option>
                <option value="alert">Alert / Warning (Red)</option>
                <option value="promotion">Special Promotion (Gold)</option>
                <option value="tournament">Tournament Update (Lime)</option>
              </select>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Header Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Free Fire Mega Tournament Starts in 15 Min!"
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white placeholder-slate-500 outline-none"
              />
            </div>

            {/* Message */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Notification Content *</label>
              <textarea
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter details, match rules, or promo code..."
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white placeholder-slate-500 outline-none"
              />
            </div>

            {/* Link */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Optional Action URL</label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl px-3.5 py-2 text-white placeholder-slate-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full py-2.5 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 mt-3 cursor-pointer shadow-md"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Sending Broadcast...' : 'Dispatch Notification'}</span>
            </button>
          </form>
        </div>

        {/* Sent Notifications History */}
        <div className="lg:col-span-2 bg-[#131C31] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Notification Dispatch History</span>
            </h2>
            <span className="text-xs text-slate-400">{notifications.length} Sent</span>
          </div>

          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs bg-[#0A0F1D] rounded-xl border border-slate-800">
                No notifications dispatched yet.
              </div>
            ) : (
              notifications.map((n) => {
                const badgeColor =
                  n.type === 'alert'
                    ? 'bg-red-500/20 text-red-400 border-red-500/40'
                    : n.type === 'promotion'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : n.type === 'tournament'
                    ? 'bg-[#B6FF3C]/20 text-[#B6FF3C] border-[#B6FF3C]/40'
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/40';

                return (
                  <div
                    key={n.id}
                    className="p-4 bg-[#0A0F1D] border border-slate-800 rounded-xl flex items-start justify-between gap-4 text-xs group hover:border-slate-700 transition"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${badgeColor}`}>
                          {n.type || 'info'}
                        </span>
                        <span className="font-bold text-white text-sm">{n.title}</span>
                        <span className="text-[10px] text-slate-500">
                          {n.target === 'specific_user' ? `User: ${n.targetUid?.slice(0, 8)}...` : 'All Players'}
                        </span>
                      </div>

                      <p className="text-slate-300 text-xs leading-relaxed">{n.message}</p>

                      <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1">
                        <span>
                          {n.timestamp ? new Date(n.timestamp).toLocaleString() : 'Just now'}
                        </span>
                        {n.link && (
                          <a
                            href={n.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#38BDF8] hover:underline flex items-center gap-1 font-mono"
                          >
                            <LinkIcon className="w-3 h-3" />
                            <span>Attached Link</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDeleteId(n.id)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition"
                      title="Delete Notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-[#131C31] border border-red-500/40 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100">
            <h3 className="text-base font-bold text-white">Delete Notification?</h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to remove this notification record from the database history?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
