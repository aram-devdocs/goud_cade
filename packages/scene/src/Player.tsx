'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { Mesh, Vector3 } from 'three';
import { useGameStore, type CabinetInfo } from '@repo/hooks';

const MOVE_SPEED = 5;
const ROTATION_SPEED = 3;
const ROOM_BOUNDS = 8; // Slightly less than half room size to keep player inside

interface PlayerProps {
  cabinets: CabinetInfo[];
  interactionDistance?: number;
}

export function Player({ cabinets, interactionDistance = 2.5 }: PlayerProps) {
  const meshRef = useRef<Mesh>(null);
  const velocityRef = useRef(new Vector3());
  
  const mode = useGameStore((state) => state.mode);
  const setPlayerPosition = useGameStore((state) => state.setPlayerPosition);
  const setPlayerRotation = useGameStore((state) => state.setPlayerRotation);
  const setNearCabinet = useGameStore((state) => state.nearCabinet);
  const updateNearCabinet = useGameStore((state) => state.setNearCabinet);
  const startPlaying = useGameStore((state) => state.startPlaying);
  
  // Get keyboard controls
  const [subscribeKeys, getKeys] = useKeyboardControls();

  // Handle E key press for interaction
  useEffect(() => {
    const unsubscribe = subscribeKeys(
      (state) => state.interact,
      (pressed) => {
        if (pressed && mode === 'walking') {
          const nearCab = useGameStore.getState().nearCabinet;
          if (nearCab) {
            startPlaying(nearCab);
          }
        }
      }
    );
    return () => unsubscribe();
  }, [subscribeKeys, mode, startPlaying]);

  useFrame((state, delta) => {
    if (!meshRef.current || mode !== 'walking') return;

    const { forward, backward, left, right } = getKeys();
    
    // Get current rotation
    const currentRotation = meshRef.current.rotation.y;
    
    // Rotation
    if (left) {
      meshRef.current.rotation.y += ROTATION_SPEED * delta;
    }
    if (right) {
      meshRef.current.rotation.y -= ROTATION_SPEED * delta;
    }
    
    // Movement direction based on rotation
    const direction = new Vector3();
    if (forward) {
      direction.z -= 1;
    }
    if (backward) {
      direction.z += 1;
    }
    
    // Apply rotation to direction
    if (direction.length() > 0) {
      direction.normalize();
      direction.applyAxisAngle(new Vector3(0, 1, 0), meshRef.current.rotation.y);
      
      // Calculate new position
      const newX = meshRef.current.position.x + direction.x * MOVE_SPEED * delta;
      const newZ = meshRef.current.position.z + direction.z * MOVE_SPEED * delta;
      
      // Clamp to room bounds
      meshRef.current.position.x = Math.max(-ROOM_BOUNDS, Math.min(ROOM_BOUNDS, newX));
      meshRef.current.position.z = Math.max(-ROOM_BOUNDS, Math.min(ROOM_BOUNDS, newZ));
    }
    
    // Update store with player position
    setPlayerPosition({
      x: meshRef.current.position.x,
      y: meshRef.current.position.y,
      z: meshRef.current.position.z,
    });
    setPlayerRotation(meshRef.current.rotation.y);
    
    // Check proximity to cabinets
    let closestCabinet: CabinetInfo | null = null;
    let closestDistance = interactionDistance;
    
    for (const cabinet of cabinets) {
      const distance = Math.sqrt(
        Math.pow(meshRef.current.position.x - cabinet.position.x, 2) +
        Math.pow(meshRef.current.position.z - cabinet.position.z, 2)
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestCabinet = cabinet;
      }
    }
    
    updateNearCabinet(closestCabinet);
  });

  // Don't render player when playing a game
  if (mode === 'playing') return null;

  return (
    <group ref={meshRef as any} position={[0, 0.9, 5]}>
      {/* Player body - capsule shape */}
      <mesh castShadow>
        <capsuleGeometry args={[0.3, 1, 8, 16]} />
        <meshStandardMaterial
          color="#4488ff"
          emissive="#2244aa"
          emissiveIntensity={0.3}
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>
      
      {/* Direction indicator */}
      <mesh position={[0, 0.5, -0.4]}>
        <coneGeometry args={[0.15, 0.3, 8]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

