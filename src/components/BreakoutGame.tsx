"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  speed: number;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  visible: boolean;
  points: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 15;
const BALL_RADIUS = 8;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_WIDTH = 80;
const BRICK_HEIGHT = 25;
const BRICK_PADDING = 10;
const BRICK_OFFSET_TOP = 60;
const BRICK_OFFSET_LEFT = 35;

const BRICK_COLORS = [
  { color: "#ef4444", points: 50 }, // red
  { color: "#f97316", points: 40 }, // orange
  { color: "#eab308", points: 30 }, // yellow
  { color: "#22c55e", points: 20 }, // green
  { color: "#3b82f6", points: 10 }, // blue
];

export default function BreakoutGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameOver" | "won">("menu");
  const [highScore, setHighScore] = useState(0);

  const ballRef = useRef<Ball>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 50,
    dx: 4,
    dy: -4,
    radius: BALL_RADIUS,
    speed: 5,
  });

  const paddleRef = useRef<Paddle>({
    x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
    y: CANVAS_HEIGHT - 30,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
  });

  const bricksRef = useRef<Brick[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});

  const initBricks = useCallback(() => {
    const bricks: Brick[] = [];
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        bricks.push({
          x: BRICK_OFFSET_LEFT + col * (BRICK_WIDTH + BRICK_PADDING),
          y: BRICK_OFFSET_TOP + row * (BRICK_HEIGHT + BRICK_PADDING),
          width: BRICK_WIDTH,
          height: BRICK_HEIGHT,
          color: BRICK_COLORS[row].color,
          visible: true,
          points: BRICK_COLORS[row].points,
        });
      }
    }
    bricksRef.current = bricks;
  }, []);

  const resetBall = useCallback(() => {
    ballRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 50,
      dx: (Math.random() > 0.5 ? 1 : -1) * 4,
      dy: -4,
      radius: BALL_RADIUS,
      speed: 5,
    };
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setGameState("playing");
    resetBall();
    initBricks();
  }, [initBricks, resetBall]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (gameState !== "playing") return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      paddleRef.current.x = mouseX - PADDLE_WIDTH / 2;
      
      // Keep paddle within bounds
      if (paddleRef.current.x < 0) paddleRef.current.x = 0;
      if (paddleRef.current.x + PADDLE_WIDTH > CANVAS_WIDTH) {
        paddleRef.current.x = CANVAS_WIDTH - PADDLE_WIDTH;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [gameState]);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gameLoop = () => {
      // Clear canvas
      ctx.fillStyle = "#0f172a"; // slate-900
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Handle paddle movement with arrow keys
      if (keysRef.current["ArrowLeft"] || keysRef.current["a"] || keysRef.current["A"]) {
        paddleRef.current.x -= 8;
      }
      if (keysRef.current["ArrowRight"] || keysRef.current["d"] || keysRef.current["D"]) {
        paddleRef.current.x += 8;
      }

      // Keep paddle within bounds
      if (paddleRef.current.x < 0) paddleRef.current.x = 0;
      if (paddleRef.current.x + PADDLE_WIDTH > CANVAS_WIDTH) {
        paddleRef.current.x = CANVAS_WIDTH - PADDLE_WIDTH;
      }

      // Update ball position
      ballRef.current.x += ballRef.current.dx;
      ballRef.current.y += ballRef.current.dy;

      // Ball collision with walls
      if (ballRef.current.x + ballRef.current.radius > CANVAS_WIDTH || 
          ballRef.current.x - ballRef.current.radius < 0) {
        ballRef.current.dx = -ballRef.current.dx;
      }
      if (ballRef.current.y - ballRef.current.radius < 0) {
        ballRef.current.dy = -ballRef.current.dy;
      }

      // Ball collision with paddle
      const ball = ballRef.current;
      const paddle = paddleRef.current;
      if (
        ball.y + ball.radius > paddle.y &&
        ball.y - ball.radius < paddle.y + paddle.height &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width
      ) {
        // Calculate hit position relative to paddle center
        const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
        ball.dy = -Math.abs(ball.dy);
        ball.dx = hitPos * 5; // Add angle based on where ball hit paddle
      }

      // Ball falls below paddle
      if (ball.y + ball.radius > CANVAS_HEIGHT) {
        setLives((prev) => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setGameState("gameOver");
            setHighScore((prev) => Math.max(prev, score));
          } else {
            resetBall();
          }
          return newLives;
        });
      }

      // Ball collision with bricks
      let allBricksDestroyed = true;
      bricksRef.current.forEach((brick) => {
        if (!brick.visible) return;
        allBricksDestroyed = false;

        if (
          ball.x + ball.radius > brick.x &&
          ball.x - ball.radius < brick.x + brick.width &&
          ball.y + ball.radius > brick.y &&
          ball.y - ball.radius < brick.y + brick.height
        ) {
          brick.visible = false;
          ball.dy = -ball.dy;
          setScore((prev) => prev + brick.points);
        }
      });

      // Check win condition
      if (allBricksDestroyed) {
        setGameState("won");
        setHighScore((prev) => Math.max(prev, score));
      }

      // Draw bricks
      bricksRef.current.forEach((brick) => {
        if (!brick.visible) return;
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        // Add subtle border
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.lineWidth = 2;
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
      });

      // Draw paddle with gradient
      const paddleGradient = ctx.createLinearGradient(
        paddle.x, paddle.y,
        paddle.x, paddle.y + paddle.height
      );
      paddleGradient.addColorStop(0, "#60a5fa");
      paddleGradient.addColorStop(1, "#2563eb");
      ctx.fillStyle = paddleGradient;
      ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
      ctx.strokeStyle = "#1d4ed8";
      ctx.lineWidth = 2;
      ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);

      // Draw ball with glow effect
      ctx.shadowColor = "#60a5fa";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.closePath();

      // Draw score and lives
      ctx.font = "bold 20px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score}`, 20, 35);
      ctx.textAlign = "right";
      ctx.fillText(`Lives: ${lives}`, CANVAS_WIDTH - 20, 35);

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, score, lives, resetBall]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-4">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-white mb-2">🔵 Breakout</h1>
        <p className="text-slate-400">
          Use mouse or arrow keys to move the paddle
        </p>
        <p className="text-slate-500 text-sm mt-1">
          (Dolph, this Game will work better with a mouse)
        </p>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-4 border-slate-700 rounded-lg shadow-2xl bg-slate-900"
        />

        {/* Game Over / Menu Overlay */}
        {(gameState === "menu" || gameState === "gameOver" || gameState === "won") && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
            <div className="text-center p-8 bg-slate-800 rounded-xl border-2 border-slate-600">
              {gameState === "menu" && (
                <>
                  <h2 className="text-3xl font-bold text-white mb-4">Ready to Play?</h2>
                  {highScore > 0 && (
                    <p className="text-yellow-400 mb-4">High Score: {highScore}</p>
                  )}
                </>
              )}
              {gameState === "gameOver" && (
                <>
                  <h2 className="text-3xl font-bold text-red-400 mb-2">Game Over!</h2>
                  <p className="text-white text-xl mb-2">Final Score: {score}</p>
                  <p className="text-yellow-400 mb-4">High Score: {Math.max(highScore, score)}</p>
                </>
              )}
              {gameState === "won" && (
                <>
                  <h2 className="text-3xl font-bold text-green-400 mb-2">You Won! 🎉</h2>
                  <p className="text-white text-xl mb-2">Final Score: {score}</p>
                  <p className="text-yellow-400 mb-4">High Score: {Math.max(highScore, score)}</p>
                </>
              )}
              <button
                onClick={startGame}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors shadow-lg"
              >
                {gameState === "menu" ? "Start Game" : "Play Again"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-8 text-slate-400 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-red-500 inline-block"></span>
          <span>50 pts</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-orange-500 inline-block"></span>
          <span>40 pts</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-yellow-500 inline-block"></span>
          <span>30 pts</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-green-500 inline-block"></span>
          <span>20 pts</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-blue-500 inline-block"></span>
          <span>10 pts</span>
        </div>
      </div>

      <div className="mt-4 text-slate-500 text-sm">
        Tip: Hit the ball with the edges of your paddle for more angle!
      </div>
    </div>
  );
}
