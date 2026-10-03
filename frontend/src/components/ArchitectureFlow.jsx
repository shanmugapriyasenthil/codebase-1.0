import { 
  UploadCloudIcon, 
  TerminalIcon, 
  LayersIcon, 
  NetworkIcon, 
  SparklesIcon, 
  ArrowRightIcon 
} from "./Icons";

export default function ArchitectureFlow({ onNext }) {
  const flowSteps = [
    {
      id: 1,
      title: "1. Codebase Ingestion",
      desc: "Upload a zip file containing the source code. Kyro extracts and indexes the files into memory.",
      icon: UploadCloudIcon,
      color: "#3b82f6" // blue
    },
    {
      id: 2,
      title: "2. AST Parsing",
      desc: "An Abstract Syntax Tree parser breaks down Python files to map function definitions and calls.",
      icon: TerminalIcon,
      color: "#8b5cf6" // purple
    },
    {
      id: 3,
      title: "3. Vector Embedding",
      desc: "Code snippets are chunked and converted into dense embeddings stored in ChromaDB for semantic search.",
      icon: LayersIcon,
      color: "#ec4899" // pink
    },
    {
      id: 4,
      title: "4. Network Graphing",
      desc: "The parsed AST calls are structured into a topological directed graph, mapping how functions interact.",
      icon: NetworkIcon,
      color: "#06b6d4" // cyan
    },
    {
      id: 5,
      title: "5. Kyro RAG Synthesis",
      desc: "When queried, the agent retrieves semantic context (vectors) and structural context (graph) to answer.",
      icon: SparklesIcon,
      color: "#10b981" // emerald
    }
  ];

  return (
    <div className="demo-page-wrapper" style={{ padding: "60px 24px", maxWidth: "1000px", margin: "0 auto", color: "var(--text-primary)" }}>
      <div style={{ textAlign: "center", marginBottom: "60px" }}>
        <h2 style={{ fontSize: "36px", fontWeight: 800, marginBottom: "16px" }}>
          Application <span style={{ color: "#38bdf8" }}>Architecture Flow</span>
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
          Learn how CodeBase Intelligence seamlessly bridges vector semantics and code graphs to power Kyro.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px", position: "relative", alignItems: "center" }}>
        {flowSteps.map((step, index) => {
          const Icon = step.icon;

          return (
            <div key={step.id} style={{ 
              width: "100%",
              maxWidth: "600px",
              background: "rgba(14, 18, 38, 0.8)", 
              border: "1px solid var(--border-card)", 
              borderLeft: `4px solid ${step.color}`,
              borderRadius: "var(--radius-md)",
              padding: "24px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              backdropFilter: "blur(12px)",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ 
                  width: "40px", 
                  height: "40px", 
                  borderRadius: "8px", 
                  background: `${step.color}20`, 
                  color: step.color,
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center" 
                }}>
                  <Icon size={20} />
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>{step.title}</h3>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6 }}>
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: "center", marginTop: "60px" }}>
        <p style={{ marginBottom: "20px", color: "var(--text-muted)" }}>Ready to see it in action?</p>
        <button className="btn-hero-primary" style={{ margin: "0 auto" }} onClick={onNext}>
          <span>Try Kyro Now</span>
          <ArrowRightIcon size={16} />
        </button>
      </div>
    </div>
  );
}
