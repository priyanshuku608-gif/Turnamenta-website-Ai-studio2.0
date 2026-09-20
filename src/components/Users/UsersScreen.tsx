import React, { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  DollarSign,
  Trophy,
  Shield,
  X,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  Edit,
  ExternalLink,
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { ref, set, update, serverTimestamp } from 'firebase/database';
import { db, firebaseConfig } from '../../lib/firebase';
import { useAdminData } from '../../context/AdminDataContext';
import { UserProfile } from '../../types';
import { UpdateBalanceModal } from './UpdateBalanceModal';

export const UsersScreen: React.FC = () => {
  const { users } = useAdminData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [balanceModalUser, setBalanceModalUser] = useState<UserProfile | null>(null);

  // Add User Form State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [initialBalance, setInitialBalance] = useState<number | ''>(0);
  const [creatingUser, setCreatingUser] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  const generateReferralCode = (name: string) => {
    const clean = (name || 'USER').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${clean || 'USER'}${rand}`;
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);

    if (!newEmail.trim() || !newPassword.trim()) {
      setAddError('Email and password are required.');
      return;
    }

    if (newPassword.length < 6) {
      setAddError('Password must be at least 6 characters.');
      return;
    }

    setCreatingUser(true);
    try {
      // Use secondary firebase app instance so current admin session is not interrupted
      const secondaryApp = initializeApp(firebaseConfig, 'SecondaryAuthApp_' + Date.now());
      const secondaryAuth = getAuth(secondaryApp);

      const cred = await createUserWithEmailAndPassword(secondaryAuth, newEmail.trim(), newPassword);
      const newUser = cred.user;

      if (newName.trim()) {
        await updateProfile(newUser, { displayName: newName.trim() });
      }

      const generatedRefCode = generateReferralCode(newName);
      const initBal = Number(initialBalance) || 0;

      // Write exactly as required in §4.7 (NO depositBalance field!)
      await set(ref(db, `users/${newUser.uid}`), {
        uid: newUser.uid,
        email: newEmail.trim(),
        displayName: newName.trim() || 'Player',
        balance: initBal,
        winningCash: 0,
        bonusCash: 0,
        status: 'active',
        createdAt: serverTimestamp(),
        referralCode: generatedRefCode,
        isAdmin: false,
        referralEarnings: 0,
        totalEarnings: 0,
        totalMatches: 0,
        wonMatches: 0,
      });

      await signOut(secondaryAuth);

      setAddSuccess(`User account created successfully for ${newEmail.trim()}`);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setInitialBalance(0);

      setTimeout(() => {
        setAddModalOpen(false);
        setAddSuccess(null);
      }, 2000);
    } catch (err: any) {
      console.error('Error creating user account:', err);
      if (err.code === 'auth/email-already-in-use') {
        setAddError('This email address is already registered.');
      } else {
        setAddError(err.message || 'Failed to create user account.');
      }
    } finally {
      setCreatingUser(false);
    }
  };

  const handleStatusToggle = async (user: UserProfile) => {
    const nextStatus = user.status === 'blocked' ? 'active' : 'blocked';
    try {
      await update(ref(db, `users/${user.uid}`), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      if (selectedUser?.uid === user.uid) {
        setSelectedUser((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const matchName = (u.displayName || '').toLowerCase().includes(term);
    const matchEmail = (u.email || '').toLowerCase().includes(term);
    const matchUid = u.uid.toLowerCase().includes(term);
    const matchRef = (u.referralCode || '').toLowerCase().includes(term);
    return matchName || matchEmail || matchUid || matchRef;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-400" />
            <span>User & Player Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered players directory, detailed wallet profiles, and manual balance tools.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="px-4 py-2 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-xs rounded-xl flex items-center gap-2 transition active:scale-95 shadow-md shadow-[#B6FF3C]/20 cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="bg-[#131C31] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, UID, or referral..."
            className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
          />
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>Total Players:</span>
          <strong className="text-white">{users.length}</strong>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#131C31] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0B1120] text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Balances (₹)</th>
                <th className="py-3 px-4">Referral Code</th>
                <th className="py-3 px-4">Matches / Won</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-800/40 transition">
                    {/* User Profile */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-xs">
                        {u.displayName || 'Unnamed Player'}
                      </div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                      <div className="font-mono text-[10px] text-slate-500 truncate max-w-[180px]">
                        {u.uid}
                      </div>
                    </td>

                    {/* Balances */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div>
                          Total: <strong className="text-white">₹{u.balance}</strong>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span className="text-emerald-400">Win: ₹{u.winningCash}</span>
                          <span>•</span>
                          <span className="text-amber-400">Bonus: ₹{u.bonusCash}</span>
                        </div>
                      </div>
                    </td>

                    {/* Referral */}
                    <td className="py-3 px-4 font-mono text-xs text-slate-300">
                      {u.referralCode ? (
                        <span className="px-2 py-0.5 rounded bg-[#0A0F1D] border border-slate-700 text-[#38BDF8]">
                          {u.referralCode}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Match Stats */}
                    <td className="py-3 px-4 text-slate-300">
                      <div>
                        {u.totalMatches || 0} Played / {u.wonMatches || 0} Won
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Total Earnings: ₹{u.totalEarnings || 0}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize inline-block ${
                          u.status === 'blocked'
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {u.status || 'active'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setBalanceModalUser(u)}
                          title="Adjust Wallet Balance"
                          className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Update Balance</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedUser(u)}
                          title="View Profile Details"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#131C31] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-5 text-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#B6FF3C]" />
                <span>Create New User Account</span>
              </h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="p-3 bg-red-950/70 border border-red-500/40 rounded-xl flex items-center gap-2 text-red-200 text-xs">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            {addSuccess && (
              <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-emerald-200 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{addSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Player Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="player@example.com"
                    className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Password (Min 6 chars) *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Initial Main Balance (₹)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    min={0}
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-[#0A0F1D] border border-slate-700 focus:border-[#B6FF3C] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-4 py-2 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-xs rounded-xl transition active:scale-95 disabled:opacity-50"
                >
                  {creatingUser ? 'Creating User...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#131C31] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-5 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  {selectedUser.displayName || 'Player Profile'}
                </h3>
                <p className="text-xs text-slate-400">{selectedUser.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Wallet Cards */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-[#0A0F1D] border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400">Total Balance</span>
                <div className="text-base font-extrabold text-white mt-0.5">₹{selectedUser.balance}</div>
              </div>
              <div className="p-3 bg-[#0A0F1D] border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400">Winning Cash</span>
                <div className="text-base font-extrabold text-emerald-400 mt-0.5">₹{selectedUser.winningCash}</div>
              </div>
              <div className="p-3 bg-[#0A0F1D] border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400">Bonus Cash</span>
                <div className="text-base font-extrabold text-amber-400 mt-0.5">₹{selectedUser.bonusCash}</div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="space-y-2 text-xs bg-[#0A0F1D] p-3.5 rounded-xl border border-slate-800">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">User UID:</span>
                <span className="font-mono text-slate-300">{selectedUser.uid}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Referral Code:</span>
                <span className="font-mono text-[#38BDF8]">{selectedUser.referralCode || 'None'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Matches Played / Won:</span>
                <span className="text-slate-200">
                  {selectedUser.totalMatches || 0} / {selectedUser.wonMatches || 0}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Total Lifetime Earnings:</span>
                <span className="text-[#B6FF3C] font-bold">₹{selectedUser.totalEarnings || 0}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Account Status:</span>
                <span className="font-bold capitalize text-slate-200">{selectedUser.status || 'active'}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleStatusToggle(selectedUser)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  selectedUser.status === 'blocked'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-red-950 hover:bg-red-900 border border-red-500/40 text-red-200'
                }`}
              >
                {selectedUser.status === 'blocked' ? 'Unblock User' : 'Block / Ban User'}
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = selectedUser;
                  setSelectedUser(null);
                  setBalanceModalUser(target);
                }}
                className="px-4 py-2 bg-[#B6FF3C] hover:bg-[#a5e834] text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition"
              >
                <DollarSign className="w-4 h-4" />
                <span>Adjust Balance</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Balance Modal Instance */}
      {balanceModalUser && (
        <UpdateBalanceModal
          user={balanceModalUser}
          onClose={() => setBalanceModalUser(null)}
        />
      )}
    </div>
  );
};
