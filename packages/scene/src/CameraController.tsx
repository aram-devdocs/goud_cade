'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useGameStore } from '@repo/hooks';
import { useViewport, type ViewportInfo } from '@repo/ui';

const LERP_SPEED = 5;
const PLAY_TRANSITION_SPEED = 2;

// Get responsive camera config based on viewport
function getResponsiveCameraConfig(viewport: ViewportInfo) {
  const { deviceType, orientation } = viewport;

  // Default values for desktop/landscape
  let followDistance = 6;
  let followHeight = 4;
  let playDistance = 1.2;

  if (orientation === 'portrait') {
    if (deviceType === 'mobile') {
      // Mobile portrait: pull camera back more, higher up
      followDistance = 8;
      followHeight = 5;
      playDistance = 1.6;
    } else if (deviceType === 'tablet') {
      // Tablet portrait
      followDistance = 7;
      followHeight = 4.5;
      playDistance = 1.4;
    }
  } else {
    // Landscape mode
    if (deviceType === 'mobile') {
      followDistance = 7;
      followHeight = 4;
      playDistance = 1.3;
    }
  }

  return { followDistance, followHeight, playDistance };
}

export function CameraController() {
  const { camera } = useThree();
  const targetPosition = useRef(new Vector3());
  const targetLookAt = useRef(new Vector3());
  const currentPosition = useRef(new Vector3());
  const currentLookAt = useRef(new Vector3());
  const transitionProgress = useRef(0);

  const viewport = useViewport();
  const cameraConfig = useMemo(() => getResponsiveCameraConfig(viewport), [viewport]);

  const playerPosition = useGameStore((state) => state.playerPosition);
  const playerRotation = useGameStore((state) => state.playerRotation);
  const mode = useGameStore((state) => state.mode);
  const activeCabinet = useGameStore((state) => state.activeCabinet);
  const setMode = useGameStore((state) => state.setMode);

  // Initialize camera position
  useEffect(() => {
    currentPosition.current.copy(camera.position);
    currentLookAt.current.set(playerPosition.x, 1, playerPosition.z);
  }, []);

  useFrame((state, delta) => {
    const { followDistance, followHeight, playDistance } = cameraConfig;

    if (mode === 'walking') {
      // Third-person follow camera
      // Calculate target position behind player based on rotation
      const offsetX = Math.sin(playerRotation) * followDistance;
      const offsetZ = Math.cos(playerRotation) * followDistance;

      targetPosition.current.set(
        playerPosition.x + offsetX,
        playerPosition.y + followHeight,
        playerPosition.z + offsetZ
      );
      
      targetLookAt.current.set(
        playerPosition.x,
        playerPosition.y + 1,
        playerPosition.z
      );
      
      // Smooth follow
      currentPosition.current.lerp(targetPosition.current, LERP_SPEED * delta);
      currentLookAt.current.lerp(targetLookAt.current, LERP_SPEED * delta);
      
      camera.position.copy(currentPosition.current);
      camera.lookAt(currentLookAt.current);
      
      transitionProgress.current = 0;
    } 
    else if (mode === 'transitioning' && activeCabinet) {
      // Transition to first-person view looking at arcade screen
      transitionProgress.current += delta * PLAY_TRANSITION_SPEED;
      
      if (transitionProgress.current >= 1) {
        transitionProgress.current = 1;
        setMode('playing');
      }
      
      // Target: in front of screen, looking at it
      const playPosition = new Vector3(
        activeCabinet.screenPosition.x,
        activeCabinet.screenPosition.y,
        activeCabinet.screenPosition.z + playDistance
      );
      
      const playLookAt = new Vector3(
        activeCabinet.screenPosition.x,
        activeCabinet.screenPosition.y,
        activeCabinet.screenPosition.z
      );
      
      // Smooth transition using easing
      const t = easeInOutCubic(transitionProgress.current);
      
      const newPosition = new Vector3().lerpVectors(
        currentPosition.current,
        playPosition,
        t
      );
      
      const newLookAt = new Vector3().lerpVectors(
        currentLookAt.current,
        playLookAt,
        t
      );
      
      camera.position.copy(newPosition);
      camera.lookAt(newLookAt);
      
      if (transitionProgress.current >= 1) {
        currentPosition.current.copy(playPosition);
        currentLookAt.current.copy(playLookAt);
      }
    }
    else if (mode === 'playing' && activeCabinet) {
      // Keep camera fixed on screen
      camera.position.set(
        activeCabinet.screenPosition.x,
        activeCabinet.screenPosition.y,
        activeCabinet.screenPosition.z + playDistance
      );
      camera.lookAt(
        activeCabinet.screenPosition.x,
        activeCabinet.screenPosition.y,
        activeCabinet.screenPosition.z
      );
    }
  });

  return null;
}

// Easing function for smooth transitions
function easeInOutCubic(t: number): number {
  return t < 0.5 
    ? 4 * t * t * t 
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

