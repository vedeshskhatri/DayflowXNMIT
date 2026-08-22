import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { playRedeemSound, playErrorSound, playEasterEggSound } from '../lib/sounds';

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
  redemptions: { id: string; reward: { name: string; emoji: string }; pointCost: number; status: string; createdAt: string }[];
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

// ─── Confetti ─────────────────────────────────────────────────────────────────

function Confetti({ active }: { active: boolean }) {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
  const pieces = Array.from({ length: 80 });

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
      {pieces.map((_, i) => {
        const color = colors[i % colors.length];
        const left = `${Math.random() * 100}%`;
        const delay = `${Math.random() * 0.8}s`;
        const dur = `${1.5 + Math.random() * 1.5}s`;
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
              borderRadius: Math.random() > 0.5 ? '50%' : '0',
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
    <div className="fixed inset-0 z-[99998] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 border border-purple-500/50 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="text-6xl mb-4 animate-bounce">{alreadyFound ? '🥚' : '🎉'}</div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {alreadyFound ? "You're Already a Legend!" : '🕹️ Easter Egg Found!'}
        </h2>
        <p className="text-purple-200 mb-2">
          {alreadyFound
            ? "You already discovered the Dayflow Easter Egg. You're one of the greats."
            : "Whoa! You found the hidden Dayflow Easter Egg! You're officially a Dayflow Legend."}
        </p>
        {!alreadyFound && (
          <div className="bg-yellow-400/20 border border-yellow-400/40 rounded-xl p-3 mb-4">
            <span className="text-yellow-300 font-bold text-lg">+50 pts 🪙</span>
            <span className="text-yellow-200 text-sm ml-2">awarded to your account</span>
          </div>
        )}
        <div className="text-purple-300 text-xs mb-6 italic">
          🥚 Badge &quot;Dayflow Legend&quot; {alreadyFound ? 'already in your collection' : 'added to your profile'}
        </div>
        <button
          onClick={onClose}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 py-3 rounded-xl transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Rank badge ───────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return (
    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/60 text-sm font-bold">
      {rank}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, src, size = 'md' }: { name: string; src?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-16 h-16 text-xl' : 'w-10 h-10 text-sm';
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return <img src={src} alt={name} className={`${sizeClass} rounded-full object-cover ring-2 ring-white/20`} />;
  }
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white ring-2 ring-white/20`}>
      {initials}
    </div>
  );
}

// ─── Transaction reason label ─────────────────────────────────────────────────

const REASON_LABELS: Record<string, string> = {
  DAILY_CHECKIN: '📅 Daily Check-in',
  EARLY_CHECKIN: '🌅 Early Bird Bonus',
  FULL_DAY_WORK: '⏱️ Full Day',
  STREAK_7: '🔥 7-Day Streak',
  STREAK_30: '⚡ 30-Day Streak',
  STREAK_90: '🦁 90-Day Streak',
  PROFILE_COMPLETE: '✅ Profile Complete',
  EARLY_LEAVE_REQUEST: '📋 Early Leave Request',
  ADMIN_AWARD: '🏅 Admin Award',
  ADMIN_DEDUCT: '🛒 Redeemed',
  EASTER_EGG: '🥚 Easter Egg',
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RewardsPage() {
  const [tab, setTab] = useState<'leaderboard' | 'store' | 'journey'>('leaderboard');
  const queryClient = useQueryClient();

  // Easter egg state
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [easterEggAlreadyFound, setEasterEggAlreadyFound] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const trophyClicksRef = useRef<number[]>([]);

  // Data queries
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

  // Redeem mutation
  const redeemMut = useMutation({
    mutationFn: async (rewardId: string) => (await api.post('/rewards/redeem', { rewardId })).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      if (data.status === 'APPROVED') {
        playRedeemSound();
      }
    },
    onError: () => playErrorSound(),
  });

  // Easter egg mutation
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

  // Triple-click trophy easter egg trigger
  const handleTrophyClick = useCallback(() => {
    const now = Date.now();
    trophyClicksRef.current = [...trophyClicksRef.current.filter((t) => now - t < 1000), now];
    if (trophyClicksRef.current.length >= 3) {
      trophyClicksRef.current = [];
      eggMut.mutate();
    }
  }, [eggMut]);

  const myPoints = myStats?.total ?? 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Confetti active={showConfetti} />
      <EasterEggModal
        open={showEasterEgg}
        alreadyFound={easterEggAlreadyFound}
        onClose={() => setShowEasterEgg(false)}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-indigo-950 to-gray-900 border-b border-white/10 px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleTrophyClick}
              className="text-5xl select-none focus:outline-none hover:scale-110 transition-transform cursor-pointer"
              title="🏆"
              aria-label="Trophy"
            >
              🏆
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Dayflow Rewards</h1>
              <p className="text-white/50 text-sm mt-0.5">Earn points, build streaks, claim rewards</p>
            </div>
          </div>

          {/* My Points Chip */}
          <div className="flex items-center gap-3">
            <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-2xl px-5 py-3 text-center">
              <div className="text-2xl font-bold text-yellow-300">{myPoints.toLocaleString()}</div>
              <div className="text-yellow-400/70 text-xs">Your Points</div>
            </div>
            <div className="bg-orange-400/10 border border-orange-400/30 rounded-2xl px-5 py-3 text-center">
              <div className="text-2xl font-bold text-orange-300">🔥 {myStats?.streak ?? 0}</div>
              <div className="text-orange-400/70 text-xs">Day Streak</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit mb-6">
          {(['leaderboard', 'store', 'journey'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                tab === t
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              {t === 'leaderboard' && '🏆 '}
              {t === 'store' && '🛍️ '}
              {t === 'journey' && '⭐ '}
              {t === 'leaderboard' ? 'Leaderboard' : t === 'store' ? 'Store' : 'My Journey'}
            </button>
          ))}
        </div>

        {/* ── LEADERBOARD TAB ───────────────────────────────────────────────── */}
        {tab === 'leaderboard' && (
          <div>
            {lbLoading ? (
              <div className="text-white/40 text-center py-20">Loading leaderboard...</div>
            ) : (
              <>
                {/* Top 3 Podium */}
                {leaderboard.length >= 3 && (
                  <div className="flex items-end justify-center gap-4 mb-10 mt-4">
                    {/* 2nd place */}
                    <div className="flex flex-col items-center gap-2">
                      <Avatar name={leaderboard[1].name} src={leaderboard[1].profilePicUrl} size="md" />
                      <div className="text-center">
                        <div className="text-sm font-semibold text-white">{leaderboard[1].name.split(' ')[0]}</div>
                        <div className="text-yellow-300 text-sm font-bold">{leaderboard[1].total.toLocaleString()} pts</div>
                      </div>
                      <div className="bg-gray-400/20 border border-gray-400/30 rounded-t-xl w-24 h-16 flex flex-col items-center justify-center">
                        <span className="text-3xl">🥈</span>
                      </div>
                    </div>
                    {/* 1st place */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-2xl animate-bounce">👑</div>
                      <Avatar name={leaderboard[0].name} src={leaderboard[0].profilePicUrl} size="lg" />
                      <div className="text-center">
                        <div className="text-base font-bold text-white">{leaderboard[0].name.split(' ')[0]}</div>
                        <div className="text-yellow-300 font-bold">{leaderboard[0].total.toLocaleString()} pts</div>
                      </div>
                      <div className="bg-yellow-400/20 border border-yellow-400/30 rounded-t-xl w-28 h-24 flex flex-col items-center justify-center">
                        <span className="text-4xl">🥇</span>
                      </div>
                    </div>
                    {/* 3rd place */}
                    <div className="flex flex-col items-center gap-2">
                      <Avatar name={leaderboard[2].name} src={leaderboard[2].profilePicUrl} size="md" />
                      <div className="text-center">
                        <div className="text-sm font-semibold text-white">{leaderboard[2].name.split(' ')[0]}</div>
                        <div className="text-yellow-300 text-sm font-bold">{leaderboard[2].total.toLocaleString()} pts</div>
                      </div>
                      <div className="bg-amber-700/20 border border-amber-700/30 rounded-t-xl w-20 h-12 flex flex-col items-center justify-center">
                        <span className="text-2xl">🥉</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Full list */}
                <div className="flex flex-col gap-2">
                  {leaderboard.map((e) => (
                    <div
                      key={e.employeeId}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        e.rank <= 3
                          ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/5 border-yellow-500/20'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <RankBadge rank={e.rank} />
                      <Avatar name={e.name} src={e.profilePicUrl} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white truncate">{e.name}</div>
                        {e.jobTitle && (
                          <div className="text-white/40 text-xs truncate">{e.jobTitle}</div>
                        )}
                      </div>
                      {/* Badges (first 4) */}
                      <div className="hidden sm:flex gap-1">
                        {e.badges.slice(0, 4).map((b) => (
                          <span key={b.key} title={b.label} className="text-base">{b.emoji}</span>
                        ))}
                      </div>
                      {/* Streak */}
                      {e.streak > 0 && (
                        <div className="flex items-center gap-1 bg-orange-500/20 border border-orange-500/30 rounded-full px-2 py-0.5 text-xs font-medium text-orange-300">
                          <span>🔥</span>
                          <span>{e.streak}d</span>
                        </div>
                      )}
                      {/* Points */}
                      <div className="text-right">
                        <div className="font-bold text-yellow-300">{e.total.toLocaleString()}</div>
                        <div className="text-white/40 text-xs">pts</div>
                      </div>
                    </div>
                  ))}
                  {leaderboard.length === 0 && (
                    <div className="text-center py-20 text-white/30">
                      <div className="text-4xl mb-3">🏆</div>
                      No rankings yet. Check in to start earning points!
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── STORE TAB ─────────────────────────────────────────────────────── */}
        {tab === 'store' && (
          <div>
            <p className="text-white/40 text-sm mb-6">
              You have <span className="text-yellow-300 font-bold">{myPoints.toLocaleString()} pts</span> to spend. Rewards ≤ 500 pts are auto-approved.
            </p>
            {catLoading ? (
              <div className="text-white/40 text-center py-20">Loading store...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {catalogue.map((r) => {
                  const canAfford = myPoints >= r.pointCost;
                  const outOfStock = r.stockCount === 0;
                  const isAutoApproved = r.pointCost <= 500;

                  return (
                    <div
                      key={r.id}
                      className={`rounded-2xl border p-5 flex flex-col gap-3 transition-all ${
                        outOfStock
                          ? 'bg-white/3 border-white/10 opacity-50'
                          : canAfford
                          ? 'bg-gradient-to-br from-white/10 to-white/5 border-white/20 hover:border-indigo-400/40 hover:shadow-lg hover:shadow-indigo-500/10'
                          : 'bg-white/5 border-white/10 opacity-70'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-4xl">{r.emoji}</span>
                        <div className="flex flex-col items-end gap-1">
                          <span className="bg-yellow-400/20 border border-yellow-400/30 rounded-full px-2.5 py-0.5 text-yellow-300 text-xs font-bold">
                            {r.pointCost.toLocaleString()} pts
                          </span>
                          {isAutoApproved && (
                            <span className="text-green-400 text-xs">⚡ Auto-approved</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-white">{r.name}</div>
                        <div className="text-white/50 text-sm mt-1">{r.description}</div>
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-xs text-white/30">
                          {r.category} {r.stockCount > 0 ? `• ${r.stockCount} left` : r.stockCount === -1 ? '• Unlimited' : ''}
                        </span>
                        <button
                          onClick={() => redeemMut.mutate(r.id)}
                          disabled={!canAfford || outOfStock || redeemMut.isPending}
                          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                            outOfStock
                              ? 'bg-white/10 text-white/30 cursor-not-allowed'
                              : canAfford
                              ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
                              : 'bg-white/10 text-white/30 cursor-not-allowed'
                          }`}
                        >
                          {outOfStock ? 'Out of Stock' : canAfford ? 'Redeem' : 'Not Enough Pts'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── MY JOURNEY TAB ────────────────────────────────────────────────── */}
        {tab === 'journey' && (
          <div className="space-y-6 pb-10">
            {statsLoading ? (
              <div className="text-white/40 text-center py-20">Loading your stats...</div>
            ) : myStats ? (
              <>
                {/* Stats cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Points', value: myStats.total.toLocaleString(), icon: '🪙', color: 'from-yellow-500/20 to-amber-500/10 border-yellow-500/30' },
                    { label: 'Current Streak', value: `${myStats.streak}d`, icon: '🔥', color: 'from-orange-500/20 to-red-500/10 border-orange-500/30' },
                    { label: 'Best Streak', value: `${myStats.maxStreak}d`, icon: '⚡', color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30' },
                    { label: 'Badges Earned', value: myStats.badges.length, icon: '🏅', color: 'from-purple-500/20 to-pink-500/10 border-purple-500/30' },
                  ].map((s) => (
                    <div key={s.label} className={`bg-gradient-to-br ${s.color} border rounded-2xl p-4`}>
                      <div className="text-2xl mb-1">{s.icon}</div>
                      <div className="text-2xl font-bold text-white">{s.value}</div>
                      <div className="text-white/50 text-xs">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Badges */}
                <div>
                  <h2 className="text-lg font-bold text-white mb-3">🏅 Badges</h2>
                  {myStats.badges.length === 0 ? (
                    <div className="bg-white/5 rounded-xl p-6 text-center text-white/30 text-sm">
                      No badges yet. Start checking in to earn your first badge!
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {myStats.badges.map((b) => (
                        <div
                          key={b.key}
                          className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-xl p-4 flex flex-col items-center gap-2 text-center"
                        >
                          <span className="text-3xl">{b.emoji}</span>
                          <div className="font-semibold text-white text-sm">{b.label}</div>
                          <div className="text-white/40 text-xs">{b.description}</div>
                          <div className="text-white/30 text-xs">{new Date(b.earnedAt).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Transactions */}
                <div>
                  <h2 className="text-lg font-bold text-white mb-3">📊 Recent Activity</h2>
                  <div className="flex flex-col gap-2">
                    {myStats.recentTransactions.length === 0 ? (
                      <div className="bg-white/5 rounded-xl p-6 text-center text-white/30 text-sm">
                        No activity yet.
                      </div>
                    ) : (
                      myStats.recentTransactions.map((t, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                        >
                          <div>
                            <div className="text-sm font-medium text-white">
                              {REASON_LABELS[t.reason] ?? t.reason}
                            </div>
                            {t.description && (
                              <div className="text-white/40 text-xs">{t.description}</div>
                            )}
                            <div className="text-white/30 text-xs">{new Date(t.createdAt).toLocaleString()}</div>
                          </div>
                          <div className={`font-bold text-sm ${t.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {t.amount >= 0 ? '+' : ''}{t.amount} pts
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Redemption History */}
                {myStats.redemptions.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-white mb-3">🛒 Redemption History</h2>
                    <div className="flex flex-col gap-2">
                      {myStats.redemptions.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{r.reward.emoji}</span>
                            <div>
                              <div className="text-sm font-medium text-white">{r.reward.name}</div>
                              <div className="text-white/30 text-xs">{new Date(r.createdAt).toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-red-400 font-bold text-sm">-{r.pointCost} pts</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              r.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                              r.status === 'PENDING_HR' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {r.status === 'APPROVED' ? '✓ Approved' : r.status === 'PENDING_HR' ? '⏳ Pending HR' : '✗ Rejected'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
