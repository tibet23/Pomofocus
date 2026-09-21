'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  HelpCircle,
  Info,
  X
} from 'lucide-react';

const STORAGE_KEY = 'pomofocus_session_v2';
const FOCUS_SECONDS = 25 * 60;       // 25 minutes
const SHORT_BREAK_SECONDS = 5 * 60;  // 5 minutes

interface Block {
  type: 'focus' | 'short_break' | 'long_break';
  duration: number; // in seconds
  label: string;
  cycleNum: number;
  totalCycles: number;
}

function generateSequence(hours: number, breakMins: number): Block[] {
  const blocks: Block[] = [];
  const longBreakSec = breakMins * 60;

  if (hours === 1) {
    // 1h = 25 + 5 + 25 + 5 THE END
    for (let i = 0; i < 2; i++) {
      blocks.push({ type: 'focus', duration: FOCUS_SECONDS, label: 'Focus Block', cycleNum: i + 1, totalCycles: 2 });
      blocks.push({ type: 'short_break', duration: SHORT_BREAK_SECONDS, label: 'Short Break', cycleNum: i + 1, totalCycles: 2 });
    }
  } else if (hours === 2) {
    // 2h = 25 + 5 + 25 + 5 + 25 + 5 + 25 + 5 - THE END
    for (let i = 0; i < 4; i++) {
      blocks.push({ type: 'focus', duration: FOCUS_SECONDS, label: 'Focus Block', cycleNum: i + 1, totalCycles: 4 });
      blocks.push({ type: 'short_break', duration: SHORT_BREAK_SECONDS, label: 'Short Break', cycleNum: i + 1, totalCycles: 4 });
    }
  } else if (hours === 3) {
    // 3h = 25 + 5 + 25 + 5 + 25 + 5 + 25 + (LONG BREAK: 15,20,25,30) + 25 + 5 + 25 + 5 THE END
    for (let i = 0; i < 3; i++) {
      blocks.push({ type: 'focus', duration: FOCUS_SECONDS, label: 'Focus Block', cycleNum: i + 1, totalCycles: 6 });
      blocks.push({ type: 'short_break', duration: SHORT_BREAK_SECONDS, label: 'Short Break', cycleNum: i + 1, totalCycles: 6 });
    }
    // 4th cycle: 25m focus followed by Long Break instead of short break
    blocks.push({ type: 'focus', duration: FOCUS_SECONDS, label: 'Focus Block', cycleNum: 4, totalCycles: 6 });
    blocks.push({ type: 'long_break', duration: longBreakSec, label: 'Long Break', cycleNum: 4, totalCycles: 6 });
    // 5th and 6th cycles
    for (let i = 4; i < 6; i++) {
      blocks.push({ type: 'focus', duration: FOCUS_SECONDS, label: 'Focus Block', cycleNum: i + 1, totalCycles: 6 });
      blocks.push({ type: 'short_break', duration: SHORT_BREAK_SECONDS, label: 'Short Break', cycleNum: i + 1, totalCycles: 6 });
    }
  } else {
    // 4h = 25 + 5 + 25 + 5 + 25 + 5 + 25 + (LONG BREAK: 15,20,25,30) + 25 + 5 + 25 + 5 + 25 + 5 + 25 + 5
    for (let i = 0; i < 3; i++) {
      blocks.push({ type: 'focus', duration: FOCUS_SECONDS, label: 'Focus Block', cycleNum: i + 1, totalCycles: 8 });
      blocks.push({ type: 'short_break', duration: SHORT_BREAK_SECONDS, label: 'Short Break', cycleNum: i + 1, totalCycles: 8 });
    }
    // 4th cycle: 25m focus followed by Long Break instead of short break
    blocks.push({ type: 'focus', duration: FOCUS_SECONDS, label: 'Focus Block', cycleNum: 4, totalCycles: 8 });
    blocks.push({ type: 'long_break', duration: longBreakSec, label: 'Long Break', cycleNum: 4, totalCycles: 8 });
    // 5th to 8th cycles
    for (let i = 4; i < 8; i++) {
      blocks.push({ type: 'focus', duration: FOCUS_SECONDS, label: 'Focus Block', cycleNum: i + 1, totalCycles: 8 });
      blocks.push({ type: 'short_break', duration: SHORT_BREAK_SECONDS, label: 'Short Break', cycleNum: i + 1, totalCycles: 8 });
    }
  }

  return blocks;
}

export type ThemeOption = 'white-on-black' | 'black-on-white' | 'white-on-darkgray';

interface SavedState {
  goalHours: number;
  longBreakMinutes: number;
  currentBlockIndex: number;
  status: 'idle' | 'running' | 'completed';
  targetEndTime: number | null;
  remainingSeconds: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  theme: ThemeOption;
}

