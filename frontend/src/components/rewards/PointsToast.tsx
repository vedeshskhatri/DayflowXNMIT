import { useEffect, useState } from 'react';
import { playPointsSound, playStreakSound } from '../../lib/sounds';

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
            className="animate-points-toast flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-400 text-black font-bold text-sm px-4 py-2 rounded-full shadow-lg"
          >
            <span className="text-base">🪙</span>
            <span>+{t.amount} pts</span>
            {t.reason === 'EARLY_CHECKIN' && <span className="text-xs opacity-80">Early Bird!</span>}
          </div>
        ))}
      </div>

      {/* Streak milestone toasts — bottom right, above points toasts */}
      <div className="fixed bottom-20 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
        {streakToasts.map((t) => (
          <div
            key={t.id}
            className="animate-points-toast flex items-center gap-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold px-5 py-3 rounded-2xl shadow-2xl"
          >
            <span className="text-2xl">🔥</span>
            <div>
              <div className="text-base">{t.milestone}-Day Streak!</div>
              <div className="text-xs opacity-80">+{t.milestone === 7 ? 50 : t.milestone === 30 ? 200 : 500} pts bonus awarded</div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pointsToastAnim {
          0% { opacity: 0; transform: translateY(20px) scale(0.8); }
          15% { opacity: 1; transform: translateY(0) scale(1.05); }
          25% { transform: translateY(0) scale(1); }
          75% { opacity: 1; transform: translateY(-8px); }
          100% { opacity: 0; transform: translateY(-20px) scale(0.9); }
        }
        .animate-points-toast {
          animation: pointsToastAnim 2.5s ease-in-out forwards;
        }
      `}</style>
    </>
  );
}
