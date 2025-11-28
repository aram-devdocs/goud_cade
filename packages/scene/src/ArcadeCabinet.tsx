'use client';

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, CanvasTexture, NearestFilter } from 'three';
import type { CabinetInfo } from '@repo/hooks';

interface ArcadeCabinetProps {
  cabinet: CabinetInfo;
  gameCanvas?: HTMLCanvasElement | null;
  isActive?: boolean;
}

export function ArcadeCabinet({ cabinet, gameCanvas, isActive = false }: ArcadeCabinetProps) {
  const screenRef = useRef<Mesh>(null);
  const [screenTexture, setScreenTexture] = useState<CanvasTexture | null>(null);

  // Create texture from game canvas
  useEffect(() => {
    if (gameCanvas) {
      const texture = new CanvasTexture(gameCanvas);
      texture.minFilter = NearestFilter;
      texture.magFilter = NearestFilter;
      setScreenTexture(texture);
    }
  }, [gameCanvas]);

  // Update texture each frame when game is active
  useFrame(() => {
    if (screenTexture && gameCanvas && isActive) {
      screenTexture.needsUpdate = true;
    }
  });

  return (
    <group position={[cabinet.position.x, cabinet.position.y, cabinet.position.z]}>
      {/* Main cabinet body */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 2, 0.8]} />
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>
      
      {/* Cabinet top (angled back) */}
      <mesh position={[0, 2.2, -0.15]} rotation={[0.3, 0, 0]} castShadow>
        <boxGeometry args={[1.2, 0.6, 0.6]} />
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>
      
      {/* Screen bezel */}
      <mesh position={[0, 1.5, 0.35]} castShadow>
        <boxGeometry args={[1, 0.9, 0.15]} />
        <meshStandardMaterial
          color="#0f0f1a"
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>
      
      {/* Screen - this displays the game */}
      <mesh 
        ref={screenRef}
        position={[cabinet.screenPosition.x - cabinet.position.x, cabinet.screenPosition.y - cabinet.position.y, cabinet.screenPosition.z - cabinet.position.z]}
      >
        <planeGeometry args={[0.85, 0.75]} />
        {screenTexture ? (
          <meshBasicMaterial map={screenTexture} />
        ) : (
          <meshStandardMaterial
            color="#000000"
            emissive={isActive ? "#003300" : "#001100"}
            emissiveIntensity={isActive ? 2 : 0.5}
          />
        )}
      </mesh>
      
      {/* Screen glow effect when active */}
      {isActive && (
        <pointLight
          position={[0, 1.5, 0.6]}
          color="#00ff00"
          intensity={0.5}
          distance={2}
        />
      )}
      
      {/* Control panel */}
      <mesh position={[0, 0.7, 0.5]} rotation={[-0.5, 0, 0]} castShadow>
        <boxGeometry args={[1.1, 0.5, 0.4]} />
        <meshStandardMaterial
          color="#2a2a3e"
          metalness={0.4}
          roughness={0.6}
        />
      </mesh>
      
      {/* Joystick */}
      <group position={[-0.25, 0.85, 0.55]}>
        <mesh>
          <cylinderGeometry args={[0.05, 0.05, 0.15, 16]} />
          <meshStandardMaterial color="#333333" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial
            color="#ff0000"
            emissive="#ff0000"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>
      
      {/* Buttons */}
      {[0, 0.15, 0.3].map((offset, i) => (
        <mesh key={i} position={[0.15 + offset, 0.82, 0.55]}>
          <cylinderGeometry args={[0.05, 0.05, 0.03, 16]} />
          <meshStandardMaterial
            color={['#ff4444', '#44ff44', '#4444ff'][i]}
            emissive={['#ff4444', '#44ff44', '#4444ff'][i]}
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
      
      {/* Coin slot */}
      <mesh position={[0, 0.3, 0.41]}>
        <boxGeometry args={[0.15, 0.05, 0.02]} />
        <meshStandardMaterial color="#ffcc00" metalness={0.9} />
      </mesh>
      
      {/* Cabinet side art panels with neon trim */}
      <mesh position={[-0.61, 1, 0]}>
        <boxGeometry args={[0.02, 2, 0.8]} />
        <meshStandardMaterial
          color="#ff00ff"
          emissive="#ff00ff"
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh position={[0.61, 1, 0]}>
        <boxGeometry args={[0.02, 2, 0.8]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Game title marquee */}
      <mesh position={[0, 2.45, 0.1]}>
        <boxGeometry args={[1.1, 0.25, 0.3]} />
        <meshStandardMaterial
          color="#000000"
          emissive="#00ff88"
          emissiveIntensity={1}
        />
      </mesh>
    </group>
  );
}