const DEFAULT_STATE: SavedState = {
  goalHours: 2,
  longBreakMinutes: 20,
  currentBlockIndex: 0,
  status: 'idle',
  targetEndTime: null,
  remainingSeconds: FOCUS_SECONDS,
  soundEnabled: true,
  notificationsEnabled: false,
  theme: 'white-on-black',
};

function loadInitialState(): SavedState {
  const fallback = DEFAULT_STATE;

  if (typeof window === 'undefined') return fallback;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.goalHours !== 'number') return fallback;

    const savedTheme: ThemeOption =
      parsed.theme === 'black-on-white' || parsed.theme === 'white-on-darkgray' || parsed.theme === 'white-on-black'
        ? parsed.theme
        : 'white-on-black';

    const goal = parsed.goalHours || 2;
    const lBreak = parsed.longBreakMinutes || 20;
    const seq = generateSequence(goal, lBreak);
    let blkIdx = parsed.currentBlockIndex || 0;

    if (parsed.status === 'running' && parsed.targetEndTime) {
      const now = Date.now();
      if (now < parsed.targetEndTime) {
        return {
          goalHours: goal,
          longBreakMinutes: lBreak,
          currentBlockIndex: blkIdx,
          status: 'running',
          targetEndTime: parsed.targetEndTime,
          remainingSeconds: Math.max(0, Math.ceil((parsed.targetEndTime - now) / 1000)),
          soundEnabled: parsed.soundEnabled !== false,
          notificationsEnabled: parsed.notificationsEnabled === true,
          theme: savedTheme,
        };
      } else {
        // Tab closed or asleep when block ended
        let overdueMs = now - parsed.targetEndTime;
        while (seq[blkIdx] && overdueMs >= 0) {
          blkIdx++;
          if (blkIdx >= seq.length) {
            return {
              goalHours: goal,
              longBreakMinutes: lBreak,
              currentBlockIndex: seq.length - 1,
              status: 'completed',
              targetEndTime: null,
              remainingSeconds: 0,
              soundEnabled: parsed.soundEnabled !== false,
              notificationsEnabled: parsed.notificationsEnabled === true,
              theme: savedTheme,
            };
          }
          const nextDurMs = seq[blkIdx].duration * 1000;
          if (overdueMs < nextDurMs) {
            return {
              goalHours: goal,
              longBreakMinutes: lBreak,
              currentBlockIndex: blkIdx,
              status: 'running',
              targetEndTime: now + (nextDurMs - overdueMs),
              remainingSeconds: Math.max(0, Math.ceil((nextDurMs - overdueMs) / 1000)),
              soundEnabled: parsed.soundEnabled !== false,
              notificationsEnabled: parsed.notificationsEnabled === true,
              theme: savedTheme,
            };
          }
          overdueMs -= nextDurMs;
        }
      }
    }

    return {
      goalHours: goal,
      longBreakMinutes: lBreak,
      currentBlockIndex: blkIdx,
      status: parsed.status === 'completed' ? 'completed' : 'idle',
      targetEndTime: null,
      remainingSeconds: typeof parsed.remainingSeconds === 'number'
        ? parsed.remainingSeconds
        : (seq[blkIdx] ? seq[blkIdx].duration : FOCUS_SECONDS),
      soundEnabled: parsed.soundEnabled !== false,
      notificationsEnabled: parsed.notificationsEnabled === true,
      theme: savedTheme,
    };
  } catch (e) {
    console.warn('Could not parse saved storage:', e);
    return fallback;
  }
}

