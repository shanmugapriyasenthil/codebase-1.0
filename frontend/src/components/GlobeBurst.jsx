import { useState, useMemo } from "react";
import {
  CpuIcon,
  LayersIcon,
  NetworkIcon,
  SparklesIcon,
  TerminalIcon,
  CheckCircleIcon
} from "./Icons";

export default function GlobeBurst({ onExplore }) {
  const [isBursted, setIsBursted] = useState(false);
  const [activeComponent, setActiveComponent] = useState(null);

  // 6 AI Components that burst out when the globe is clicked
  const components = useMemo(() => [
    {
      id: "ast",
      title: "AST Syntax Engine",
      badge: "Python Parser",
      desc: "Extracts abstract syntax trees to detect function definitions, callers, and callees.",
      icon: TerminalIcon,
      color: "#3b82f6",
      angle: 0,
      distance: 215
    },
    {
      id: "vectors",
      title: "ChromaDB Vector RAG",
      badge: "Semantic Memory",
      desc: "Converts code snippets into dense embeddings for similarity search across your files.",
      icon: LayersIcon,
      color: "#8b5cf6",
      angle: 60,
      distance: 225
    },
    {
      id: "graph",
      title: "Dynamic Call Graph",
      badge: "Graph Theory",
      desc: "Builds a directed execution network connecting callers to callees across modules.",
      icon: NetworkIcon,
      color: "#06b6d4",
      angle: 120,
      distance: 215
    },
    {
      id: "kyro",
      title: "Kyro RAG Agent",
      badge: "Cognitive Brain",
      desc: "Synthesizes architecture answers grounded in the code graph and vector memory.",
      icon: SparklesIcon,
      color: "#ec4899",
      angle: 180,
      distance: 225
    },
    {
      id: "deps",
      title: "Dependency Resolver",
      badge: "Cross-File Links",
      desc: "Tracks module boundaries, imports, and cross-functional interaction chains.",
      icon: CpuIcon,
      color: "#10b981",
      angle: 240,
      distance: 215
    },
    {
      id: "rag",
      title: "Context Merger",
      badge: "Hybrid Retrieval",
      desc: "Fuses topological graph context with semantic vector chunks for zero-hallucination Q&A.",
      icon: CheckCircleIcon,
      color: "#f59e0b",
      angle: 300,
      distance: 225
    }
  ], []);

  return (
    <div className={`globe-burst-stage ${isBursted ? "bursted" : ""}`}>
      {/* Center Globe Click Area (Clean - NO text overlay) */}
      <div
        className="rotating-globe-anchor"
        onClick={() => setIsBursted((prev) => !prev)}
        title="Interactive Rotating Globe"
      >
        {/* Realistic Glowing Earth Globe Image Rotating */}
        <img
          src="/cosmic-globe.png"
          alt="Realistic Glowing Earth Globe"
          className="rotating-globe-img"
        />
      </div>



      {/* Radial Burst Holographic AI Components */}
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
                "--comp-color": comp.color
              }}
              onMouseEnter={() => setActiveComponent(comp.id)}
              onMouseLeave={() => setActiveComponent(null)}
              onClick={onExplore}
              title="Click to explore this component"
            >
              <div className="burst-card-header">
                <div
                  className="burst-card-icon"
                  style={{ background: `${comp.color}20`, color: comp.color }}
                >
                  <Icon size={16} />
                </div>
                <div>
                  <div className="burst-card-title">{comp.title}</div>
                  <span className="burst-card-badge">{comp.badge}</span>
                </div>
              </div>
              <p className="burst-card-desc">{comp.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
