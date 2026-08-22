/**
 * Dayflow Gamification Sound Engine
 * Uses Web Audio API — zero dependencies, zero file loading.
 * All sounds are synthesized programmatically.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  // Resume if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

function playNote(
  frequency: number,
  startTime: number,
  duration: number,
  volume = 0.3,
  type: OscillatorType = 'sine'
) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

// ─── Points coin sound ────────────────────────────────────────────────────────
// Classic ascending coin chime: C5 → E5 → G5

export function playPointsSound() {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    playNote(523.25, t, 0.12, 0.25, 'triangle');       // C5
    playNote(659.25, t + 0.08, 0.12, 0.25, 'triangle'); // E5
    playNote(783.99, t + 0.16, 0.18, 0.3, 'triangle');  // G5
  } catch (e) {
    console.debug('[sounds] playPointsSound failed:', e);
  }
}

// ─── Streak milestone sound ───────────────────────────────────────────────────
// Warm ascending arpeggio with a sparkle

export function playStreakSound() {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25]; // C4 E4 G4 C5 E5
    notes.forEach((freq, i) => {
      playNote(freq, t + i * 0.07, 0.2, 0.25, 'triangle');
    });
    // High sparkle
    playNote(1046.5, t + 0.42, 0.3, 0.15, 'sine'); // C6
  } catch (e) {
    console.debug('[sounds] playStreakSound failed:', e);
  }
}

// ─── Redemption fanfare ───────────────────────────────────────────────────────
// Triumphant major chord

export function playRedeemSound() {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    // G major chord: G4 B4 D5
    playNote(392.0,  t, 0.5, 0.2, 'triangle');   // G4
    playNote(493.88, t + 0.05, 0.5, 0.2, 'triangle'); // B4
    playNote(587.33, t + 0.1, 0.5, 0.2, 'triangle');  // D5
    // Resolution: G5
    playNote(783.99, t + 0.35, 0.4, 0.25, 'sine');
  } catch (e) {
    console.debug('[sounds] playRedeemSound failed:', e);
  }
}

// ─── Easter Egg: 8-bit secret melody ─────────────────────────────────────────
// Classic 5-note fanfare in 8-bit square wave

export function playEasterEggSound() {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    // Super-style melody: E5 E5 - E5 - C5 E5 - G5
    const melody = [
      { f: 659.25, dt: 0,    dur: 0.1 },
      { f: 659.25, dt: 0.15, dur: 0.1 },
      { f: 659.25, dt: 0.35, dur: 0.1 },
      { f: 523.25, dt: 0.5,  dur: 0.1 },
      { f: 659.25, dt: 0.65, dur: 0.15 },
      { f: 783.99, dt: 0.85, dur: 0.3 },
      { f: 392.0,  dt: 1.2,  dur: 0.3 },
    ];
    melody.forEach(({ f, dt, dur }) => {
      playNote(f, t + dt, dur, 0.28, 'square');
    });
  } catch (e) {
    console.debug('[sounds] playEasterEggSound failed:', e);
  }
}

// ─── Thermal Receipt Print Sound ─────────────────────────────────────────────
// Realistic mechanical dot-matrix / thermal printer whir + chimes

export function playReceiptPrintSound() {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;

    // Fast mechanical buzz clicks
    for (let i = 0; i < 8; i++) {
      playNote(800 + (i % 2 === 0 ? 120 : -80), t + i * 0.06, 0.03, 0.12, 'sawtooth');
    }

    // Success chime at the end of paper feed
    setTimeout(() => {
      playRedeemSound();
    }, 450);
  } catch (e) {
    console.debug('[sounds] playReceiptPrintSound failed:', e);
  }
}

// ─── Error / Not enough points sound ─────────────────────────────────────────

export function playErrorSound() {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    playNote(220, t, 0.15, 0.2, 'sawtooth');
    playNote(196, t + 0.1, 0.25, 0.2, 'sawtooth');
  } catch (e) {
    console.debug('[sounds] playErrorSound failed:', e);
  }
}

