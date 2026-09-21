export type AdminTab =
  | 'dashboard'
  | 'games'
  | 'promotions'
  | 'tournaments'
  | 'tournament-mgt'
  | 'leaderboard-mgt'
  | 'users'
  | 'user-analytics'
  | 'notifications'
  | 'transactions'
  | 'withdrawals'
  | 'deposits'
  | 'referrals'
  | 'theme-customization'
  | 'settings';

export type TabType = 'home' | 'wallet' | 'leaderboard' | 'profile';

export interface AdminConfig {
  setupComplete: boolean;
  adminUid: string;
  adminEmail?: string;
  adminName?: string;
  createdAt?: number;
}

export interface Game {
  id: string;
  name: string;
  imageUrl?: string;
  createdAt?: number;
  [key: string]: any;
}

export interface Promotion {
  id: string;
  imageUrl: string;
  link?: string;
  title?: string;
  createdAt?: number;
  [key: string]: any;
}

export interface RegisteredPlayer {
  userId?: string;
  uid?: string;
  inGameName?: string;
  inGameId?: string;
  email?: string;
  displayName?: string;
  joinedAt?: number;
  slotNumber?: number;
  [key: string]: any;
}

export interface Tournament {
  id: string;
  gameId: string;
  name: string;
  startTime: string;
  status: 'upcoming' | 'ongoing' | 'result' | 'completed' | 'cancelled';
  entryFee: number;
  prizePool: number;
  perKillPrize: number;
  maxPlayers: number;
  bannerUrl?: string;
  mode?: string;
  tags?: string[];
  description?: string;
  roomId?: string;
  roomPassword?: string;
  showIdPass?: boolean;
  prizeDistribution?: any;
  registeredPlayers?: Record<string, RegisteredPlayer> | RegisteredPlayer[];
  results?: Record<string, TournamentPlayerResult>;
  resultsPublished?: boolean;
  resultsCredited?: boolean;
  createdAt?: number;
  updatedAt?: number;
  [key: string]: any;
}

export interface TournamentPlayerResult {
  userId?: string;
  username: string;
  gameUid: string;
  isTeammate?: boolean;
  teammateOfUserId?: string;
  kills: number;
  extraAmount: number;
  rank: number;
  calculatedPrize: number;
  creditedAt?: number;
  [key: string]: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  username?: string;
  gameUid?: string;
  photoURL?: string;
  balance: number;
  depositBalance?: number;
  winningCash: number;
  bonusCash: number;
  status: 'active' | 'blocked' | 'banned' | string;
  referralCode?: string;
  referredBy?: string;
  referralPromptComplete?: boolean;
  isAdmin?: boolean;
  referralEarnings?: number;
  totalEarnings?: number;
  totalMatches?: number;
  wonMatches?: number;
  leaderboardRank?: number | null;
  leaderboardDisplayEarnings?: number | null;
  notifications?: any;
  lastCheckedNotifications?: any;
  createdAt?: number;
  updatedAt?: number;
  [key: string]: any;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  paymentMethod?: string;
  method?: string;
  paymentDetails?: string;
  accountDetails?: string;
  status: 'pending' | 'completed' | 'rejected';
  requestedAt?: number;
  createdAt?: number;
  processedAt?: number;
  processedBy?: string;
  adminNote?: string;
  rejectReason?: string;
  rejectionReason?: string;
  userEmail?: string;
  userName?: string;
  [key: string]: any;
}

export type Withdrawal = WithdrawalRequest;

export interface DepositRequest {
  id: string;
  userId: string;
  amount: number;
  type?: 'manual' | 'api' | string;
  uniqueid?: string;
  transactionid?: string;
  transactionId?: string;
  payment_url?: string;
  created_at?: string;
  expires_at?: string;
  provider_transaction_id?: string;
  updated_at?: string;
  walletCredited?: boolean;
  utr?: string;
  utrNumber?: string;
  paymentRef?: string;
  paymentMethod?: string;
  screenshotUrl?: string;
  status: 'pending' | 'completed' | 'rejected' | 'success' | 'expired' | string;
  submittedAt?: number;
  createdAt?: number;
  processedAt?: number;
  processedBy?: string;
  adminNote?: string;
  rejectReason?: string;
  rejectionReason?: string;
  userEmail?: string;
  userName?: string;
  [key: string]: any;
}

export type Deposit = DepositRequest;

export interface PendingReferral {
  id: string;
  referrerUid: string;
  referrerEmail?: string;
  referredUid: string;
  referredEmail?: string;
  referralCode?: string;
  status: 'pending' | 'completed' | 'credited' | 'rejected';
  amount?: number;
  bonusAmount?: number;
  createdAt?: number;
  timestamp?: number;
  creditedAt?: number;
  processedAt?: number;
  processedBy?: string;
  [key: string]: any;
}

export type ReferralRecord = PendingReferral;

export interface TransactionRecord {
  id: string;
  userId: string;
  userEmail?: string;
  type: string;
  amount: number;
  isCredit?: boolean;
  status: string;
  description: string;
  timestamp: number;
  balanceAfter?: number;
  adminUid?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export type Transaction = TransactionRecord;

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'announcement' | 'alert' | 'reward' | string;
  createdAt: number;
  sentBy?: string;
  [key: string]: any;
}

export type UserNotification = NotificationItem;

export interface LeaderboardItem {
  uid: string;
  displayName: string;
  email?: string;
  earnings: number;
  rank?: number;
  [key: string]: any;
}

export interface ThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  textColor?: string;
  enableShineEffect?: boolean;
  enableParticles?: boolean;
  glowIntensity?: number;
  [key: string]: any;
}

export type AppThemeSettings = ThemeConfig;

export interface AppSettings {
  appName?: string;
  appIconUrl?: string;
  logoUrl?: string;
  minWithdraw?: number;
  minWithdrawal?: number;
  maxWithdrawal?: number;
  minDeposit?: number;
  referralBonus?: number;
  signupBonus?: number;
  appVersion?: string;
  supportEmail?: string;
  supportContact?: string;
  supportTelegram?: string;
  telegramLink?: string;
  telegramChannel?: string;
  whatsappNumber?: string;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  maintenanceJoinLink?: string;
  upiId?: string;
  qrCodeUrl?: string;
  upiDetails?: {
    upiId?: string;
    qrCodeUrl?: string;
    accountName?: string;
  };
  policyPrivacy?: string;
  policyTerms?: string;
  policyRefund?: string;
  policyFairPlay?: string;
  otpApiBaseUrl?: string;
  paymentApiBaseUrl?: string;
  imgbbApiKey?: string;
  backgroundMusicUrl?: string;
  clickSoundUrl?: string;
  privacyPolicy?: string;
  termsConditions?: string;
  refundPolicy?: string;
  fairPlayPolicy?: string;
  theme?: ThemeConfig;
  [key: string]: any;
}
