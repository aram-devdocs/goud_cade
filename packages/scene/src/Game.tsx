'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import { useGameStore, type CabinetInfo } from '@repo/hooks';
import { Room } from './Room';
import { Player } from './Player';
import { CameraController } from './CameraController';
import { ArcadeCabinet } from './ArcadeCabinet';

// Keyboard control mappings
const keyboardMap = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { name: 'backward', keys: ['KeyS', 'ArrowDown'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight'] },
  { name: 'interact', keys: ['KeyE'] },
];

// Define arcade cabinets
const CABINETS: CabinetInfo[] = [
  {
    id: 'snake-1',
    position: { x: 0, y: 0, z: -5 },
    screenPosition: { x: 0, y: 1.5, z: -4.57 },
    game: 'snake',
  },
];

interface GameProps {
  gameCanvases?: Record<string, HTMLCanvasElement | null>;
}

export function Game({ gameCanvases = {} }: GameProps) {
  const mode = useGameStore((state) => state.mode);
  const activeCabinet = useGameStore((state) => state.activeCabinet);
  const stopPlaying = useGameStore((state) => state.stopPlaying);

  // Handle ESC to exit game
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mode === 'playing') {
        stopPlaying();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, stopPlaying]);

  return (
    <KeyboardControls map={keyboardMap}>
      <Canvas
        shadows
        camera={{ 
          position: [0, 5, 10], 
          fov: 60,
          near: 0.1,
          far: 100
        }}
        style={{ 
          width: '100%', 
          height: '100%',
          background: '#000000'
        }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.15} />
          <directionalLight
            position={[5, 10, 5]}
            intensity={0.3}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          
          {/* Colored point lights for atmosphere */}
          <pointLight position={[-5, 3, -5]} color="#ff00ff" intensity={0.5} distance={15} />
          <pointLight position={[5, 3, -5]} color="#00ffff" intensity={0.5} distance={15} />
          <pointLight position={[0, 3, 5]} color="#00ff88" intensity={0.3} distance={15} />
          
          {/* Scene components */}
          <Room />
          <Player cabinets={CABINETS} />
          <CameraController />
          
          {/* Arcade cabinets */}
          {CABINETS.map((cabinet) => (
            <ArcadeCabinet
              key={cabinet.id}
              cabinet={cabinet}
              gameCanvas={gameCanvases[cabinet.id] ?? null}
              isActive={activeCabinet?.id === cabinet.id}
            />
          ))}
          
          {/* Fog for atmosphere */}
          <fog attach="fog" args={['#000011', 5, 25]} />
        </Suspense>
      </Canvas>
    </KeyboardControls>
  );
}

// Export cabinets config for use by parent components
export { CABINETS };

