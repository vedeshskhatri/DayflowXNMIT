import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { playReceiptPrintSound, playErrorSound, playEasterEggSound } from '../lib/sounds';
import { Trophy, Flame, Zap, Award, ShoppingBag, QrCode, Printer, Check, Copy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  rank: number;
  employeeId: string;
  name: string;
  jobTitle: string | null;
  profilePicUrl: string | null;
  total: number;
  streak: number;
  badges: { key: string; emoji: string; label: string }[];
}

interface MyStats {
  total: number;
  streak: number;
  maxStreak: number;
  easterEggUsed: boolean;
  badges: { key: string; emoji: string; label: string; description: string; earnedAt: string }[];
  recentTransactions: { reason: string; amount: number; description: string | null; createdAt: string }[];
  redemptions: { id: string; reward: { name: string; emoji: string; description?: string; category?: string }; pointCost: number; status: string; createdAt: string }[];
}

interface Reward {
  id: string;
  name: string;
  description: string;
  emoji: string;
  pointCost: number;
  category: string;
  stockCount: number;
}

interface ClaimReceiptData {
  id: string;
  rewardName: string;
  rewardEmoji: string;
  rewardCategory?: string;
  rewardDescription?: string;
  pointCost: number;
  status: string;
  createdAt: string;
  employeeName?: string;
  employeeLoginId?: string;
}

// ─── SVG QR Code Component ────────────────────────────────────────────────────

function QRCodeSVG({ value }: { value: string }) {
  const size = 21;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setFinderPattern = (r: number, c: number) => {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (
          i === 0 || i === 6 || j === 0 || j === 6 ||
          (i >= 2 && i <= 4 && j >= 2 && j <= 4)
        ) {
          matrix[r + i][c + j] = true;
        }
      }
    }
  };

  setFinderPattern(0, 0);
  setFinderPattern(0, size - 7);
  setFinderPattern(size - 7, 0);

  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const inFinder =
        (i < 8 && j < 8) ||
        (i < 8 && j >= size - 8) ||
        (i >= size - 8 && j < 8);
      if (!inFinder) {
        const seed = Math.sin(hash + i * 31 + j * 17) * 10000;
        matrix[i][j] = seed - Math.floor(seed) > 0.45;
      }
    }
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full text-navy-dark" fill="currentColor">
      {matrix.map((row, r) =>
        row.map((cell, c) => (cell ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" /> : null))
      )}
    </svg>
  );
}

// ─── Thermal Claim Receipt Modal (Interactive Print Animation) ─────────────────

