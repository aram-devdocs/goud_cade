'use client';

const ROOM_SIZE = 20;
const WALL_HEIGHT = 8;

function Wall({ 
  position, 
  rotation = [0, 0, 0],
  width = ROOM_SIZE 
}: { 
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
}) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <planeGeometry args={[width, WALL_HEIGHT]} />
      <meshStandardMaterial
        color="#0a0a15"
        metalness={0.3}
        roughness={0.8}
        emissive="#000511"
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

export function Room() {
  return (
    <group>
      {/* Floor with grid effect */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
        <meshStandardMaterial
          color="#0a0a18"
          metalness={0.9}
          roughness={0.3}
        />
      </mesh>
      
      {/* Grid lines on floor */}
      <gridHelper 
        args={[ROOM_SIZE, 20, '#00ff88', '#004422']} 
        position={[0, 0.01, 0]}
      />
      
      {/* Walls */}
      {/* Back wall */}
      <Wall 
        position={[0, WALL_HEIGHT / 2, -ROOM_SIZE / 2]} 
        rotation={[0, 0, 0]}
      />
      {/* Front wall */}
      <Wall 
        position={[0, WALL_HEIGHT / 2, ROOM_SIZE / 2]} 
        rotation={[0, Math.PI, 0]}
      />
      {/* Left wall */}
      <Wall 
        position={[-ROOM_SIZE / 2, WALL_HEIGHT / 2, 0]} 
        rotation={[0, Math.PI / 2, 0]}
      />
      {/* Right wall */}
      <Wall 
        position={[ROOM_SIZE / 2, WALL_HEIGHT / 2, 0]} 
        rotation={[0, -Math.PI / 2, 0]}
      />
      
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, WALL_HEIGHT, 0]}>
        <planeGeometry args={[ROOM_SIZE, ROOM_SIZE]} />
        <meshStandardMaterial
          color="#050510"
          metalness={0.2}
          roughness={0.9}
        />
      </mesh>
      
      {/* Ambient neon strips on walls */}
      <mesh position={[0, 0.1, -ROOM_SIZE / 2 + 0.1]}>
        <boxGeometry args={[ROOM_SIZE - 2, 0.05, 0.05]} />
        <meshStandardMaterial
          color="#00ff88"
          emissive="#00ff88"
          emissiveIntensity={2}
        />
      </mesh>
      <mesh position={[0, 0.1, ROOM_SIZE / 2 - 0.1]}>
        <boxGeometry args={[ROOM_SIZE - 2, 0.05, 0.05]} />
        <meshStandardMaterial
          color="#ff00ff"
          emissive="#ff00ff"
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  );
}
