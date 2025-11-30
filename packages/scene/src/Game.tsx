'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGameStore, type CabinetInfo } from '@repo/hooks';
import { useInput, useInputStore } from '@repo/input';
import { useViewport, type ViewportInfo } from '@repo/ui';
import { Room } from './Room';
import { Player } from './Player';
import { CameraController } from './CameraController';
import { ArcadeCabinet } from './ArcadeCabinet';

// Get responsive initial camera config
function getInitialCameraConfig(viewport: ViewportInfo) {
  const { deviceType, orientation } = viewport;

  // Default for desktop/landscape
  let position: [number, number, number] = [0, 5, 10];
  let fov = 60;

  if (orientation === 'portrait') {
    if (deviceType === 'mobile') {
      position = [1.5, 6, 14];
      fov = 70;
    } else if (deviceType === 'tablet') {
      position = [1.5, 5.5, 12];
      fov = 65;
    }
  } else if (deviceType === 'mobile') {
    position = [1.5, 4.5, 11];
    fov = 65;
  }

  return { position, fov };
}

// Define arcade cabinets
const CABINETS: CabinetInfo[] = [
  {
    id: 'snake-1',
    position: { x: 0, y: 0, z: -5 },
    screenPosition: { x: 0, y: 1.5, z: -4.57 },
    game: 'snake',
  },
  {
    id: 'flappy-1',
    position: { x: 3, y: 0, z: -5 },
    screenPosition: { x: 3, y: 1.5, z: -4.57 },
    game: 'flappy',
  },
  {
    id: 'soulknight-1',
    position: { x: -3, y: 0, z: -5 },
    screenPosition: { x: -3, y: 1.5, z: -4.57 },
    game: 'soulknight',
  },
];

interface GameProps {
  gameCanvases?: Record<string, HTMLCanvasElement | null>;
}

/**
 * Input handler component that initializes the unified input system
 * and handles global input events like ESC to exit
 */
function InputHandler() {
  // Initialize all input handlers (keyboard, gamepad, touch)
  useInput();

  const mode = useGameStore((state) => state.mode);
  const stopPlaying = useGameStore((state) => state.stopPlaying);
  const back = useInputStore((state) => state.back);

  // Handle back button (ESC / B button / touch exit) to exit game
  useEffect(() => {
    if (back && mode === 'playing') {
      stopPlaying();
    }
  }, [back, mode, stopPlaying]);

  return null;
}

export function Game({ gameCanvases = {} }: GameProps) {
  const activeCabinet = useGameStore((state) => state.activeCabinet);
  const viewport = useViewport();
  const cameraConfig = useMemo(() => getInitialCameraConfig(viewport), [viewport]);

  return (
    <>
      {/* Input handler outside of Canvas */}
      <InputHandler />

      <Canvas
        shadows
        camera={{
          position: cameraConfig.position,
          fov: cameraConfig.fov,
          near: 0.1,
          far: 100,
        }}
        style={{
          width: '100%',
          height: '100%',
          background: '#000000',
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
    </>
  );
}

// Export cabinets config for use by parent components
export { CABINETS };
