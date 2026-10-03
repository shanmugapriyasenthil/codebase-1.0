import { useEffect, useRef, useState, useMemo } from "react";
import {
  CpuIcon,
  LayersIcon,
  NetworkIcon,
  SparklesIcon,
  TerminalIcon,
  RefreshCwIcon,
  CheckCircleIcon
} from "./Icons";

export default function Globe3D({ onExplore }) {
  const canvasRef = useRef(null);
  const [isBursted, setIsBursted] = useState(false);
  const [activeComponent, setActiveComponent] = useState(null);
  const animFrameId = useRef(null);
  const rotation = useRef({ x: 0.2, y: 0 });
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // 6 AI Components that burst from the globe
  const components = useMemo(() => [
    {
      id: "ast",
      title: "AST Syntax Engine",
      badge: "Python Parser",
      desc: "Extracts abstract syntax trees to detect function definitions, callers, and callees.",
      icon: TerminalIcon,
      color: "#3b82f6",
      angle: 0,
      distance: 210
    },
    {
      id: "vectors",
      title: "ChromaDB Vector RAG",
      badge: "Semantic Memory",
      desc: "Converts code snippets into dense embeddings for similarity search across your files.",
      icon: LayersIcon,
      color: "#8b5cf6",
      angle: 60,
      distance: 220
    },
    {
      id: "graph",
      title: "Dynamic Call Graph",
      badge: "Graph Theory",
      desc: "Builds a directed execution network connecting callers to callees across modules.",
      icon: NetworkIcon,
      color: "#06b6d4",
      angle: 120,
      distance: 210
    },
    {
      id: "kyro",
      title: "Kyro RAG Agent",
      badge: "Cognitive Brain",
      desc: "Synthesizes architecture answers grounded in the code graph and vector memory.",
      icon: SparklesIcon,
      color: "#ec4899",
      angle: 180,
      distance: 220
    },
    {
      id: "deps",
      title: "Dependency Resolver",
      badge: "Cross-File Links",
      desc: "Tracks module boundaries, imports, and cross-functional interaction chains.",
      icon: CpuIcon,
      color: "#10b981",
      angle: 240,
      distance: 210
    },
    {
      id: "rag",
      title: "Context Merger",
      badge: "Hybrid Retrieval",
      desc: "Fuses topological graph context with semantic vector chunks for zero-hallucination Q&A.",
      icon: CheckCircleIcon,
      color: "#f59e0b",
      angle: 300,
      distance: 220
    }
  ], []);

  const [globeColor, setGlobeColor] = useState({ hex: "#00f0ff", r: 0, g: 240, b: 255 });

  const handleComponentClick = (e, comp) => {
    e.stopPropagation();
    const hex = comp.color;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    setGlobeColor({ hex, r, g, b });
  };

  // Canvas Globe Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = 460);
    let height = (canvas.height = 460);
    const radius = 150;

    // Generate globe surface points
    const points = [];
    const numPoints = 220;
    for (let i = 0; i < numPoints; i++) {
      const phi = Math.acos(-1 + (2 * i) / numPoints);
      const theta = Math.sqrt(numPoints * Math.PI) * phi;
      points.push({
        x: radius * Math.cos(theta) * Math.sin(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(phi)
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;

      // Auto rotation if not dragging
      if (!isDragging.current) {
        rotation.current.y += isBursted ? 0.003 : 0.009;
      }

      // Draw atmospheric outer glow
      const grad = ctx.createRadialGradient(cx, cy, radius * 0.7, cx, cy, radius * 1.35);
      grad.addColorStop(0, `rgba(${globeColor.r}, ${globeColor.g}, ${globeColor.b}, 0.15)`);
      grad.addColorStop(0.6, `rgba(${globeColor.r}, ${globeColor.g}, ${globeColor.b}, 0.05)`);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // Draw globe latitude rings
      const rings = [-0.6, -0.3, 0, 0.3, 0.6];
      ctx.lineWidth = 1.2;

      rings.forEach((rOffset) => {
        const ringY = radius * rOffset;
        const ringRad = Math.sqrt(Math.max(0, radius * radius - ringY * ringY));
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2; a += 0.2) {
          const px = ringRad * Math.cos(a);
          const py = ringY;
          const pz = ringRad * Math.sin(a);

          // Rotate around X
          const y1 = py * Math.cos(rotation.current.x) - pz * Math.sin(rotation.current.x);
          const z1 = py * Math.sin(rotation.current.x) + pz * Math.cos(rotation.current.x);
          // Rotate around Y
          const x2 = px * Math.cos(rotation.current.y) + z1 * Math.sin(rotation.current.y);
          const z2 = -px * Math.sin(rotation.current.y) + z1 * Math.cos(rotation.current.y);

          const scale = 400 / (400 + z2);
          const screenX = cx + x2 * scale;
          const screenY = cy + y1 * scale;

          if (a === 0) ctx.moveTo(screenX, screenY);
          else ctx.lineTo(screenX, screenY);
        }
        ctx.strokeStyle = `rgba(${globeColor.r}, ${globeColor.g}, ${globeColor.b}, 0.25)`;
        ctx.stroke();
      });

      // Draw surface nodes and connectors
      const projectedPoints = points.map((p) => {
        const y1 = p.y * Math.cos(rotation.current.x) - p.z * Math.sin(rotation.current.x);
        const z1 = p.y * Math.sin(rotation.current.x) + p.z * Math.cos(rotation.current.x);
        const x2 = p.x * Math.cos(rotation.current.y) + z1 * Math.sin(rotation.current.y);
        const z2 = -p.x * Math.sin(rotation.current.y) + z1 * Math.cos(rotation.current.y);

        const scale = 400 / (400 + z2);
        return {
          x: cx + x2 * scale,
          y: cy + y1 * scale,
          z: z2,
          scale
        };
      });

      // Sort points back to front
      projectedPoints.sort((a, b) => a.z - b.z);

      projectedPoints.forEach((p) => {
        if (p.z > -radius * 0.9) {
          const alpha = (p.z + radius) / (radius * 2);
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1.2, 2.8 * p.scale), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${globeColor.r}, ${globeColor.g}, ${globeColor.b}, ${0.4 + alpha * 0.6})`;
          ctx.fill();

          if (p.z > 0) {
            ctx.shadowColor = globeColor.hex;
            ctx.shadowBlur = 6;
          } else {
            ctx.shadowBlur = 0;
          }
        }
      });
      ctx.shadowBlur = 0;

      // Draw burst lasers if exploded
      if (isBursted) {
        components.forEach((c) => {
          const rad = (c.angle * Math.PI) / 180;
          const targetX = cx + Math.cos(rad) * (c.distance - 20);
          const targetY = cy + Math.sin(rad) * (c.distance - 20);

          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(targetX, targetY);
          const laserGrad = ctx.createLinearGradient(cx, cy, targetX, targetY);
          laserGrad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
          laserGrad.addColorStop(0.3, c.color);
          laserGrad.addColorStop(1, "transparent");
          ctx.strokeStyle = laserGrad;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        });
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isBursted, components, globeColor]);

  // Handle Dragging
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
      className={`globe-3d-wrapper ${isBursted ? "bursted" : ""}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 3D Canvas Sphere */}
      <div className="globe-canvas-container" onClick={() => {
        setIsBursted(!isBursted);
        if (isBursted) {
          setGlobeColor({ hex: "#00f0ff", r: 0, g: 240, b: 255 }); // reset to original cyan
        }
      }}>
        <canvas ref={canvasRef} className="globe-canvas" />
      </div>

      {/* Bursting Holographic 3D Component Labels */}
      <div className={`burst-components-orbital ${isBursted ? "active" : ""}`}>
        {components.map((comp) => {
          const rad = (comp.angle * Math.PI) / 180;
          const x = Math.cos(rad) * comp.distance;
          const y = Math.sin(rad) * comp.distance;
          const Icon = comp.icon;

          return (
            <div
              key={comp.id}
              className={`burst-component-card ${activeComponent === comp.id ? "focused" : ""}`}
              style={{
                "--target-x": `${x}px`,
                "--target-y": `${y}px`,
                "--comp-color": comp.color,
                padding: "10px 16px",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "10px",
                minWidth: "auto",
                width: "max-content",
                background: "rgba(14, 18, 38, 0.8)",
                borderRadius: "var(--radius-full)"
              }}
              onMouseEnter={() => setActiveComponent(comp.id)}
              onMouseLeave={() => setActiveComponent(null)}
              onClick={(e) => handleComponentClick(e, comp)}
              title="Click to change globe color"
            >
              <div style={{ color: comp.color, display: "flex", alignItems: "center" }}>
                <Icon size={16} />
              </div>
              <div className="burst-card-title" style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>
                {comp.title}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
