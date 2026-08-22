import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Link } from 'react-router-dom';

export function StreakWidget() {
  const { data } = useQuery({
    queryKey: ['rewards', 'me-streak'],
    queryFn: async () => {
      const res = await api.get('/rewards/me');
      return res.data as { streak: number; total: number };
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const streak = data?.streak ?? 0;
  const total = data?.total ?? 0;

  return (
    <Link
      to="/rewards"
      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors rounded-full px-3 py-1.5 text-sm font-medium text-white border border-white/20"
      title="View your rewards & leaderboard"
    >
      <span className={`text-base transition-transform ${streak > 0 ? 'animate-flame' : ''}`}>
        {streak > 0 ? '🔥' : '💤'}
      </span>
      <span className="tabular-nums">
        {streak > 0 ? `${streak}d` : '—'}
      </span>
      <span className="hidden sm:inline text-white/60">•</span>
      <span className="hidden sm:flex items-center gap-1 text-yellow-300">
        <span>🪙</span>
        <span className="tabular-nums">{total.toLocaleString()}</span>
      </span>

      <style>{`
        @keyframes flameAnim {
          0%, 100% { transform: scale(1) rotate(-3deg); }
          50% { transform: scale(1.15) rotate(3deg); }
        }
        .animate-flame {
          animation: flameAnim 1.8s ease-in-out infinite;
        }
      `}</style>
    </Link>
  );
}