export default function PomofocusApp() {
  // Config & Timer State initialized deterministically to match SSR
  const [goalHours, setGoalHours] = useState<number>(DEFAULT_STATE.goalHours);
  const [longBreakMinutes, setLongBreakMinutes] = useState<number>(DEFAULT_STATE.longBreakMinutes);
  const [currentBlockIndex, setCurrentBlockIndex] = useState<number>(DEFAULT_STATE.currentBlockIndex);
  const [status, setStatus] = useState<'idle' | 'running' | 'completed'>(DEFAULT_STATE.status);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(DEFAULT_STATE.remainingSeconds);
  const [targetEndTime, setTargetEndTime] = useState<number | null>(DEFAULT_STATE.targetEndTime);

  // UI preferences
  const [soundEnabled, setSoundEnabled] = useState<boolean>(DEFAULT_STATE.soundEnabled);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(DEFAULT_STATE.notificationsEnabled);
  const [theme, setTheme] = useState<ThemeOption>(DEFAULT_STATE.theme);

  // Overlays
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const hasHydratedRef = useRef<boolean>(false);

  const sequence = React.useMemo(() => {
    return generateSequence(goalHours, longBreakMinutes);
  }, [goalHours, longBreakMinutes]);

  const currentBlock: Block = sequence[currentBlockIndex] || sequence[0] || {
    type: 'focus',
    duration: FOCUS_SECONDS,
    label: 'Focus Block',
    cycleNum: 1,
    totalCycles: 4
  };

  // -----------------------------------------------------------------
  // Audio Synthesis via Web Audio API
  // -----------------------------------------------------------------
  const playChime = useCallback((kind: 'focus' | 'break') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const freqs = kind === 'break'
        ? [329.63, 415.30, 493.88, 659.25] // Warm calming major triad
        : [523.25, 659.25, 783.99, 1046.50]; // Bright awakening chord

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        const startTime = now + idx * 0.08;
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.14, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 1.5);
      });
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }, [soundEnabled]);

  // -----------------------------------------------------------------
  // Desktop Notifications
  // -----------------------------------------------------------------
  const requestNotificationPermission = () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    Notification.requestPermission().then((permission) => {
      setNotificationsEnabled(permission === 'granted');
    });
  };

  const sendNotification = useCallback((title: string, bodyText: string) => {
    if (!notificationsEnabled || typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: bodyText,
          icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2244%22 fill=%22%23202428%22 stroke=%22%238fa0b5%22 stroke-width=%228%22/></svg>'
        });
      } catch (e) {
        console.warn('Notification error:', e);
      }
    }
  }, [notificationsEnabled]);

  // -----------------------------------------------------------------
  // Client-side LocalStorage Hydration (Prevents SSR Mismatch)
  // -----------------------------------------------------------------
  useEffect(() => {
    hasHydratedRef.current = true;
    const frame = requestAnimationFrame(() => {
      const saved = loadInitialState();
      if (saved) {
        setGoalHours(saved.goalHours);
        setLongBreakMinutes(saved.longBreakMinutes);
        setCurrentBlockIndex(saved.currentBlockIndex);
        setStatus(saved.status);
        setRemainingSeconds(saved.remainingSeconds);
        setTargetEndTime(saved.targetEndTime);
        setSoundEnabled(saved.soundEnabled);
        setNotificationsEnabled(saved.notificationsEnabled);
        setTheme(saved.theme);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // -----------------------------------------------------------------
  // Ensure any previous PWA Service Worker is cleanly unregistered
  // -----------------------------------------------------------------
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      if ('caches' in window) {
        caches.keys().then((keys) => {
          for (const key of keys) {
            caches.delete(key);
          }
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    try {
      const payload = {
        goalHours,
        longBreakMinutes,
        currentBlockIndex,
        status,
        targetEndTime,
        remainingSeconds,
        soundEnabled,
        notificationsEnabled,
        theme,
        savedAt: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }, [goalHours, longBreakMinutes, currentBlockIndex, status, targetEndTime, remainingSeconds, soundEnabled, notificationsEnabled, theme]);

  // -----------------------------------------------------------------
  // Background Drift-Protected Interval Tick Engine
  // -----------------------------------------------------------------
  const handleBlockComplete = useCallback(() => {
    setCurrentBlockIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex >= sequence.length) {
        setStatus('completed');
        setTargetEndTime(null);
        setRemainingSeconds(0);
        playChime('break');
        sendNotification('Session Goal Reached!', `Great work! Your ${goalHours}-hour session is complete.`);
        return prevIndex;
      }

      const nextBlock = sequence[nextIndex];
      setRemainingSeconds(nextBlock.duration);
      const nextTarget = Date.now() + nextBlock.duration * 1000;
      setTargetEndTime(nextTarget);

      if (nextBlock.type === 'focus') {
        playChime('focus');
        sendNotification('Focus Started', '25-minute focus session active. Deep work begins.');
      } else if (nextBlock.type === 'long_break') {
        playChime('break');
        sendNotification('2 Hours Complete!', `Time for your ${longBreakMinutes}-minute Long Break.`);
      } else {
        playChime('break');
        sendNotification('Break Time', '5-minute short break. Rest your eyes and hydrate.');
      }

      return nextIndex;
    });
  }, [sequence, goalHours, longBreakMinutes, playChime, sendNotification]);

  useEffect(() => {
    if (status !== 'running' || !targetEndTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diffMs = targetEndTime - now;

      if (diffMs <= 0) {
        handleBlockComplete();
      } else {
        setRemainingSeconds(Math.ceil(diffMs / 1000));
      }
    }, 250);

    return () => clearInterval(interval);
  }, [status, targetEndTime, handleBlockComplete]);

  // Visibility change listener to catch up immediately on tab switch
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && status === 'running' && targetEndTime) {
        const diffMs = targetEndTime - Date.now();
        if (diffMs <= 0) {
          handleBlockComplete();
        } else {
          setRemainingSeconds(Math.ceil(diffMs / 1000));
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [status, targetEndTime, handleBlockComplete]);

  // -----------------------------------------------------------------
  // Dynamic Tab Title
  // -----------------------------------------------------------------
  useEffect(() => {
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;
    const timeStr = `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;

    let typeLabel = 'Focus';
    if (currentBlock.type === 'short_break') typeLabel = 'Short Break';
    if (currentBlock.type === 'long_break') typeLabel = 'Long Break';

    if (status === 'completed') {
      document.title = 'Complete | POMOFOCUS';
    } else if (status === 'running') {
      document.title = `${timeStr} - ${typeLabel} | POMOFOCUS`;
    } else {
      document.title = 'POMOFOCUS';
    }
  }, [remainingSeconds, currentBlock.type, status]);

  // -----------------------------------------------------------------
  // User Actions
  // -----------------------------------------------------------------
  const handleStart = () => {
    if (status === 'running') return; // Do not allow stopping or pausing once started

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    } catch (e) {}

    if (status === 'completed') {
      setCurrentBlockIndex(0);
      const newSeq = generateSequence(goalHours, longBreakMinutes);
      setRemainingSeconds(newSeq[0].duration);
      setTargetEndTime(Date.now() + newSeq[0].duration * 1000);
      setStatus('running');
      return;
    }

    setStatus('running');
    const target = Date.now() + remainingSeconds * 1000;
    setTargetEndTime(target);
  };

  const handleReset = () => {
    setStatus('idle');
    setCurrentBlockIndex(0);
    setTargetEndTime(null);
    setShowResetConfirm(false);
    const newSeq = generateSequence(goalHours, longBreakMinutes);
    setRemainingSeconds(newSeq[0] ? newSeq[0].duration : FOCUS_SECONDS);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (status !== 'running') {
          handleStart();
        }
      } else if (e.key === 'm' || e.key === 'M') {
        setSoundEnabled((prev) => {
          const next = !prev;
          if (next) playChime('focus');
          return next;
        });
      } else if (e.key === '?') {
        setShowShortcuts((prev) => !prev);
      } else if (e.key === 'Escape') {
        setShowShortcuts(false);
        setShowResetConfirm(false);
        setShowInfoModal(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // -----------------------------------------------------------------
  // Visual Formatting & Calculations
  // -----------------------------------------------------------------
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const timeFormatted = `${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`;

  const totalBlockDuration = currentBlock.duration || FOCUS_SECONDS;
  const elapsedBlockSeconds = totalBlockDuration - remainingSeconds;
  const progressRatio = Math.min(1, Math.max(0, elapsedBlockSeconds / totalBlockDuration));

  // Cumulative Session Time Elapsed
  let totalElapsed = 0;
  for (let i = 0; i < currentBlockIndex; i++) {
    totalElapsed += sequence[i].duration;
  }
  if (sequence[currentBlockIndex]) {
    totalElapsed += (sequence[currentBlockIndex].duration - remainingSeconds);
  }
  const totalElapsedMins = Math.floor(totalElapsed / 60);
  const totalSessionSeconds = sequence.reduce((sum, b) => sum + b.duration, 0) || (goalHours * 3600);

  const isLight = theme === 'black-on-white';
  const isDarkGray = theme === 'white-on-darkgray';

  // Dynamic root container styling based on selected color option
  const rootThemeClass = isLight
    ? 'bg-[#ffffff] text-stone-900'
    : isDarkGray
    ? 'bg-[#282c34] text-white'
    : 'bg-[#0a0b0d] text-white';

  const settingsCardClass = isLight
    ? 'border-stone-200 bg-stone-100/80 text-stone-600 shadow-xs'
    : isDarkGray
    ? 'border-white/10 bg-black/25 text-stone-300'
    : 'border-white/5 bg-black/40 text-stone-400';

  const settingsLabelClass = isLight
    ? 'text-stone-700 font-medium'
    : isDarkGray
    ? 'text-stone-200 font-medium'
    : 'text-stone-300 font-medium';

  const pillGroupClass = isLight
    ? 'border-stone-300 bg-stone-200/50'
    : isDarkGray
    ? 'border-white/15 bg-black/35'
    : 'border-white/10 bg-black/50';

  const pillBtnActive = isLight
    ? 'bg-stone-900 text-white font-semibold shadow-xs'
    : 'bg-white/20 text-white font-semibold';

  const pillBtnInactive = isLight
    ? 'text-stone-600 hover:text-stone-950'
    : isDarkGray
    ? 'text-stone-300 hover:text-white'
    : 'text-stone-400 hover:text-white';

  const metaTextClass = isLight
    ? 'text-stone-500'
    : isDarkGray
    ? 'text-stone-300'
    : 'text-stone-400';

  const isSessionActive = status === 'running' || currentBlockIndex > 0;

  return (
    <div
      id="pomofocusRoot"
      className={`min-h-screen flex flex-col justify-between transition-colors duration-500 ease-in-out select-none ${rootThemeClass}`}
    >
      {/* Top Header */}
      <header id="appHeader" className="w-full max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div id="brandContainer" className="flex items-center gap-2.5">
          <div className="relative w-6 h-6 shrink-0 flex items-center justify-center">
            <Image
              id="brandLogo"
              src="/pomofocus-logo.svg"
              alt="Pomofocus Logo"
              width={24}
              height={24}
              className={`w-6 h-6 object-contain select-none transition-all duration-300 ${
                isLight ? '' : 'invert'
              }`}
              priority
              referrerPolicy="no-referrer"
            />
          </div>
          <span id="brandTitle" className={`text-sm font-semibold tracking-wider uppercase ${isLight ? 'text-stone-900' : 'text-white'}`}>
            POMOFOCUS
          </span>
        </div>

        {/* Three small squares as switch buttons on top right across from POMOFOCUS */}
        <div
          id="themeSwitchGroup"
          className="flex items-center gap-2"
          role="radiogroup"
          aria-label="Color theme options"
        >
          {/* 1. White on Black */}
          <button
            id="themeBtnWhiteOnBlack"
            type="button"
            role="radio"
            aria-checked={theme === 'white-on-black'}
            onClick={() => setTheme('white-on-black')}
            title="White on Black"
            aria-label="White on Black theme"
            className={`w-5 h-5 rounded-[2px] transition-all cursor-pointer flex items-center justify-center border ${
              theme === 'white-on-black'
                ? 'ring-2 ring-[#165b33] ring-offset-2 scale-105 border-white shadow-xs'
                : 'border-stone-500/80 hover:border-stone-300 opacity-70 hover:opacity-100'
            }`}
            style={{ backgroundColor: '#0a0b0d' }}
          >
            <span className="w-1.5 h-1.5 rounded-[1px] bg-white pointer-events-none" />
          </button>

          {/* 2. Black on White */}
          <button
            id="themeBtnBlackOnWhite"
            type="button"
            role="radio"
            aria-checked={theme === 'black-on-white'}
            onClick={() => setTheme('black-on-white')}
            title="Black on White"
            aria-label="Black on White theme"
            className={`w-5 h-5 rounded-[2px] transition-all cursor-pointer flex items-center justify-center border ${
              theme === 'black-on-white'
                ? 'ring-2 ring-[#165b33] ring-offset-2 scale-105 border-stone-900 shadow-xs'
                : 'border-stone-400 hover:border-stone-700 opacity-70 hover:opacity-100'
            }`}
            style={{ backgroundColor: '#ffffff' }}
          >
            <span className="w-1.5 h-1.5 rounded-[1px] bg-stone-900 pointer-events-none" />
          </button>

          {/* 3. White on Dark Gray */}
          <button
            id="themeBtnWhiteOnDarkGray"
            type="button"
            role="radio"
            aria-checked={theme === 'white-on-darkgray'}
            onClick={() => setTheme('white-on-darkgray')}
            title="White on Dark Gray"
            aria-label="White on Dark Gray theme"
            className={`w-5 h-5 rounded-[2px] transition-all cursor-pointer flex items-center justify-center border ${
              theme === 'white-on-darkgray'
                ? 'ring-2 ring-[#165b33] ring-offset-2 scale-105 border-white shadow-xs'
                : 'border-stone-400/80 hover:border-stone-200 opacity-70 hover:opacity-100'
            }`}
            style={{ backgroundColor: '#32363e' }}
          >
            <span className="w-1.5 h-1.5 rounded-[1px] bg-white pointer-events-none" />
          </button>
        </div>
      </header>

      {/* Main Focus Canvas */}
      <main id="mainContent" className="flex-1 flex flex-col items-center justify-center px-4 py-6 max-w-xl mx-auto w-full">
        {/* Initial Settings Config (Pill groups) */}
        <section
          id="settingsCard"
          className={`w-full mb-8 px-4 py-2.5 rounded-lg border flex items-center justify-center text-xs ${settingsCardClass}`}
        >
          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-6">
            <div className="flex items-center gap-2">
              <span className={settingsLabelClass}>Focus Time:</span>
              <div id="goalGroup" className={`inline-flex p-0.5 rounded border ${pillGroupClass}`}>
                {[1, 2, 3, 4].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    disabled={isSessionActive}
                    onClick={() => {
                      setGoalHours(hrs);
                      setCurrentBlockIndex(0);
                      const seq = generateSequence(hrs, longBreakMinutes);
                      setRemainingSeconds(seq[0].duration);
                    }}
                    className={`px-2.5 py-1 rounded text-xs transition-colors ${
                      goalHours === hrs ? pillBtnActive : pillBtnInactive
                    } ${isSessionActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {hrs}h
                  </button>
                ))}
              </div>
            </div>

            <div
              className={`flex items-center gap-2 transition-all duration-300 ${
                goalHours <= 2
                  ? 'opacity-30 pointer-events-none select-none cursor-not-allowed'
                  : 'opacity-100'
              }`}
            >
              <span className={settingsLabelClass}>Long Break:</span>
              <div
                id="longBreakGroup"
                aria-disabled={goalHours <= 2}
                className={`inline-flex p-0.5 rounded border transition-all duration-300 ${pillGroupClass}`}
              >
                {[15, 20, 25, 30].map((minsVal) => {
                  const isDisabled = isSessionActive || goalHours <= 2;
                  const isSelected = longBreakMinutes === minsVal;

                  return (
                    <button
                      key={minsVal}
                      type="button"
                      disabled={isDisabled}
                      tabIndex={goalHours <= 2 ? -1 : 0}
                      onClick={() => {
                        if (isDisabled) return;
                        setLongBreakMinutes(minsVal);
                        setCurrentBlockIndex(0);
                        const seq = generateSequence(goalHours, minsVal);
                        setRemainingSeconds(seq[0].duration);
                      }}
                      className={`px-2.5 py-1 rounded text-xs transition-colors ${
                        isSelected ? pillBtnActive : pillBtnInactive
                      } ${isDisabled ? 'cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}
                    >
                      {minsVal}m
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Clock View Stage */}
        <section id="clockStage" className="w-full flex flex-col items-center justify-center min-h-[290px] mb-6 relative">
          <div id="digitalClockContainer" className="flex flex-col items-center justify-center">
            <div className={`flex items-center gap-2 mb-2 text-xs uppercase tracking-widest font-semibold ${metaTextClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-stone-600' : 'bg-stone-400'} animate-pulse`}></span>
              <span>{currentBlock.label}</span>
            </div>
            <div
              id="digitalDigits"
              className={`font-mono text-7xl sm:text-8xl md:text-9xl font-light tracking-tighter tabular-nums leading-none mb-3 ${
                isLight ? 'text-stone-900' : 'text-white'
              }`}
            >
              {timeFormatted}
            </div>
            <div className={`text-xs font-normal tracking-wider ${metaTextClass}`}>
              {currentBlock.type === 'long_break'
                ? '2-Hour Milestone Reached'
                : `Cycle ${currentBlock.cycleNum} of ${currentBlock.totalCycles}`}
            </div>
          </div>
        </section>

        {/* Central Controls (Start only - cannot stop once running) */}
        <div id="controlsPanel" className="flex flex-col items-center justify-center mb-6">
          {/* Small Dark Rectangular Info Button placed well above Start */}
          <button
            id="infoExplanationBtn"
            type="button"
            onClick={() => setShowInfoModal(true)}
            title="Explanation: How Pomodoro works"
            className="mb-5 px-3 py-1 rounded-[3px] bg-[#1c1d22] text-stone-300 hover:text-white hover:bg-black border border-stone-700/80 flex items-center justify-center transition-all cursor-pointer shadow-xs hover:border-stone-500"
          >
            <Info size={13} />
          </button>

          <button
            id="startBtn"
            type="button"
            disabled={status === 'running'}
            onClick={handleStart}
            className={`min-w-[140px] h-11 px-7 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
              status === 'running'
                ? isLight
                  ? 'bg-stone-200 text-stone-400 border border-stone-300 cursor-not-allowed opacity-60'
                  : isDarkGray
                  ? 'bg-white/10 text-stone-400 border border-white/10 cursor-not-allowed opacity-60'
                  : 'bg-white/20 text-stone-400 border border-white/10 cursor-not-allowed opacity-60'
                : isLight
                ? 'bg-stone-900 text-white hover:bg-black active:scale-98 cursor-pointer'
                : isDarkGray
                ? 'bg-white text-stone-900 hover:bg-stone-100 active:scale-98 cursor-pointer'
                : 'bg-white text-stone-900 hover:bg-stone-100 active:scale-98 cursor-pointer'
            }`}
            title={status === 'running' ? 'Timer is active (Reset session using button at bottom right)' : 'Start Timer (Key: Space)'}
          >
            <Play size={15} />
            <span>Start</span>
          </button>
        </div>

        {/* Sequence & Session Progress Timeline */}
        <section id="timelineSection" className="w-full flex flex-col gap-2.5">
          <div
            id="timelineProgressBar"
            className={`w-full h-3 rounded-md overflow-hidden p-0.5 border flex gap-1 ${
              isLight
                ? 'bg-stone-100 border-stone-300'
                : isDarkGray
                ? 'bg-black/35 border-white/15'
                : 'bg-black/40 border-white/10'
            }`}
          >
            {sequence.map((blk, idx) => {
              const isDone = idx < currentBlockIndex || status === 'completed';
              const isActive = idx === currentBlockIndex && status !== 'completed';
              const activePercent = isDone ? 100 : isActive ? Math.round(progressRatio * 100) : 0;
              const blockPercent = totalSessionSeconds > 0 ? (blk.duration / totalSessionSeconds) * 100 : 0;

              return (
                <div
                  key={idx}
                  title={`${blk.label} (${Math.round(blk.duration / 60)}m - ${blockPercent.toFixed(1)}%)`}
                  style={{ flex: `${blk.duration} 1 0%`, minWidth: 0 }}
                  className={`h-full rounded-xs overflow-hidden relative ${
                    isLight ? 'bg-stone-200/90' : 'bg-white/10'
                  }`}
                >
                  {/* Filled dark green color block - remains identical for all options */}
                  <div
                    className={`h-full bg-[#165b33] transition-all duration-300 rounded-xs ${
                      activePercent > 0 ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{ width: `${activePercent}%` }}
                  />
                </div>
              );
            })}
          </div>

          <div className={`flex items-center justify-between text-xs px-0.5 ${metaTextClass}`}>
            <span>Elapsed: {totalElapsedMins}m of {goalHours}h goal</span>
            <span>
              Block {Math.min(currentBlockIndex + 1, sequence.length)} / {sequence.length}
            </span>
          </div>
        </section>
      </main>

      {/* Bottom Safety & Utility Footer */}
      <footer
        id="appFooter"
        className={`w-full max-w-5xl mx-auto px-6 py-4 flex items-center justify-between border-t text-xs ${
          isLight ? 'border-stone-200' : isDarkGray ? 'border-white/10' : 'border-white/5'
        }`}
      >
        <div className="flex items-center gap-2">
          {/* Audio Chime Toggle */}
          <button
            id="soundBtn"
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playChime('focus');
            }}
            title={soundEnabled ? 'Chime Active (Key: M)' : 'Chime Muted (Key: M)'}
            className={`w-8 h-8 rounded border flex items-center justify-center transition-colors cursor-pointer ${
              isLight
                ? soundEnabled
                  ? 'border-stone-400 text-stone-900 bg-stone-200'
                  : 'border-stone-300 text-stone-500 hover:text-stone-800 bg-stone-100'
                : soundEnabled
                ? 'border-white/20 text-stone-200 bg-white/5'
                : 'border-white/5 text-stone-500 hover:text-stone-300'
            }`}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          {/* Desktop Notifications Toggle */}
          <button
            id="notificationsBtn"
            type="button"
            onClick={() => {
              if (!notificationsEnabled) requestNotificationPermission();
              else setNotificationsEnabled(false);
            }}
            title={notificationsEnabled ? 'Desktop Notifications Enabled' : 'Enable Desktop Notifications'}
            className={`w-8 h-8 rounded border flex items-center justify-center transition-colors cursor-pointer ${
              isLight
                ? notificationsEnabled
                  ? 'border-stone-400 text-stone-900 bg-stone-200'
                  : 'border-stone-300 text-stone-500 hover:text-stone-800 bg-stone-100'
                : notificationsEnabled
                ? 'border-white/20 text-stone-200 bg-white/5'
                : 'border-white/5 text-stone-500 hover:text-stone-300'
            }`}
          >
            {notificationsEnabled ? <Bell size={14} /> : <BellOff size={14} />}
          </button>

          {/* Shortcuts Info */}
          <button
            id="shortcutsBtn"
            type="button"
            onClick={() => setShowShortcuts(true)}
            title="Keyboard Shortcuts (?)"
            className={`w-8 h-8 rounded border flex items-center justify-center transition-colors cursor-pointer ${
              isLight
                ? 'border-stone-300 text-stone-500 hover:text-stone-800 bg-stone-100'
                : 'border-white/5 text-stone-500 hover:text-stone-300'
            }`}
          >
            <HelpCircle size={14} />
          </button>
        </div>

        <div className={`hidden sm:block text-[11px] tracking-wider ${isLight ? 'text-stone-500' : 'text-stone-500'}`}>
          Background Tab Drift Protected &bull; www.pomofocus.live
        </div>

        <div className="flex items-center gap-3 relative">
          {/* Restart Session Button */}
          <button
            id="safeResetBtn"
            type="button"
            onClick={() => setShowResetConfirm(!showResetConfirm)}
            title="Restart Session"
            className="w-8 h-8 rounded flex items-center justify-center transition-all duration-200 cursor-pointer bg-[#c2410c] hover:bg-[#ea580c] text-white shadow-sm border border-[#9a3412] hover:scale-105 active:scale-95"
          >
            <RotateCcw size={14} />
          </button>

          {/* Safe Reset Confirmation Popover */}
          {showResetConfirm && (
            <div
              id="resetPopoverBox"
              className={`absolute bottom-10 right-0 w-52 p-3 rounded-lg border shadow-xl z-50 text-left flex flex-col gap-2 ${
                isLight
                  ? 'border-stone-300 bg-white text-stone-800'
                  : isDarkGray
                  ? 'border-white/15 bg-[#32363e] text-stone-100'
                  : 'border-white/10 bg-[#181a1f] text-stone-200'
              }`}
            >
              <p className="text-xs font-normal leading-relaxed">
                Reset entire session and clear active timer?
              </p>
              <div className="flex justify-end gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className={`px-2.5 py-1 text-[11px] rounded border cursor-pointer ${
                    isLight
                      ? 'border-stone-300 text-stone-600 hover:text-stone-900'
                      : 'border-white/10 text-stone-400 hover:text-white'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2.5 py-1 text-[11px] rounded bg-[#c2410c] border border-[#9a3412] text-white hover:bg-[#ea580c] transition-colors cursor-pointer font-medium"
                >
                  Restart
                </button>
              </div>
            </div>
          )}
        </div>
      </footer>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div
          id="shortcutsModalRoot"
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className={`w-full max-w-sm rounded-xl border p-5 shadow-2xl flex flex-col gap-4 ${
              isLight
                ? 'border-stone-300 bg-white text-stone-800'
                : isDarkGray
                ? 'border-white/15 bg-[#32363e] text-stone-100'
                : 'border-white/10 bg-[#181a1f] text-stone-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-stone-200' : 'border-white/10'}`}>
              <span className="text-sm font-semibold tracking-wide">Keyboard Shortcuts</span>
              <button
                type="button"
                onClick={() => setShowShortcuts(false)}
                className={`cursor-pointer ${isLight ? 'text-stone-500 hover:text-stone-900' : 'text-stone-400 hover:text-white'}`}
              >
                <X size={16} />
              </button>
            </div>

            <div className={`flex flex-col gap-2.5 text-xs ${isLight ? 'text-stone-700' : 'text-stone-300'}`}>
              <div className="flex justify-between items-center">
                <span>Start Timer</span>
                <kbd className={`px-2 py-0.5 rounded font-mono text-[11px] border ${
                  isLight ? 'bg-stone-100 border-stone-300 text-stone-800' : 'bg-black/40 border-white/15 text-stone-200'
                }`}>Space</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Toggle Audio Chime</span>
                <kbd className={`px-2 py-0.5 rounded font-mono text-[11px] border ${
                  isLight ? 'bg-stone-100 border-stone-300 text-stone-800' : 'bg-black/40 border-white/15 text-stone-200'
                }`}>M</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Explanation Popup Modal */}
      {showInfoModal && (
        <div
          id="infoModalRoot"
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setShowInfoModal(false)}
        >
          <div
            className={`w-full max-w-md rounded-xl border p-5 sm:p-6 shadow-2xl flex flex-col gap-4 ${
              isLight
                ? 'border-stone-300 bg-white text-stone-800'
                : isDarkGray
                ? 'border-white/15 bg-[#32363e] text-stone-100'
                : 'border-white/10 bg-[#181a1f] text-stone-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-stone-200' : 'border-white/10'}`}>
              <span className="text-sm font-semibold tracking-wide">Explanation</span>
              <button
                id="closeInfoModalBtn"
                type="button"
                onClick={() => setShowInfoModal(false)}
                className={`cursor-pointer ${isLight ? 'text-stone-500 hover:text-stone-900' : 'text-stone-400 hover:text-white'}`}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <ul className={`flex flex-col gap-3 text-xs sm:text-sm leading-relaxed ${isLight ? 'text-stone-700' : 'text-stone-300'}`}>
              <li className="flex items-start gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0 mt-0.5 ${
                  isLight ? 'bg-stone-100 text-stone-700 border border-stone-300' : 'bg-white/10 text-stone-200 border border-white/10'
                }`}>
                  1
                </span>
                <span>Pick a task you want to complete.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0 mt-0.5 ${
                  isLight ? 'bg-stone-100 text-stone-700 border border-stone-300' : 'bg-white/10 text-stone-200 border border-white/10'
                }`}>
                  2
                </span>
                <span>Set a timer for 25 minutes.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0 mt-0.5 ${
                  isLight ? 'bg-stone-100 text-stone-700 border border-stone-300' : 'bg-white/10 text-stone-200 border border-white/10'
                }`}>
                  3
                </span>
                <span>Work with no distractions until the timer rings.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0 mt-0.5 ${
                  isLight ? 'bg-stone-100 text-stone-700 border border-stone-300' : 'bg-white/10 text-stone-200 border border-white/10'
                }`}>
                  4
                </span>
                <span>Take a short break of 5 minutes.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0 mt-0.5 ${
                  isLight ? 'bg-stone-100 text-stone-700 border border-stone-300' : 'bg-white/10 text-stone-200 border border-white/10'
                }`}>
                  5
                </span>
                <span>Take a long break of 15, 20, 25 or 30 minutes after four work intervals.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

    </div>
  );
}
