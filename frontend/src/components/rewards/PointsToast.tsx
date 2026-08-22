import { useEffect, useState } from 'react';
import { playPointsSound, playStreakSound } from '../../lib/sounds';
import { Flame } from 'lucide-react';

interface PointsToastItem {
  id: string;
  amount: number;
  reason: string;
}

interface StreakToastItem {
  id: string;
  streak: number;
  milestone: number;
}

export function PointsToast({ socket }: { socket: any }) {
  const [toasts, setToasts] = useState<PointsToastItem[]>([]);
  const [streakToasts, setStreakToasts] = useState<StreakToastItem[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handlePoints = (data: { amount: number; reason: string }) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, amount: data.amount, reason: data.reason }]);
      playPointsSound();
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 2500);
    };

    const handleStreak = (data: { streak: number; milestone: number }) => {
      const id = `${Date.now()}-${Math.random()}`;
      setStreakToasts((prev) => [...prev, { id, streak: data.streak, milestone: data.milestone }]);
      playStreakSound();
      setTimeout(() => {
        setStreakToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    socket.on('gamification:points', handlePoints);
    socket.on('gamification:streak', handleStreak);

    return () => {
      socket.off('gamification:points', handlePoints);
      socket.off('gamification:streak', handleStreak);
    };
  }, [socket]);

  return (
    <>
      {/* Points toasts — bottom right */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-points-toast flex items-center space-x-2.5 bg-white border border-blue-grey/30 shadow-modal text-text-primary px-4 py-2.5 rounded-2xl"
          >
            <div className="w-7 h-7 rounded-xl bg-sage-light/40 border border-sage-deep/30 flex items-center justify-center text-sm">
              🪙
            </div>
            <div>
              <div className="font-heading font-bold text-slate-brand text-sm">
                +{t.amount} Points
              </div>
              <div className="text-[11px] text-text-muted">
                {t.reason === 'EARLY_CHECKIN' ? '🌅 Early Bird Bonus!' : 'Awarded to balance'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Streak milestone toasts — bottom right */}
      <div className="fixed bottom-24 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
        {streakToasts.map((t) => (
          <div
            key={t.id}
            className="animate-points-toast flex items-center space-x-3 bg-white border-2 border-orange-300 shadow-modal text-text-primary px-5 py-3 rounded-2xl"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
            </div>
            <div>
              <div className="font-heading font-bold text-text-primary text-base">
                🔥 {t.milestone}-Day Streak Milestone!
              </div>
              <div className="text-xs text-text-muted">
                +{t.milestone === 7 ? 50 : t.milestone === 30 ? 200 : 500} bonus points awarded!
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pointsToastAnim {
          0% { opacity: 0; transform: translateY(20px) scale(0.85); }
          15% { opacity: 1; transform: translateY(0) scale(1.03); }
          25% { transform: translateY(0) scale(1); }
          75% { opacity: 1; transform: translateY(-4px); }
          100% { opacity: 0; transform: translateY(-20px) scale(0.9); }
        }
        .animate-points-toast {
          animation: pointsToastAnim 2.5s ease-in-out forwards;
        }
      `}</style>
    </>
  );
}
