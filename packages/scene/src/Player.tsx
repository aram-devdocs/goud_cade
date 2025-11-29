'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { Vector3 } from 'three';
import { useGameStore, type CabinetInfo } from '@repo/hooks';
import { useInputStore } from '@repo/input';

const MOVE_SPEED = 5;
const ROTATION_SPEED = 3;
const ROOM_BOUNDS = 8; // Slightly less than half room size to keep player inside

interface PlayerProps {
  cabinets: CabinetInfo[];
  interactionDistance?: number;
}

export function Player({ cabinets, interactionDistance = 2.5 }: PlayerProps) {
  const meshRef = useRef<Mesh>(null);

  const mode = useGameStore((state) => state.mode);
  const setPlayerPosition = useGameStore((state) => state.setPlayerPosition);
  const setPlayerRotation = useGameStore((state) => state.setPlayerRotation);
  const updateNearCabinet = useGameStore((state) => state.setNearCabinet);
  const startPlaying = useGameStore((state) => state.startPlaying);

  // Get input from unified input store
  const movement = useInputStore((state) => state.movement);
  const interact = useInputStore((state) => state.interact);

  // Handle interact button press for interaction
  const handleInteract = useCallback(() => {
    if (mode === 'walking') {
      const nearCab = useGameStore.getState().nearCabinet;
      if (nearCab) {
        startPlaying(nearCab);
      }
    }
  }, [mode, startPlaying]);

  // Watch for interact button press
  useEffect(() => {
    if (interact && mode === 'walking') {
      handleInteract();
    }
  }, [interact, mode, handleInteract]);

  useFrame((state, delta) => {
    if (!meshRef.current || mode !== 'walking') return;

    // Movement from unified input
    const moveX = movement.x; // -1 to 1 (left/right for rotation)
    const moveY = movement.y; // -1 to 1 (forward/backward)

    // Rotation (left/right controls rotation)
    if (moveX !== 0) {
      meshRef.current.rotation.y -= moveX * ROTATION_SPEED * delta;
    }

    // Movement direction based on rotation
    const direction = new Vector3();
    if (moveY !== 0) {
      direction.z = moveY; // Forward is negative Y in input, but we want to go forward
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
