'use client';

import { useRef, useEffect, useCallback, useState } from 'react';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 360;
const GRID_SIZE = 20;
const CELL_SIZE = CANVAS_WIDTH / GRID_SIZE;
const INITIAL_SPEED = 150; // ms per move

interface Point {
  x: number;
  y: number;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface SnakeGameProps {
  isActive: boolean;
  onScoreChange?: (score: number) => void;
  onGameOver?: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export function useSnakeGame({ isActive, onScoreChange, onGameOver, canvasRef }: SnakeGameProps) {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  
  // Game state refs (to avoid stale closures in animation loop)
  const snakeRef = useRef<Point[]>([{ x: 10, y: 9 }]);
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const foodRef = useRef<Point>({ x: 15, y: 9 });
  const gameLoopRef = useRef<number | null>(null);
  const lastMoveRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const isActiveRef = useRef(isActive);

  // Keep refs in sync
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // Generate random food position
  const generateFood = useCallback((): Point => {
    const snake = snakeRef.current;
    let newFood: Point;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * (CANVAS_HEIGHT / CELL_SIZE)),
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  // Reset game
  const resetGame = useCallback(() => {
    snakeRef.current = [{ x: 10, y: 9 }];
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    foodRef.current = generateFood();
    scoreRef.current = 0;
    setScore(0);
    gameOverRef.current = false;
    setGameOver(false);
    lastMoveRef.current = 0;
  }, [generateFood]);

  // Draw game
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentScore = scoreRef.current;
    const currentGameOver = gameOverRef.current;

    // Clear canvas with dark background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid (subtle)
    ctx.strokeStyle = '#0a1a0a';
    ctx.lineWidth = 1;
    for (let x = 0; x <= GRID_SIZE; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT / CELL_SIZE; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(CANVAS_WIDTH, y * CELL_SIZE);
      ctx.stroke();
    }

    // Draw snake
    const snake = snakeRef.current;
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      
      // Gradient from bright green (head) to darker green (tail)
      const brightness = 1 - (index / snake.length) * 0.6;
      const green = Math.floor(255 * brightness);
      
      ctx.fillStyle = isHead ? '#00ff00' : `rgb(0, ${green}, 0)`;
      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
      
      // Head glow effect
      if (isHead) {
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 10;
        ctx.fillRect(
          segment.x * CELL_SIZE + 1,
          segment.y * CELL_SIZE + 1,
          CELL_SIZE - 2,
          CELL_SIZE - 2
        );
        ctx.shadowBlur = 0;
      }
    });

    // Draw food
    const food = foodRef.current;
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw score
    ctx.fillStyle = '#00ff00';
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.fillText(`SCORE: ${currentScore}`, 10, 25);

    // Game over screen
    if (currentGameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#ff0000';
      ctx.font = '24px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText(`FINAL SCORE: ${currentScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.fillText('PRESS SPACE TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
      ctx.textAlign = 'left';
    }
  }, [canvasRef]);

  // Game loop - stable reference using refs
  const gameLoop = useCallback((timestamp: number) => {
    if (!isActiveRef.current) return;

    // Move snake at fixed intervals
    if (timestamp - lastMoveRef.current >= INITIAL_SPEED && !gameOverRef.current) {
      lastMoveRef.current = timestamp;
      
      // Update direction
      directionRef.current = nextDirectionRef.current;
      
      const snake = snakeRef.current;
      const firstSegment = snake[0];
      if (!firstSegment) return;
      const head: Point = { x: firstSegment.x, y: firstSegment.y };
      
      // Move head
      switch (directionRef.current) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }
      
      // Check wall collision
      const maxY = Math.floor(CANVAS_HEIGHT / CELL_SIZE);
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= maxY) {
        gameOverRef.current = true;
        setGameOver(true);
        onGameOver?.();
        draw();
        return;
      }
      
      // Check self collision
      if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOverRef.current = true;
        setGameOver(true);
        onGameOver?.();
        draw();
        return;
      }
      
      // Add new head
      snake.unshift(head);
      
      // Check food collision
      const food = foodRef.current;
      if (head.x === food.x && head.y === food.y) {
        const newScore = scoreRef.current + 10;
        scoreRef.current = newScore;
        setScore(newScore);
        onScoreChange?.(newScore);
        foodRef.current = generateFood();
        // Don't pop - snake grows!
      } else {
        // Remove tail if no food eaten
        snake.pop();
      }
    }

    draw();
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [draw, generateFood, onGameOver, onScoreChange]);

  // Handle keyboard input
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentDir = directionRef.current;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir !== 'DOWN') nextDirectionRef.current = 'UP';
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir !== 'UP') nextDirectionRef.current = 'DOWN';
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir !== 'RIGHT') nextDirectionRef.current = 'LEFT';
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir !== 'LEFT') nextDirectionRef.current = 'RIGHT';
          e.preventDefault();
          break;
        case ' ':
          if (gameOverRef.current) {
            resetGame();
          }
          e.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, resetGame]);

  // Start/stop game loop - only depends on isActive
  useEffect(() => {
    if (isActive) {
      resetGame();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [isActive]);

  // Initial draw
  useEffect(() => {
    draw();
  }, [draw]);

  return { score, gameOver, resetGame };
}

// Component that creates and manages the canvas
export function SnakeGame({ 
  isActive, 
  onCanvasReady,
  onScoreChange,
  onGameOver 
}: { 
  isActive: boolean;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  onScoreChange?: (score: number) => void;
  onGameOver?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      onCanvasReady?.(canvasRef.current);
    }
  }, [onCanvasReady]);

  useSnakeGame({ isActive, onScoreChange, onGameOver, canvasRef: canvasRef as React.RefObject<HTMLCanvasElement> });

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{ display: 'none' }} // Hidden - rendered to texture
    />
  );
}

export { CANVAS_WIDTH as SNAKE_CANVAS_WIDTH, CANVAS_HEIGHT as SNAKE_CANVAS_HEIGHT };
