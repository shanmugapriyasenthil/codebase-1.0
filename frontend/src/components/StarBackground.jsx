import { useEffect, useRef } from "react";

export default function StarBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Generate stars with drifting velocity & twinkle phase
    const numStars = Math.min(100, Math.floor((width * height) / 9000));
    const stars = [];

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.6,
        baseAlpha: Math.random() * 0.5 + 0.3,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        color: Math.random() > 0.3 ? "#93c5fd" : Math.random() > 0.5 ? "#c084fc" : "#67e8f9"
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Update & draw stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.x += star.vx;
        star.y += star.vy;
        star.twinklePhase += star.twinkleSpeed;

        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        const currentAlpha = star.baseAlpha + Math.sin(star.twinklePhase) * 0.35;
        const alpha = Math.max(0.1, Math.min(1, currentAlpha));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = star.color;
        ctx.shadowBlur = star.radius * 4;
        ctx.fill();

        // Draw twinkling constellation strings connecting nearby stars
        for (let j = i + 1; j < stars.length; j++) {
          const star2 = stars[j];
          const dx = star.x - star2.x;
          const dy = star.y - star2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const maxDist = 110;
          if (dist < maxDist) {
            const lineAlpha = (1 - dist / maxDist) * 0.18 * alpha;
            ctx.beginPath();
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(star2.x, star2.y);
            ctx.strokeStyle = "#818cf8";
            ctx.globalAlpha = lineAlpha;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0
      }}
    />
  );
}
