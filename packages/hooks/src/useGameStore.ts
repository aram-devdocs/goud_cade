import { create } from 'zustand';

export type GameMode = 'walking' | 'transitioning' | 'playing';

export interface PlayerPosition {
  x: number;
  y: number;
  z: number;
}

export interface CabinetInfo {
  id: string;
  position: PlayerPosition;
  screenPosition: PlayerPosition;
  game: string;
}

interface GameState {
  // Player state
  playerPosition: PlayerPosition;
  playerRotation: number;
  
  // Game mode
  mode: GameMode;
  
  // Interaction
  nearCabinet: CabinetInfo | null;
  activeCabinet: CabinetInfo | null;
  
  // Actions
  setPlayerPosition: (position: PlayerPosition) => void;
  setPlayerRotation: (rotation: number) => void;
  setMode: (mode: GameMode) => void;
  setNearCabinet: (cabinet: CabinetInfo | null) => void;
  startPlaying: (cabinet: CabinetInfo) => void;
  stopPlaying: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  // Initial state
  playerPosition: { x: 0, y: 0, z: 5 },
  playerRotation: 0,
  mode: 'walking',
  nearCabinet: null,
  activeCabinet: null,
  
  // Actions
  setPlayerPosition: (position) => set({ playerPosition: position }),
  setPlayerRotation: (rotation) => set({ playerRotation: rotation }),
  setMode: (mode) => set({ mode }),
  setNearCabinet: (cabinet) => set({ nearCabinet: cabinet }),
  
  startPlaying: (cabinet) => set({ 
    mode: 'transitioning',
    activeCabinet: cabinet,
    nearCabinet: null
  }),
  
  stopPlaying: () => set({ 
    mode: 'walking',
    activeCabinet: null 
  }),
}));

