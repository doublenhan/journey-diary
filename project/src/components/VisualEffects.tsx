import React, { useEffect, useRef } from 'react';

interface VisualEffectsProps {
  effectsEnabled: {
    particles: boolean;
    hearts: boolean;
    transitions: boolean;
    glow: boolean;
    fadeIn: boolean;
    slideIn: boolean;
  };
  animationSpeed: number;
  theme: any;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

interface FloatingHeart {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

const VisualEffects: React.FC<VisualEffectsProps> = ({ effectsEnabled, animationSpeed, theme }) => {
  const particlesCanvasRef = useRef<HTMLCanvasElement>(null);
  const heartsCanvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const heartsRef = useRef<FloatingHeart[]>([]);
  const animationFrameRef = useRef<number>();

  // Initialize particles
  useEffect(() => {
    if (!effectsEnabled.particles) return;

    const canvas = particlesCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create particles
    particlesRef.current = [];
    for (let i = 0; i < 50; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.1,
        color: theme.colors.primary
      });
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [effectsEnabled.particles, theme.colors.primary]);

  // Initialize hearts
  useEffect(() => {
    if (!effectsEnabled.hearts) return;

    const canvas = heartsCanvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create hearts
    heartsRef.current = [];
    for (let i = 0; i < 15; i++) {
      heartsRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1,
        size: Math.random() * 20 + 10,
        opacity: Math.random() * 0.3 + 0.1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 2
      });
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [effectsEnabled.hearts]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      const speedMultiplier = animationSpeed / 50; // Normalize speed

      // Animate particles
      if (effectsEnabled.particles && particlesCanvasRef.current) {
        const canvas = particlesCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          particlesRef.current.forEach(particle => {
            // Update position
            particle.x += particle.vx * speedMultiplier;
            particle.y += particle.vy * speedMultiplier;
            
            // Wrap around edges
            if (particle.x < 0) particle.x = canvas.width;
            if (particle.x > canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = canvas.height;
            if (particle.y > canvas.height) particle.y = 0;
            
            // Draw particle
            ctx.save();
            ctx.globalAlpha = particle.opacity;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });
        }
      }

      // Animate hearts
      if (effectsEnabled.hearts && heartsCanvasRef.current) {
        const canvas = heartsCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          heartsRef.current.forEach(heart => {
            // Update position and rotation
            heart.x += heart.vx * speedMultiplier;
            heart.y += heart.vy * speedMultiplier;
            heart.rotation += heart.rotationSpeed * speedMultiplier;
            
            // Wrap around edges
            if (heart.x < -heart.size) heart.x = canvas.width + heart.size;
            if (heart.x > canvas.width + heart.size) heart.x = -heart.size;
            if (heart.y < -heart.size) heart.y = canvas.height + heart.size;
            if (heart.y > canvas.height + heart.size) heart.y = -heart.size;
            
            // Draw heart
            ctx.save();
            ctx.globalAlpha = heart.opacity;
            ctx.translate(heart.x, heart.y);
            ctx.rotate((heart.rotation * Math.PI) / 180);
            ctx.fillStyle = theme.colors.primary;
            
            // Draw heart shape
            const size = heart.size;
            ctx.beginPath();
            ctx.moveTo(0, size / 4);
            ctx.bezierCurveTo(-size / 2, -size / 4, -size, size / 8, 0, size / 2);
            ctx.bezierCurveTo(size, size / 8, size / 2, -size / 4, 0, size / 4);
            ctx.fill();
            
            ctx.restore();
          });
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (effectsEnabled.particles || effectsEnabled.hearts) {
      animate();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [effectsEnabled.particles, effectsEnabled.hearts, animationSpeed, theme.colors.primary]);

  return (
    <>
      {/* Particles Canvas */}
      {effectsEnabled.particles && (
        <canvas
          ref={particlesCanvasRef}
          className="fixed inset-0 pointer-events-none z-10"
          style={{ opacity: 0.6 }}
        />
      )}

      {/* Hearts Canvas */}
      {effectsEnabled.hearts && (
        <canvas
          ref={heartsCanvasRef}
          className="fixed inset-0 pointer-events-none z-10"
          style={{ opacity: 0.4 }}
        />
      )}

      {/* Global CSS for effects */}
      <style>{`
        ${effectsEnabled.glow ? `
          .btn-primary, .event-card:hover, .memory-card:hover {
            box-shadow: 0 0 20px ${theme.colors.primary}40 !important;
          }
        ` : ''}
        
        ${effectsEnabled.transitions ? `
          * {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
        ` : ''}
        
        ${effectsEnabled.fadeIn ? `
          .animate-fade-in {
            animation: fadeInEffect ${2 - (animationSpeed / 100)}s ease-out;
          }
          
          @keyframes fadeInEffect {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        ` : ''}
        
        ${effectsEnabled.slideIn ? `
          .sidebar {
            animation: slideInLeft ${1.5 - (animationSpeed / 100)}s ease-out;
          }
          
          .main-content > * {
            animation: slideInRight ${1.5 - (animationSpeed / 100)}s ease-out;
          }
          
          @keyframes slideInLeft {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
          }
          
          @keyframes slideInRight {
            from { transform: translateX(50px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        ` : ''}
      `}</style>
    </>
  );
};

export default VisualEffects;
