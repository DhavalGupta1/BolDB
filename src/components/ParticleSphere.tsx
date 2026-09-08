import React, { useEffect, useRef } from 'react';

export const ParticleSphere: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 550);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 550);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Generate points uniformly on a sphere surface (Fibonacci sphere algorithm)
    const NUM_PARTICLES = 520;
    const radius = Math.min(width, height) * 0.42;
    const particles: { x: number; y: number; z: number; baseSize: number }[] = [];

    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden ratio angle

    for (let i = 0; i < NUM_PARTICLES; i++) {
      const y = 1 - (i / (NUM_PARTICLES - 1)) * 2; // y goes from 1 to -1
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      particles.push({
        x: x * radius,
        y: y * radius,
        z: z * radius,
        baseSize: Math.random() * 1.5 + 1.2,
      });
    }

    let angleX = 0.0025;
    let angleY = 0.004;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / width - 0.5;
      const ny = (e.clientY - rect.top) / height - 0.5;
      mouseX = nx * 0.003;
      mouseY = ny * 0.003;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Dynamic rotation with slight mouse responsiveness
      const rotY = angleY + mouseX;
      const rotX = angleX + mouseY;

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      // Sort particles by depth Z for realistic perspective drawing
      const projected = particles.map((p) => {
        // Rotate around Y axis
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.z * cosY + p.x * sinY;

        // Rotate around X axis
        let y1 = p.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.y * sinX;

        // Perspective projection
        const fov = 450;
        const scale = fov / (fov + z2);
        const x2D = cx + x1 * scale;
        const y2D = cy + y1 * scale;

        // Opacity and color based on depth Z
        const alpha = Math.max(0.08, Math.min(0.9, (z2 + radius) / (2 * radius)));

        return {
          x: x2D,
          y: y2D,
          z: z2,
          size: p.baseSize * scale,
          alpha,
        };
      });

      // Update positions back to particle structure
      for (let i = 0; i < particles.length; i++) {
        let x1 = particles[i].x * cosY - particles[i].z * sinY;
        let z1 = particles[i].z * cosY + particles[i].x * sinY;
        let y1 = particles[i].y * cosX - z1 * sinX;
        let z2 = z1 * cosX + particles[i].y * sinX;

        particles[i].x = x1;
        particles[i].y = y1;
        particles[i].z = z2;
      }

      projected.sort((a, b) => a.z - b.z);

      // Draw subtle orbital latitude lines
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.95, 0, Math.PI * 2);
      ctx.stroke();

      // Draw points
      for (const p of projected) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.6, p.size), 0, Math.PI * 2);
        // Subtle color shifting based on depth
        if (p.z > 0) {
          ctx.fillStyle = `rgba(167, 139, 250, ${p.alpha * 0.95})`; // violet glow in front
        } else {
          ctx.fillStyle = `rgba(203, 213, 225, ${p.alpha * 0.5})`; // dim slate in back
        }
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          filter: 'drop-shadow(0 0 35px rgba(139, 92, 246, 0.2))',
        }}
      />
    </div>
  );
};
