import { useEffect, useRef } from "react";
import { SparklesIcon } from "./Icons";

export default function RealisticGlobe() {
  const canvasRef = useRef(null);
  const rotation = useRef({ x: 0.22, y: 0.4 });
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animId;
    const width = (canvas.width = 460);
    const height = (canvas.height = 460);
    const cx = width / 2;
    const cy = height / 2;
    const radius = 160;

    // Procedural continents approximation using spherical clusters
    // Each land cluster has center (lat, lon in radians) and radius
    const landClusters = [
      // North America
      { lat: 0.75, lon: -1.75, r: 0.55 },
      { lat: 0.55, lon: -1.6, r: 0.45 },
      // South America
      { lat: -0.25, lon: -1.05, r: 0.5 },
      { lat: -0.6, lon: -1.15, r: 0.35 },
      // Europe
      { lat: 0.85, lon: 0.25, r: 0.38 },
      { lat: 0.7, lon: 0.45, r: 0.35 },
      // Africa
      { lat: 0.1, lon: 0.35, r: 0.6 },
      { lat: -0.4, lon: 0.45, r: 0.4 },
      // Asia
      { lat: 0.8, lon: 1.5, r: 0.7 },
      { lat: 0.55, lon: 1.7, r: 0.65 },
      { lat: 0.35, lon: 1.4, r: 0.4 },
      // Australia
      { lat: -0.45, lon: 2.3, r: 0.4 },
      // Antarctica
      { lat: -1.35, lon: 0, r: 0.7 }
    ];

    // Generate surface grid dots with land classification
    const surfacePoints = [];
    const numRows = 70;
    for (let r = 0; r < numRows; r++) {
      const lat = (r / (numRows - 1)) * Math.PI - Math.PI / 2;
      const ringRad = Math.cos(lat);
      const circumference = 2 * Math.PI * ringRad;
      const numCols = Math.max(1, Math.floor(circumference * 55));

      for (let c = 0; c < numCols; c++) {
        const lon = (c / numCols) * 2 * Math.PI - Math.PI;

        // Check if point falls on land
        let isLand = false;
        for (const cluster of landClusters) {
          const dLat = lat - cluster.lat;
          const dLon = Math.atan2(Math.sin(lon - cluster.lon), Math.cos(lon - cluster.lon));
          const dist = Math.sqrt(dLat * dLat + dLon * dLon);
          if (dist < cluster.r) {
            isLand = true;
            break;
          }
        }

        surfacePoints.push({
          lat,
          lon,
          isLand
        });
      }
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Auto rotation
      if (!isDragging.current) {
        rotation.current.y += 0.005;
      }

      // 1. Atmospheric Outer Halo Glow
      const atmosGrad = ctx.createRadialGradient(cx, cy, radius * 0.85, cx, cy, radius * 1.35);
      atmosGrad.addColorStop(0, "rgba(59, 130, 246, 0.4)");
      atmosGrad.addColorStop(0.4, "rgba(6, 182, 212, 0.2)");
      atmosGrad.addColorStop(0.8, "rgba(139, 92, 246, 0.08)");
      atmosGrad.addColorStop(1, "transparent");

      ctx.fillStyle = atmosGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // 2. Realistic Ocean Sphere with 3D Spherical Diffuse Shading
      // Light source located top-left (-0.6, -0.6, 0.8)
      const oceanGrad = ctx.createRadialGradient(
        cx - radius * 0.35,
        cy - radius * 0.35,
        radius * 0.1,
        cx,
        cy,
        radius
      );
      oceanGrad.addColorStop(0, "#1d3557");
      oceanGrad.addColorStop(0.4, "#0f1f38");
      oceanGrad.addColorStop(0.85, "#080e1c");
      oceanGrad.addColorStop(1, "#04070e");

      ctx.fillStyle = oceanGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // 3. Draw Projected Continents & Surface Details
      for (let i = 0; i < surfacePoints.length; i++) {
        const pt = surfacePoints[i];
        const lon = pt.lon + rotation.current.y;
        const lat = pt.lat;

        // 3D Cartesian coordinates
        const x0 = radius * Math.cos(lat) * Math.sin(lon);
        const y0 = -radius * Math.sin(lat);
        const z0 = radius * Math.cos(lat) * Math.cos(lon);

        // Tilt on X axis
        const y1 = y0 * Math.cos(rotation.current.x) - z0 * Math.sin(rotation.current.x);
        const z1 = y0 * Math.sin(rotation.current.x) + z0 * Math.cos(rotation.current.x);

        // Only draw points on the front-facing hemisphere
        if (z1 > 0) {
          const screenX = cx + x0;
          const screenY = cy + y1;

          // Shading factor based on spherical normal vs light
          const normalZ = z1 / radius;
          const normalX = x0 / radius;
          const normalY = y1 / radius;
          const lightFactor = Math.max(0.08, -normalX * 0.4 - normalY * 0.4 + normalZ * 0.7);

          if (pt.isLand) {
            // Continental landmass dot
            ctx.beginPath();
            ctx.arc(screenX, screenY, 1.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${Math.floor(40 + lightFactor * 50)}, ${Math.floor(180 + lightFactor * 75)}, ${Math.floor(130 + lightFactor * 100)}, ${0.4 + lightFactor * 0.6})`;
            ctx.fill();

            // City lights sparkle on dark side
            if (lightFactor < 0.25 && Math.random() > 0.985) {
              ctx.beginPath();
              ctx.arc(screenX, screenY, 1.2, 0, Math.PI * 2);
              ctx.fillStyle = "rgba(255, 230, 140, 0.85)";
              ctx.shadowColor = "#f59e0b";
              ctx.shadowBlur = 4;
              ctx.fill();
              ctx.shadowBlur = 0;
            }
          }
        }
      }

      // 4. Atmospheric Rim & Specular Glint
      ctx.lineWidth = 2.5;
      const rimGrad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
      rimGrad.addColorStop(0, "rgba(96, 165, 250, 0.85)");
      rimGrad.addColorStop(0.5, "rgba(6, 182, 212, 0.4)");
      rimGrad.addColorStop(1, "rgba(15, 23, 42, 0.1)");

      ctx.strokeStyle = rimGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 1, 0, Math.PI * 2);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  const handleMouseDown = (e) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    rotation.current.y += dx * 0.008;
    rotation.current.x -= dy * 0.008;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div
      className="realistic-globe-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 3D Realistic Globe Canvas */}
      <canvas ref={canvasRef} className="realistic-globe-canvas" />

      {/* Floating 3D Robot Mascot (Image 2 style) placed next to globe */}
      <div className="hero-floating-mascot-box">
        {/* Speech Bubble */}
        <div className="mascot-speech-bubble">
          <SparklesIcon size={13} style={{ color: "#38bdf8" }} />
          <span>Ask Kyro about your code...</span>
        </div>

        {/* Mascot Robot Image with glowing orbital ring */}
        <div className="mascot-robot-halo">
          <img
            src="/kyro-hero-robot.png"
            alt="Kyro AI Robot Mascot"
            className="hero-robot-img"
          />
          <div className="mascot-orbit-ring"></div>
        </div>
      </div>
    </div>
  );
}
