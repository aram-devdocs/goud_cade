'use client';

import { useRef, useCallback, useEffect } from 'react';

type SoundType = 'eat' | 'gameOver' | 'move' | 'start' | 'flap' | 'score' | 'attack' | 'hit' | 'kill' | 'damage' | 'roll' | 'wave' | 'rotate' | 'lock' | 'lineClear' | 'levelUp' | 'hardDrop';

interface AudioContextRef {
  context: AudioContext | null;
  gainNode: GainNode | null;
}

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export function useArcadeAudio(enabled: boolean = true) {
  const audioRef = useRef<AudioContextRef>({ context: null, gainNode: null });

  // Initialize audio context on first user interaction
  const initAudio = useCallback(() => {
    if (audioRef.current.context) return;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const context = new AudioCtx();
    const gainNode = context.createGain();
    gainNode.gain.value = 0.3; // Master volume
    gainNode.connect(context.destination);

    audioRef.current = { context, gainNode };
  }, []);

  // Play procedurally generated sounds
  const playSound = useCallback((type: SoundType) => {
    if (!enabled) return;

    initAudio();
    const { context, gainNode } = audioRef.current;
    if (!context || !gainNode) return;

    // Resume context if suspended (browser autoplay policy)
    if (context.state === 'suspended') {
      context.resume();
    }

    const now = context.currentTime;

    switch (type) {
      case 'eat': {
        // Ascending blip sound - classic arcade food pickup
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }

      case 'gameOver': {
        // Descending death sound - dramatic game over
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.connect(gain);
        gain.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.5);

        // Second tone for depth
        const osc2 = context.createOscillator();
        const gain2 = context.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(200, now);
        osc2.frequency.exponentialRampToValueAtTime(50, now + 0.6);
        gain2.gain.setValueAtTime(0.2, now);
        gain2.gain.linearRampToValueAtTime(0, now + 0.6);
        osc2.connect(gain2);
        gain2.connect(gainNode);
        osc2.start(now);
        osc2.stop(now + 0.6);
        break;
      }

      case 'move': {
        // Very subtle tick sound for movement
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
        osc.connect(gain);
        gain.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.02);
        break;
      }

      case 'start': {
        // Ascending startup jingle - game start/restart
        const notes = [262, 330, 392, 523]; // C4, E4, G4, C5
        notes.forEach((freq, i) => {
          const osc = context.createOscillator();
          const gain = context.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          gain.gain.setValueAtTime(0.2, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.15);
          osc.connect(gain);
          gain.connect(gainNode);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.15);
        });
        break;
      }

      case 'flap': {
        // Quick ascending whoosh - bird wing flap
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }

      case 'score': {
        // Pleasant ding - passing through pipe
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5 note
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.15);

        // Add slight harmonic
        const osc2 = context.createOscillator();
        const gain2 = context.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1320, now); // E6 (fifth above)
        gain2.gain.setValueAtTime(0.1, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc2.connect(gain2);
        gain2.connect(gainNode);
        osc2.start(now);
        osc2.stop(now + 0.12);
        break;
      }

      // Soul Knight sounds
      case 'attack': {
        // Sword slash sound - quick sweep
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }

      case 'hit': {
        // Impact sound - enemy hit
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }

      case 'kill': {
        // Enemy death - satisfying destruction
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.2);

        // Add crackle
        const osc2 = context.createOscillator();
        const gain2 = context.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(100, now);
        gain2.gain.setValueAtTime(0.1, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc2.connect(gain2);
        gain2.connect(gainNode);
        osc2.start(now);
        osc2.stop(now + 0.15);
        break;
      }

      case 'damage': {
        // Player hurt - harsh warning
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.setValueAtTime(150, now + 0.05);
        osc.frequency.setValueAtTime(200, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }

      case 'roll': {
        // Dodge roll - whoosh
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }

      case 'wave': {
        // New wave - triumphant fanfare
        const notes = [392, 523, 659]; // G4, C5, E5
        notes.forEach((freq, i) => {
          const osc = context.createOscillator();
          const gain = context.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + i * 0.12);
          gain.gain.setValueAtTime(0.2, now + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.2);
          osc.connect(gain);
          gain.connect(gainNode);
          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 0.2);
        });
        break;
      }

      // Tetromino sounds
      case 'rotate': {
        // Quick ascending whoosh - piece rotation
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }

      case 'lock': {
        // Solid thud - piece locking in place
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }

      case 'lineClear': {
        // Satisfying sweep - line cleared
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.2);

        // Add sparkle
        const osc2 = context.createOscillator();
        const gain2 = context.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1000, now + 0.1);
        osc2.frequency.exponentialRampToValueAtTime(1500, now + 0.2);
        gain2.gain.setValueAtTime(0.1, now + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc2.connect(gain2);
        gain2.connect(gainNode);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.2);
        break;
      }

      case 'levelUp': {
        // Triumphant fanfare - level up
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
          const osc = context.createOscillator();
          const gain = context.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.2, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.15);
          osc.connect(gain);
          gain.connect(gainNode);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.15);
        });
        break;
      }

      case 'hardDrop': {
        // Impact thud - hard drop
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(gainNode);
        osc.start(now);
        osc.stop(now + 0.15);

        // Add higher impact
        const osc2 = context.createOscillator();
        const gain2 = context.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(300, now);
        osc2.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain2.gain.setValueAtTime(0.15, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc2.connect(gain2);
        gain2.connect(gainNode);
        osc2.start(now);
        osc2.stop(now + 0.1);
        break;
      }
    }
  }, [enabled, initAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current.context) {
        audioRef.current.context.close();
      }
    };
  }, []);

  return { playSound, initAudio };
}