function ClaimReceiptModal({
  receipt,
  onClose,
}: {
  receipt: ClaimReceiptData | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!receipt) return null;

  const voucherCode = `DF-CLAIM-${receipt.id.slice(0, 4).toUpperCase()}-${receipt.id.slice(-4).toUpperCase()}`;
  const isApproved = receipt.status === 'APPROVED';
  const claimUrl = `https://dayflow.dev/claims/verify/${receipt.id}`;

  const copyVoucher = () => {
    navigator.clipboard.writeText(voucherCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[99998] flex items-center justify-center bg-navy-dark/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
      <div className="max-w-md w-full my-8 flex flex-col items-center">
        {/* Metallic Printer Dispenser Head Slot */}
        <div className="w-72 h-4 bg-gradient-to-r from-navy-dark via-navy to-navy-dark rounded-t-lg border-t border-x border-navy/40 shadow-md relative z-20 flex items-center justify-center">
          <div className="w-60 h-1.5 bg-black/90 rounded-full shadow-inner" />
        </div>

        {/* The Printable Paper Slip */}
        <div className="w-full bg-[#FAF8F5] text-navy-dark border border-navy/20 shadow-modal rounded-b-2xl relative overflow-hidden -mt-1 z-10 animate-printReceipt">
          {/* Perforated dotted line at top */}
          <div className="border-b-2 border-dashed border-navy/20 pt-4 pb-2 px-6 text-center bg-cream/30">
            <div className="flex items-center justify-center space-x-1.5 mb-1">
              <span className="text-xl">🌸</span>
              <span className="font-heading font-bold text-sm tracking-wider uppercase text-navy-dark">
                Dayflow HRMS • Perks Voucher
              </span>
            </div>
            <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest">Official Claim Receipt</p>
          </div>

          {/* Receipt Content Body */}
          <div className="p-6 space-y-5 text-center">
            {/* Big Emoji & Perk Name */}
            <div>
              <div className="w-16 h-16 rounded-2xl bg-white border border-navy/10 shadow-sm flex items-center justify-center text-4xl mx-auto mb-2">
                {receipt.rewardEmoji}
              </div>
              <h3 className="font-heading font-bold text-lg text-navy-dark leading-tight">
                {receipt.rewardName}
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                {receipt.rewardCategory ? `${receipt.rewardCategory} Perk` : 'Employee Benefit'}
              </p>
            </div>

            {/* Status Stamp */}
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border text-xs font-bold font-mono">
              {isApproved ? (
                <span className="bg-sage-light/60 text-navy-dark border-sage-deep/30 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-sage-deep" /> VERIFIED & READY TO CLAIM
                </span>
              ) : (
                <span className="bg-amber-100 text-amber-800 border-amber-300 flex items-center gap-1">
                  ⏳ PENDING HR APPROVAL
                </span>
              )}
            </div>

            {/* QR Code & Scan box */}
            <div className="bg-white border border-navy/15 rounded-2xl p-4 shadow-sm flex flex-col items-center max-w-[210px] mx-auto">
              <div className="w-36 h-36 p-2 bg-white rounded-xl">
                <QRCodeSVG value={claimUrl} />
              </div>
              <span className="text-[10px] font-mono text-copper font-bold mt-2 tracking-wider">
                SCAN TO REDEEM
              </span>
            </div>

            {/* Voucher Code Box */}
            <div className="bg-cream-light border border-navy/15 rounded-xl p-3 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold block font-mono">
                  Voucher Serial No.
                </span>
                <span className="font-mono font-bold text-sm text-navy">{voucherCode}</span>
              </div>
              <button
                onClick={copyVoucher}
                className="p-2 rounded-lg bg-white border border-navy/15 hover:bg-cream text-navy-dark transition-all text-xs flex items-center gap-1 shadow-sm cursor-pointer"
                title="Copy code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-sage-deep" /> : <Copy className="w-3.5 h-3.5 text-text-muted" />}
                <span className="text-[11px] font-bold">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            {/* Metadata Table */}
            <div className="border-t border-b border-dashed border-navy/20 py-3 space-y-1.5 text-xs text-left font-mono">
              <div className="flex justify-between">
                <span className="text-text-muted">Claimant:</span>
                <span className="font-bold text-navy-dark">{receipt.employeeName || 'You'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Deduction:</span>
                <span className="font-bold text-copper font-mono">-{receipt.pointCost} Pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Issued At:</span>
                <span className="text-navy-dark">{new Date(receipt.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Location:</span>
                <span className="text-navy-dark">Dayflow Campus (HQ)</span>
              </div>
            </div>

            {/* Simulated Barcode */}
            <div className="pt-1 flex flex-col items-center">
              <div className="flex items-center justify-center space-x-0.5 h-8 w-48 bg-navy/10 p-1 rounded">
                {Array.from({ length: 42 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-navy-dark h-full"
                    style={{ width: i % 3 === 0 ? '3px' : i % 2 === 0 ? '1.5px' : '2px', opacity: (i % 5 === 0) ? 0.3 : 0.85 }}
                  />
                ))}
              </div>
              <span className="text-[9px] font-mono text-text-muted mt-1 tracking-widest">
                * {receipt.id.slice(0, 12).toUpperCase()} *
              </span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-4 bg-cream/50 border-t border-navy/10 flex items-center justify-between gap-3">
            <button
              onClick={() => window.print()}
              className="flex-1 bg-white hover:bg-cream border border-navy/20 text-navy-dark py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-copper" />
              <span>Print Slip</span>
            </button>

            <button
              onClick={onClose}
              className="btn-navy flex-1 py-2.5 px-4 text-xs font-bold shadow-sm cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes printSlipAnim {
          0% { transform: translateY(-40px) scaleY(0.6); opacity: 0; }
          40% { opacity: 1; }
          100% { transform: translateY(0px) scaleY(1); opacity: 1; }
        }
        .animate-printReceipt {
          animation: printSlipAnim 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top center;
        }
      `}</style>
    </div>
  );
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

function Confetti({ active }: { active: boolean }) {
  const colors = ['#2D4263', '#B87333', '#C8D6AF', '#C86446', '#FFF5E1', '#D49A55'];
  const pieces = Array.from({ length: 65 });

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
      {pieces.map((_, i) => {
        const color = colors[i % colors.length];
        const left = `${Math.random() * 100}%`;
        const delay = `${Math.random() * 0.5}s`;
        const dur = `${1.8 + Math.random() * 1.5}s`;
        const size = `${8 + Math.random() * 8}px`;
        const rotation = `${Math.random() * 720}deg`;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left,
              top: '-20px',
              width: size,
              height: size,
              backgroundColor: color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              animation: `confettiFall ${dur} ${delay} ease-in forwards`,
              transform: `rotate(${rotation})`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Easter Egg Modal ─────────────────────────────────────────────────────────

function EasterEggModal({
  open,
  alreadyFound,
  onClose,
}: {
  open: boolean;
  alreadyFound: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[99998] flex items-center justify-center bg-navy-dark/50 backdrop-blur-sm p-4">
      <div className="bg-white border border-navy/10 rounded-3xl p-8 max-w-md w-full text-center shadow-modal animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-cream-light border border-copper/30 flex items-center justify-center text-4xl mx-auto mb-4 animate-bounce">
          {alreadyFound ? '🥚' : '🎉'}
        </div>
        <h2 className="text-2xl font-heading font-bold text-navy-dark mb-2">
          {alreadyFound ? "You're Already a Legend!" : '🕹️ Easter Egg Discovered!'}
        </h2>
        <p className="text-text-muted text-sm leading-relaxed mb-5">
          {alreadyFound
            ? "You have already unlocked the secret Dayflow Easter Egg. Keep holding down the leaderboard!"
            : "Incredible curiosity! You found the hidden Easter Egg in Dayflow HRMS. You are officially awarded the Dayflow Legend status."}
        </p>

        {!alreadyFound && (
          <div className="bg-cream-light border border-copper/30 rounded-2xl p-4 mb-5 flex items-center justify-center space-x-3">
            <span className="text-2xl">🪙</span>
            <div className="text-left">
              <span className="text-copper font-heading font-bold text-lg font-mono">+50 Points</span>
              <p className="text-text-muted text-xs">Credited instantly to your account</p>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="btn-navy w-full py-3 px-6 text-sm font-bold shadow-sm cursor-pointer"
        >
          Awesome, Continue
        </button>
      </div>
    </div>
  );
}

// ─── Rank Badge ───────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="w-8 h-8 rounded-full bg-copper-muted border border-copper/40 text-copper-dark flex items-center justify-center font-bold text-sm shadow-sm">🥇</div>;
  if (rank === 2) return <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-sm shadow-sm">🥈</div>;
  if (rank === 3) return <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-center font-bold text-sm shadow-sm">🥉</div>;
  return <div className="w-8 h-8 rounded-full bg-cream border border-navy/10 text-navy-dark flex items-center justify-center font-heading font-bold text-xs font-mono">#{rank}</div>;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, src, size = 'md' }: { name: string; src?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'w-9 h-9 text-xs' : size === 'lg' ? 'w-16 h-16 text-lg' : 'w-12 h-12 text-sm';
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  if (src) {
    return <img src={src} alt={name} className={`${sizeClass} rounded-full object-cover ring-2 ring-navy/10 shadow-sm`} />;
  }
  return (
    <div className={`${sizeClass} rounded-full bg-navy text-white font-heading font-bold flex items-center justify-center shadow-sm`}>
      {initials}
    </div>
  );
}

const REASON_LABELS: Record<string, string> = {
  DAILY_CHECKIN: 'Daily Check-in',
  EARLY_CHECKIN: 'Early Bird Check-in',
  FULL_DAY_WORK: 'Full 8h Workday',
  STREAK_7: '7-Day Streak Milestone',
  STREAK_30: '30-Day Streak Milestone',
  STREAK_90: '90-Day Streak Milestone',
  PROFILE_COMPLETE: 'Profile 100% Complete',
  EARLY_LEAVE_REQUEST: 'Planned Leave Request',
  ADMIN_AWARD: 'Admin Recognition Award',
  ADMIN_DEDUCT: 'Store Redemption',
  EASTER_EGG: 'Dayflow Easter Egg Bonus',
};

export const RewardsPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'leaderboard' | 'store' | 'journey'>('leaderboard');
  const queryClient = useQueryClient();

  const [activeReceipt, setActiveReceipt] = useState<ClaimReceiptData | null>(null);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [easterEggAlreadyFound, setEasterEggAlreadyFound] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const trophyClicksRef = useRef<number[]>([]);

  const { data: leaderboard = [], isLoading: lbLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['rewards', 'leaderboard'],
    queryFn: async () => (await api.get('/rewards/leaderboard')).data,
    staleTime: 30_000,
  });

  const { data: myStats, isLoading: statsLoading } = useQuery<MyStats>({
    queryKey: ['rewards', 'me'],
    queryFn: async () => (await api.get('/rewards/me')).data,
    staleTime: 30_000,
  });

  const { data: catalogue = [], isLoading: catLoading } = useQuery<Reward[]>({
    queryKey: ['rewards', 'catalogue'],
    queryFn: async () => (await api.get('/rewards/catalogue')).data,
    staleTime: 60_000,
  });

  const redeemMut = useMutation({
    mutationFn: async (reward: Reward) => {
      const res = await api.post('/rewards/redeem', { rewardId: reward.id });
      return { ...res.data, rawReward: reward };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      playReceiptPrintSound();

      const redemption = data.redemption;
      const rawReward = data.rawReward;
      setActiveReceipt({
        id: redemption?.id || `${Date.now()}`,
        rewardName: redemption?.reward?.name || rawReward?.name || 'Perk Voucher',
        rewardEmoji: redemption?.reward?.emoji || rawReward?.emoji || '🎁',
        rewardCategory: redemption?.reward?.category || rawReward?.category,
        rewardDescription: rawReward?.description,
        pointCost: redemption?.pointCost || rawReward?.pointCost || 0,
        status: data.status || 'APPROVED',
        createdAt: redemption?.createdAt || new Date().toISOString(),
        employeeName: user ? `${user.firstName} ${user.lastName}` : undefined,
        employeeLoginId: user?.loginId,
      });
    },
    onError: () => playErrorSound(),
  });

  const eggMut = useMutation({
    mutationFn: async () => (await api.post('/rewards/easter-egg')).data,
    onSuccess: (data) => {
      setEasterEggAlreadyFound(data.alreadyFound);
      setShowEasterEgg(true);
      if (!data.alreadyFound) {
        setShowConfetti(true);
        playEasterEggSound();
        setTimeout(() => setShowConfetti(false), 4000);
        queryClient.invalidateQueries({ queryKey: ['rewards'] });
      }
    },
  });

  const handleTrophyClick = useCallback(() => {
    const now = Date.now();
    trophyClicksRef.current = [...trophyClicksRef.current.filter((t) => now - t < 1000), now];
    if (trophyClicksRef.current.length >= 3) {
      trophyClicksRef.current = [];
      eggMut.mutate();
    }
  }, [eggMut]);

  const myPoints = myStats?.total ?? 0;
  const myStreak = myStats?.streak ?? 0;

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      <Confetti active={showConfetti} />
      
      <ClaimReceiptModal receipt={activeReceipt} onClose={() => setActiveReceipt(null)} />

      <EasterEggModal
        open={showEasterEgg}
        alreadyFound={easterEggAlreadyFound}
        onClose={() => setShowEasterEgg(false)}
      />

      {/* Top Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-navy/10">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleTrophyClick}
            type="button"
            className="w-14 h-14 rounded-2xl bg-white border border-navy/10 shadow-elevated flex items-center justify-center text-3xl hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            title="Triple click for a surprise 🏆"
          >
            <Trophy className="w-7 h-7 text-copper group-hover:rotate-12 transition-transform" />
          </button>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-navy-dark tracking-tight">
                Rewards & Leaderboard
              </h1>
              <span className="bg-copper-muted text-copper-dark border border-copper/30 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider font-mono">
                Gamification
              </span>
            </div>
            <p className="text-sm text-text-muted mt-1 font-medium">
              Build daily attendance streaks, earn reward points, and claim your printed voucher passes.
            </p>
          </div>
        </div>

        {/* User Quick Stats Chips */}
        <div className="flex items-center space-x-3">
          <div className="bg-white border border-navy/10 rounded-2xl px-5 py-3 shadow-card flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-copper-muted border border-copper/30 flex items-center justify-center text-copper font-bold">
              <Flame className="w-5 h-5 text-copper fill-copper animate-pulse" />
            </div>
            <div>
              <div className="text-xs text-text-muted uppercase font-bold tracking-wider font-mono">Current Streak</div>
              <div className="text-xl font-heading font-bold text-copper font-mono">{myStreak} Days</div>
            </div>
          </div>

          <div className="bg-white border border-navy/10 rounded-2xl px-5 py-3 shadow-card flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cream border border-navy/10 flex items-center justify-center text-navy font-bold text-base">
              🪙
            </div>
            <div>
              <div className="text-xs text-text-muted uppercase font-bold tracking-wider font-mono">Your Balance</div>
              <div className="text-xl font-heading font-bold text-navy font-mono">{myPoints.toLocaleString()} Pts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between">
        <div className="bg-white p-1.5 rounded-2xl border border-navy/10 shadow-sm inline-flex space-x-1">
          <button
            onClick={() => setTab('leaderboard')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer ${
              tab === 'leaderboard'
                ? 'bg-navy text-white shadow-sm'
                : 'text-text-muted hover:text-navy-dark hover:bg-cream'
            }`}
          >
            <Trophy className="w-4 h-4 text-copper-bright" />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={() => setTab('store')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer ${
              tab === 'store'
                ? 'bg-navy text-white shadow-sm'
                : 'text-text-muted hover:text-navy-dark hover:bg-cream'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-copper-bright" />
            <span>Goodies Store</span>
          </button>

          <button
            onClick={() => setTab('journey')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer ${
              tab === 'journey'
                ? 'bg-navy text-white shadow-sm'
                : 'text-text-muted hover:text-navy-dark hover:bg-cream'
            }`}
          >
            <Award className="w-4 h-4 text-copper-bright" />
            <span>My Journey & Vouchers</span>
          </button>
        </div>
      </div>

      {/* TAB 1: LEADERBOARD */}
      {tab === 'leaderboard' && (
        <div className="space-y-8">
          {lbLoading ? (
            <div className="bg-white rounded-3xl p-16 border border-navy/10 text-center text-text-muted shadow-card">
              <div className="w-8 h-8 border-3 border-navy/20 border-t-navy rounded-full animate-spin mx-auto mb-3" />
              Loading company leaderboard...
            </div>
          ) : (
            <>
              {/* Podium for Top 3 */}
              {leaderboard.length >= 3 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
                  {/* #2 Rank (Silver) */}
                  <div className="bg-white rounded-3xl border border-navy/10 shadow-card p-6 flex flex-col items-center text-center relative order-2 md:order-1">
                    <div className="absolute -top-4 w-9 h-9 rounded-full bg-slate-100 border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-sm shadow-sm">
                      🥈
                    </div>
                    <Avatar name={leaderboard[1].name} src={leaderboard[1].profilePicUrl} size="md" />
                    <h3 className="font-heading font-bold text-navy-dark text-base mt-3">{leaderboard[1].name}</h3>
                    <p className="text-xs text-text-muted">{leaderboard[1].jobTitle || 'Employee'}</p>
                    <div className="mt-4 pt-3 border-t border-navy/10 w-full flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-copper flex items-center gap-1">🔥 {leaderboard[1].streak}d</span>
                      <span className="font-heading font-bold text-navy text-sm">{leaderboard[1].total.toLocaleString()} pts</span>
                    </div>
                  </div>

                  {/* #1 Rank (Gold Champion) */}
                  <div className="bg-white rounded-3xl border-2 border-copper shadow-elevated p-8 flex flex-col items-center text-center relative order-1 md:order-2 transform md:-translate-y-3">
                    <div className="absolute -top-5 w-12 h-12 rounded-2xl bg-copper text-white flex items-center justify-center text-2xl shadow-copper">
                      👑
                    </div>
                    <Avatar name={leaderboard[0].name} src={leaderboard[0].profilePicUrl} size="lg" />
                    <span className="inline-flex items-center mt-3 px-3 py-0.5 rounded-full text-xs font-bold bg-copper-muted text-copper-dark border border-copper/30 font-mono">
                      Company Leader
                    </span>
                    <h3 className="font-heading font-bold text-navy-dark text-lg mt-1">{leaderboard[0].name}</h3>
                    <p className="text-xs text-text-muted">{leaderboard[0].jobTitle || 'Lead'}</p>
                    <div className="mt-4 pt-3 border-t border-navy/10 w-full flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-copper flex items-center gap-1 text-sm">🔥 {leaderboard[0].streak}d streak</span>
                      <span className="font-heading font-bold text-navy text-base">{leaderboard[0].total.toLocaleString()} pts</span>
                    </div>
                  </div>

                  {/* #3 Rank (Bronze) */}
                  <div className="bg-white rounded-3xl border border-navy/10 shadow-card p-6 flex flex-col items-center text-center relative order-3">
                    <div className="absolute -top-4 w-9 h-9 rounded-full bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-center font-bold text-sm shadow-sm">
                      🥉
                    </div>
                    <Avatar name={leaderboard[2].name} src={leaderboard[2].profilePicUrl} size="md" />
                    <h3 className="font-heading font-bold text-navy-dark text-base mt-3">{leaderboard[2].name}</h3>
                    <p className="text-xs text-text-muted">{leaderboard[2].jobTitle || 'Employee'}</p>
                    <div className="mt-4 pt-3 border-t border-navy/10 w-full flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-copper flex items-center gap-1">🔥 {leaderboard[2].streak}d</span>
                      <span className="font-heading font-bold text-navy text-sm">{leaderboard[2].total.toLocaleString()} pts</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Full Standings List */}
              <div className="bg-white rounded-3xl border border-navy/10 shadow-elevated overflow-hidden">
                <div className="px-8 py-5 border-b border-navy/10 bg-cream/50 flex items-center justify-between">
                  <h3 className="font-heading font-bold text-navy-dark text-base">Company Leaderboard Standings</h3>
                  <span className="text-xs text-text-muted font-bold font-mono">{leaderboard.length} Ranked Members</span>
                </div>

                <div className="divide-y divide-navy/10">
                  {leaderboard.map((emp) => (
                    <div
                      key={emp.employeeId}
                      className="px-8 py-4 flex items-center justify-between hover:bg-cream/40 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <RankBadge rank={emp.rank} />
                        <Avatar name={emp.name} src={emp.profilePicUrl} size="sm" />
                        <div>
                          <div className="font-heading font-bold text-navy-dark text-sm flex items-center space-x-2">
                            <span>{emp.name}</span>
                            {emp.streak >= 7 && (
                              <span className="bg-copper-muted text-copper-dark border border-copper/30 rounded-full px-2 py-0.5 text-[10px] font-bold font-mono">
                                🔥 {emp.streak}d
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-text-muted font-medium">{emp.jobTitle || 'Employee'}</div>
                        </div>
                      </div>

                      {/* Badges preview */}
                      <div className="flex items-center space-x-6">
                        <div className="hidden sm:flex items-center space-x-1.5">
                          {emp.badges.slice(0, 4).map((b) => (
                            <span
                              key={b.key}
                              title={b.label}
                              className="w-8 h-8 rounded-xl bg-cream border border-navy/10 flex items-center justify-center text-sm shadow-xs"
                            >
                              {b.emoji}
                            </span>
                          ))}
                        </div>

                        <div className="text-right">
                          <div className="font-heading font-bold text-navy text-base font-mono">
                            {emp.total.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-text-muted uppercase tracking-wider font-mono font-bold">Points</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {leaderboard.length === 0 && (
                    <div className="p-12 text-center text-text-muted text-sm italic">
                      No points recorded yet. Check in daily to climb the leaderboard!
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: STORE */}
      {tab === 'store' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-navy/10 shadow-elevated p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-heading font-bold text-navy-dark text-xl">Employee Perks & Goodies Store</h3>
              <p className="text-sm text-text-muted mt-1 font-medium">
                Redeem your points for real vouchers, digital passes, and company merchandise.
              </p>
            </div>
            <div className="flex items-center space-x-2 bg-cream-light border border-copper/30 rounded-2xl px-4 py-2.5">
              <span className="text-lg">⚡</span>
              <span className="text-xs font-bold text-navy-dark font-mono">
                Rewards ≤ 500 Pts auto-approved with instant QR voucher
              </span>
            </div>
          </div>

          {catLoading ? (
            <div className="bg-white rounded-3xl p-16 border border-navy/10 text-center text-text-muted shadow-card">
              <div className="w-8 h-8 border-3 border-navy/20 border-t-navy rounded-full animate-spin mx-auto mb-3" />
              Loading goodies catalogue...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {catalogue.map((reward) => {
                const canAfford = myPoints >= reward.pointCost;
                const isAutoApproved = reward.pointCost <= 500;
                const outOfStock = reward.stockCount === 0;

                return (
                  <div
                    key={reward.id}
                    className="bg-white rounded-3xl border border-navy/10 shadow-card p-7 flex flex-col justify-between hover:shadow-elevated transition-all hover:border-navy/30"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="w-14 h-14 rounded-2xl bg-cream-light border border-navy/10 flex items-center justify-center text-3xl shadow-sm">
                          {reward.emoji}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="bg-navy text-white font-heading font-bold text-xs px-3 py-1 rounded-full font-mono shadow-xs">
                            {reward.pointCost.toLocaleString()} Pts
                          </span>
                          {isAutoApproved && (
                            <span className="text-[10px] font-bold text-copper flex items-center gap-0.5 font-mono">
                              <Zap className="w-3 h-3 text-copper" /> Instant Pass
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="font-heading font-bold text-navy-dark text-base mt-4">{reward.name}</h4>
                      <p className="text-xs text-text-muted mt-1 leading-relaxed">{reward.description}</p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-navy/10 flex items-center justify-between">
                      <span className="text-xs text-text-muted font-bold font-mono">
                        {reward.category} {reward.stockCount > 0 ? `• ${reward.stockCount} left` : ''}
                      </span>

                      <button
                        onClick={() => redeemMut.mutate(reward)}
                        disabled={!canAfford || outOfStock || redeemMut.isPending}
                        className="btn-navy rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                      >
                        <QrCode className="w-3.5 h-3.5 text-copper-bright" />
                        <span>{outOfStock ? 'Out of Stock' : canAfford ? 'Redeem & Print Slip' : 'Need More Pts'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MY JOURNEY */}
      {tab === 'journey' && (
        <div className="space-y-8">
          {statsLoading ? (
            <div className="bg-white rounded-3xl p-16 border border-navy/10 text-center text-text-muted shadow-card">
              <div className="w-8 h-8 border-3 border-navy/20 border-t-navy rounded-full animate-spin mx-auto mb-3" />
              Loading your journey data...
            </div>
          ) : myStats ? (
            <>
              {/* Stat Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="p-6 rounded-3xl bg-white border border-navy/10 shadow-card flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider font-mono">Total Balance</span>
                    <p className="text-2xl font-heading font-bold text-navy mt-1 font-mono">
                      {myStats.total.toLocaleString()} <span className="text-xs font-normal text-text-muted">Pts</span>
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-cream border border-navy/10 text-navy flex items-center justify-center text-xl shadow-sm">
                    🪙
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-navy/10 shadow-card flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-copper uppercase tracking-wider font-mono">Current Streak</span>
                    <p className="text-2xl font-heading font-bold text-copper mt-1 font-mono">
                      {String(myStats.streak).padStart(2, '0')} <span className="text-xs font-normal text-text-muted">Days</span>
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-copper-muted border border-copper/30 text-copper flex items-center justify-center shadow-sm">
                    <Flame className="w-6 h-6 fill-copper text-copper" />
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-navy/10 shadow-card flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-navy-dark uppercase tracking-wider font-mono">Personal Best</span>
                    <p className="text-2xl font-heading font-bold text-navy-dark mt-1 font-mono">
                      {String(myStats.maxStreak).padStart(2, '0')} <span className="text-xs font-normal text-text-muted">Days</span>
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-cream-light border border-navy/10 text-navy flex items-center justify-center shadow-sm">
                    <Zap className="w-6 h-6 text-copper" />
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-navy/10 shadow-card flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-sage-deep uppercase tracking-wider font-mono">Claimed Passes</span>
                    <p className="text-2xl font-heading font-bold text-sage-deep mt-1 font-mono">
                      {String(myStats.redemptions.length).padStart(2, '0')} <span className="text-xs font-normal text-text-muted">Vouchers</span>
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-sage-light/40 text-sage-deep flex items-center justify-center border border-sage-deep/30 shadow-sm">
                    <QrCode className="w-6 h-6 text-sage-deep" />
                  </div>
                </div>
              </div>

              {/* Badges Collection Wall */}
              <div className="bg-white rounded-3xl border border-navy/10 shadow-elevated p-8">
                <div className="flex items-center justify-between pb-5 border-b border-navy/10 mb-6">
                  <div>
                    <h3 className="font-heading font-bold text-navy-dark text-lg">Your Badges & Achievements</h3>
                    <p className="text-xs text-text-muted mt-0.5">Special honours unlocked through consistent presence & contribution</p>
                  </div>
                  <span className="text-xs font-bold text-navy bg-cream px-3 py-1 rounded-full border border-navy/10 font-mono">
                    {myStats.badges.length} Unlocked
                  </span>
                </div>

                {myStats.badges.length === 0 ? (
                  <div className="p-8 text-center text-text-muted text-xs bg-cream/30 rounded-2xl border border-navy/10 italic">
                    No badges unlocked yet. Keep checking in daily on time to earn your first badge!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {myStats.badges.map((badge) => (
                      <div
                        key={badge.key}
                        className="p-4 rounded-2xl bg-cream-light border border-navy/10 flex items-center space-x-3"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-white border border-navy/10 shadow-sm flex items-center justify-center text-2xl">
                          {badge.emoji}
                        </div>
                        <div>
                          <div className="font-heading font-bold text-navy-dark text-sm">{badge.label}</div>
                          <div className="text-[11px] text-text-muted leading-tight">{badge.description}</div>
                          <div className="text-[10px] text-text-muted/70 mt-1 font-mono">
                            {new Date(badge.earnedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Claimed Vouchers Passbook & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl border border-navy/10 shadow-elevated p-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading font-bold text-navy-dark text-base">My Claimed Voucher Passes</h3>
                    <span className="text-xs text-text-muted font-mono">Click to view slip</span>
                  </div>

                  <div className="divide-y divide-navy/10 max-h-96 overflow-y-auto">
                    {myStats.redemptions.map((redemption) => (
                      <div
                        key={redemption.id}
                        onClick={() =>
                          setActiveReceipt({
                            id: redemption.id,
                            rewardName: redemption.reward.name,
                            rewardEmoji: redemption.reward.emoji,
                            rewardCategory: redemption.reward.category,
                            rewardDescription: redemption.reward.description,
                            pointCost: redemption.pointCost,
                            status: redemption.status,
                            createdAt: redemption.createdAt,
                            employeeName: user ? `${user.firstName} ${user.lastName}` : undefined,
                            employeeLoginId: user?.loginId,
                          })
                        }
                        className="py-3.5 px-3 rounded-2xl flex items-center justify-between text-xs hover:bg-cream/50 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-11 h-11 rounded-2xl bg-cream-light border border-navy/10 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform shadow-xs">
                            {redemption.reward.emoji}
                          </div>
                          <div>
                            <div className="font-heading font-bold text-navy-dark text-sm group-hover:text-navy transition-colors">
                              {redemption.reward.name}
                            </div>
                            <div className="text-text-muted text-[11px] font-mono">
                              Code: DF-CLAIM-{redemption.id.slice(0, 4).toUpperCase()} • {new Date(redemption.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2.5">
                          <button
                            type="button"
                            className="p-2 rounded-xl bg-white border border-navy/10 text-navy group-hover:bg-navy group-hover:text-white transition-all shadow-sm"
                            title="View QR Voucher Pass"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {myStats.redemptions.length === 0 && (
                      <div className="py-8 text-center text-text-muted text-xs italic">
                        No vouchers claimed yet. Visit the Goodies Store to claim perks!
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-navy/10 shadow-elevated p-8">
                  <h3 className="font-heading font-bold text-navy-dark text-base mb-4">Recent Points Ledger</h3>
                  <div className="divide-y divide-navy/10 max-h-96 overflow-y-auto font-mono">
                    {myStats.recentTransactions.map((tx, idx) => (
                      <div key={idx} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-navy-dark font-sans">
                            {REASON_LABELS[tx.reason] || tx.reason}
                          </div>
                          {tx.description && <div className="text-text-muted text-[11px] font-sans">{tx.description}</div>}
                          <div className="text-text-muted text-[10px]">{new Date(tx.createdAt).toLocaleDateString()}</div>
                        </div>
                        <span className={`font-mono font-bold text-sm ${tx.amount >= 0 ? 'text-sage-deep' : 'text-terracotta'}`}>
                          {tx.amount >= 0 ? `+${tx.amount}` : tx.amount} pts
                        </span>
                      </div>
                    ))}
                    {myStats.recentTransactions.length === 0 && (
                      <div className="py-8 text-center text-text-muted text-xs italic font-sans">No transactions recorded yet.</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};
export default RewardsPage;
