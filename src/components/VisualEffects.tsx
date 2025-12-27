import React, { useEffect, useRef, useState } from 'react';

interface VisualEffectsProps {
  effectsEnabled: {
    fireworks: boolean;
    colorMorph: boolean;
    rippleWave: boolean;
    floatingBubbles: boolean;
    magneticCursor: boolean;
    gradientMesh: boolean;
  };
  animationSpeed: number;
  theme: any;
}

interface Firework {
  x: number;
  y: number;
  particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
  }>;
}

interface Bubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

interface RipplePoint {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
}

const VisualEffects: React.FC<VisualEffectsProps> = ({ effectsEnabled, animationSpeed, theme }) => {
  const fireworksCanvasRef = useRef<HTMLCanvasElement>(null);
  const bubblesCanvasRef = useRef<HTMLCanvasElement>(null);
  const rippleCanvasRef = useRef<HTMLCanvasElement>(null);
  const fireworksRef = useRef<Firework[]>([]);
  const bubblesRef = useRef<Bubble[]>([]);
  const ripplesRef = useRef<RipplePoint[]>([]);
  const animationFrameRef = useRef<number>();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [colorPhase, setColorPhase] = useState(0);

  // Fireworks effect
  useEffect(() => {
    if (!effectsEnabled.fireworks) return;

    const canvas = fireworksCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create firework every 2 seconds
    const createFirework = () => {
      const colors = [theme.colors.primary, '#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf'];
      const firework: Firework = {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.5,
        particles: []
      };

      // Create particles for explosion
      for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 * i) / 30;
        const speed = 2 + Math.random() * 3;
        firework.particles.push({
          x: firework.x,
          y: firework.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }

      fireworksRef.current.push(firework);
    };

    const interval = setInterval(createFirework, 2000 / (animationSpeed / 50));

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      clearInterval(interval);
    };
  }, [effectsEnabled.fireworks, theme.colors.primary, animationSpeed]);

  // Floating Bubbles effect
  useEffect(() => {
    if (!effectsEnabled.floatingBubbles) return;

    const canvas = bubblesCanvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create bubbles
    bubblesRef.current = [];
    const colors = [theme.colors.primary, '#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf'];
    for (let i = 0; i < 20; i++) {
      bubblesRef.current.push({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 100,
        vx: (Math.random() - 0.5) * 2,
        vy: -(Math.random() * 2 + 1),
        size: Math.random() * 40 + 20,
        opacity: Math.random() * 0.3 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [effectsEnabled.floatingBubbles, theme.colors.primary]);

  // Ripple Wave effect
  useEffect(() => {
    if (!effectsEnabled.rippleWave) return;

    const canvas = rippleCanvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleClick = (e: MouseEvent) => {
      ripplesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: 200,
        opacity: 1
      });
    };

    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('click', handleClick);
    };
  }, [effectsEnabled.rippleWave]);

  // Magnetic Cursor effect
  useEffect(() => {
    if (!effectsEnabled.magneticCursor) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [effectsEnabled.magneticCursor]);

  // Color Morph effect
  useEffect(() => {
    if (!effectsEnabled.colorMorph) return;

    const interval = setInterval(() => {
      setColorPhase(prev => (prev + 1) % 360);
    }, 50 / (animationSpeed / 50));

    return () => clearInterval(interval);
  }, [effectsEnabled.colorMorph, animationSpeed]);
  // Animation loop
  useEffect(() => {
    const animate = () => {
      const speedMultiplier = animationSpeed / 50;

      // Animate fireworks
      if (effectsEnabled.fireworks && fireworksCanvasRef.current) {
        const canvas = fireworksCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          fireworksRef.current = fireworksRef.current.filter(firework => {
            firework.particles = firework.particles.filter(particle => {
              particle.x += particle.vx * speedMultiplier;
              particle.y += particle.vy * speedMultiplier;
              particle.vy += 0.1 * speedMultiplier; // Gravity
              particle.life -= 0.01 * speedMultiplier;

              if (particle.life > 0) {
                ctx.save();
                ctx.globalAlpha = particle.life;
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                return true;
              }
              return false;
            });
            return firework.particles.length > 0;
          });
        }
      }

      // Animate bubbles
      if (effectsEnabled.floatingBubbles && bubblesCanvasRef.current) {
        const canvas = bubblesCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          bubblesRef.current.forEach(bubble => {
            bubble.x += bubble.vx * speedMultiplier;
            bubble.y += bubble.vy * speedMultiplier;

            // Reset bubble if it goes off screen
            if (bubble.y < -bubble.size) {
              bubble.y = canvas.height + bubble.size;
              bubble.x = Math.random() * canvas.width;
            }
            if (bubble.x < -bubble.size) bubble.x = canvas.width + bubble.size;
            if (bubble.x > canvas.width + bubble.size) bubble.x = -bubble.size;

            // Draw bubble
            ctx.save();
            ctx.globalAlpha = bubble.opacity;
            
            // Gradient fill
            const gradient = ctx.createRadialGradient(
              bubble.x - bubble.size / 4,
              bubble.y - bubble.size / 4,
              0,
              bubble.x,
              bubble.y,
              bubble.size
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.5, bubble.color);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
            ctx.fill();

            // Highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(bubble.x - bubble.size / 4, bubble.y - bubble.size / 4, bubble.size / 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          });
        }
      }

      // Animate ripples
      if (effectsEnabled.rippleWave && rippleCanvasRef.current) {
        const canvas = rippleCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          ripplesRef.current = ripplesRef.current.filter(ripple => {
            ripple.radius += 3 * speedMultiplier;
            ripple.opacity -= 0.02 * speedMultiplier;

            if (ripple.opacity > 0 && ripple.radius < ripple.maxRadius) {
              ctx.save();
              ctx.globalAlpha = ripple.opacity;
              ctx.strokeStyle = theme.colors.primary;
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
              return true;
            }
            return false;
          });
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (effectsEnabled.fireworks || effectsEnabled.floatingBubbles || effectsEnabled.rippleWave) {
      animate();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    effectsEnabled.fireworks,
    effectsEnabled.floatingBubbles,
    effectsEnabled.rippleWave,
    animationSpeed,
    theme.colors.primary
  ]);

  return (
    <>
      {/* Fireworks Canvas */}
      {effectsEnabled.fireworks && (
        <canvas
          ref={fireworksCanvasRef}
          className="fixed inset-0 pointer-events-none z-10"
          style={{ opacity: 0.7 }}
        />
      )}

      {/* Floating Bubbles Canvas */}
      {effectsEnabled.floatingBubbles && (
        <canvas
          ref={bubblesCanvasRef}
          className="fixed inset-0 pointer-events-none z-10"
          style={{ opacity: 0.5 }}
        />
      )}

      {/* Ripple Wave Canvas */}
      {effectsEnabled.rippleWave && (
        <canvas
          ref={rippleCanvasRef}
          className="fixed inset-0 pointer-events-none z-10"
          style={{ opacity: 0.6 }}
        />
      )}

      {/* Global CSS for effects */}
      <style>{`
        ${effectsEnabled.colorMorph ? `
          .btn-primary, .event-card, .memory-card {
            background: linear-gradient(
              ${colorPhase}deg,
              ${theme.colors.primary} 0%,
              hsl(${colorPhase}, 70%, 60%) 50%,
              ${theme.colors.primary} 100%
            ) !important;
            transition: background 0.5s ease;
          }
        ` : ''}
        
        ${effectsEnabled.magneticCursor ? `
          .btn-primary, .memory-card, .event-card {
            transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
          }
          
          .btn-primary:hover, .memory-card:hover, .event-card:hover {
            transform: scale(1.05) translateY(-2px);
            box-shadow: 0 10px 30px ${theme.colors.primary}40;
          }
        ` : ''}
        
        ${effectsEnabled.gradientMesh ? `
          body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
              radial-gradient(circle at 20% 50%, ${theme.colors.primary}15 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, ${theme.colors.secondary}15 0%, transparent 50%),
              radial-gradient(circle at 40% 20%, ${theme.colors.primary}10 0%, transparent 50%);
            pointer-events: none;
            z-index: 0;
            animation: meshMove ${10 - (animationSpeed / 20)}s ease-in-out infinite alternate;
          }
          
          @keyframes meshMove {
            0% {
              transform: scale(1) rotate(0deg);
            }
            100% {
              transform: scale(1.1) rotate(5deg);
            }
          }
        ` : ''}
      `}</style>
    </>
  );
};

export default VisualEffects;
