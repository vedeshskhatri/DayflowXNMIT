import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';

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
      className="flex items-center space-x-2 bg-cream-light hover:bg-cream border border-navy/15 hover:border-copper/40 rounded-full px-3 py-1 text-xs font-bold text-navy-dark transition-all group shadow-sm cursor-pointer whitespace-nowrap"
      title="View your Rewards, Streak & Company Leaderboard"
    >
      <div className="flex items-center space-x-1">
        <Flame className={`w-3.5 h-3.5 ${streak > 0 ? 'text-copper fill-copper animate-pulse' : 'text-text-muted'}`} />
        <span className="font-mono text-navy-dark font-bold">
          {streak > 0 ? `${streak}d` : '0d'}
        </span>
      </div>

      <span className="text-navy/20 font-normal">|</span>

      <div className="flex items-center space-x-1 text-copper font-mono font-bold">
        <span>🪙</span>
        <span>{total.toLocaleString()}</span>
      </div>
    </Link>
  );
}
