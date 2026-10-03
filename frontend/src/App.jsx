import { useState, useMemo, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import "./App.css";

import StarBackground from "./components/StarBackground";
import Globe3D from "./components/Globe3D";
import ArchitectureFlow from "./components/ArchitectureFlow";
import {
  SparklesIcon,
  TerminalIcon,
  CpuIcon,
  UploadCloudIcon,
  FileZipIcon,
  FileCodeIcon,
  NetworkIcon,
  DatabaseIcon,
  SendIcon,
  CopyIcon,
  CheckIcon,
  SearchIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  BotIcon,
  UserIcon,
  LayersIcon,
  SunIcon,
  MoonIcon,
  PaperclipIcon,
  ShieldCheckIcon
} from "./components/Icons";

function App() {
  // --------------------------------------------------
  // Page Navigation State ("home" | "upload" | "summary" | "chat")
  // --------------------------------------------------
  const [currentPage, setCurrentPage] = useState("home");
  const [theme, setTheme] = useState("dark"); // Defaulting to Cosmic Deep Space from Image 2 & 3

  // --------------------------------------------------
  // Core Application State (Preserving Existing Logic)
  // --------------------------------------------------
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [projectId, setProjectId] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  // UX states
  const [summaryTab, setSummaryTab] = useState("graph"); // "graph" | "relationships" | "files"
  const [relFilter, setRelFilter] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sync theme attribute to HTML root
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Auto-scroll chat
  useEffect(() => {
    if (currentPage === "chat" && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatLoading, currentPage]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // --------------------------------------------------
  // File Selection & Drag-and-Drop
  // --------------------------------------------------
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMessage(`Selected "${selectedFile.name}" (${(selectedFile.size / 1024).toFixed(1)} KB). Ready for AST analysis.`);
      setMessageType("info");
      setAnalysis(null);
      setProjectId(null);
      setMessages([]);
      setQuestion("");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".zip")) {
        setFile(droppedFile);
        setMessage(`Selected "${droppedFile.name}" (${(droppedFile.size / 1024).toFixed(1)} KB). Ready for AST analysis.`);
        setMessageType("info");
        setAnalysis(null);
        setProjectId(null);
        setMessages([]);
        setQuestion("");
      } else {
        setMessage("Please upload a valid .zip archive containing Python code.");
        setMessageType("error");
      }
    }
  };

  const loadSampleProject = async () => {
    setMessage("Sample project 'auth.zip' is located in workspace/sample_project/auth.zip. Please select it via browse.");
    setMessageType("info");
  };

  const resetAll = () => {
    setFile(null);
    setAnalysis(null);
    setProjectId(null);
    setMessages([]);
    setMessage("");
    setQuestion("");
    setCurrentPage("home");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --------------------------------------------------
  // Upload Project (Preserving Original API Route)
  // --------------------------------------------------
  const uploadFile = async () => {
    if (!file) {
      setMessage("Please select a ZIP file first.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    setAnalysis(null);
    setProjectId(null);
    setMessages([]);
    setQuestion("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setMessage(data.message || "Codebase analyzed successfully");
      setMessageType("success");
      setAnalysis(data.analysis);
      setProjectId(data.project_id);

      // Transition to Summary & Graph page
      setCurrentPage("summary");
    } catch (error) {
      console.error(error);
      setMessage("Could not analyze the codebase. Please verify backend is running on 127.0.0.1:8000.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Ask Copilot (Preserving Original API Route)
  // --------------------------------------------------
  const askCopilot = async (customPrompt) => {
    const queryToSend = (typeof customPrompt === "string" ? customPrompt : question).trim();

    if (!queryToSend) return;

    if (!projectId) {
      setMessage("Please upload and analyze a project first.");
      setMessageType("error");
      setCurrentPage("upload");
      return;
    }

    setChatLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          project_id: projectId,
          question: queryToSend,
          chat_history: messages
        })
      });

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      const data = await response.json();

      setMessages((previousMessages) => [
        ...previousMessages,
        {
          role: "user",
          content: queryToSend
        },
        {
          role: "assistant",
          content: data.answer,
          queryGraph: data.query_graph
        }
      ]);

      setQuestion("");
    } catch (error) {
      console.error(error);
      setMessages((previousMessages) => [
        ...previousMessages,
        {
          role: "user",
          content: queryToSend
        },
        {
          role: "assistant",
          content: "Could not connect to the Copilot. Please check backend connection."
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askCopilot();
    }
  };

  const handleCopyMessage = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // --------------------------------------------------
  // Create Full Codebase Graph Nodes (Preserving Logic)
  // --------------------------------------------------
  const graphNodes = useMemo(() => {
    if (!analysis) return [];

    const relationships = analysis.relationships || [];
    const names = new Set();

    relationships.forEach((relationship) => {
      names.add(relationship.caller);
      names.add(relationship.callee);
    });

    return Array.from(names).map((name, index) => ({
      id: name,
      data: {
        label: (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#38bdf8", fontWeight: 700 }}>fn</span>
            <span>{name}()</span>
          </div>
        )
      },
      position: {
        x: (index % 3) * 260 + 50,
        y: Math.floor(index / 3) * 160 + 50
      }
    }));
  }, [analysis]);

  // --------------------------------------------------
  // Create Full Codebase Graph Edges (Preserving Logic)
  // --------------------------------------------------
  const graphEdges = useMemo(() => {
    if (!analysis) return [];

    const relationships = analysis.relationships || [];

    return relationships.map((relationship, index) => ({
      id: `full-edge-${index}`,
      source: relationship.caller,
      target: relationship.callee,
      animated: true,
      style: { stroke: "#06b6d4", strokeWidth: 2 }
    }));
  }, [analysis]);

  // Filtered Relationships
  const filteredRelationships = useMemo(() => {
    if (!analysis || !analysis.relationships) return [];
    if (!relFilter.trim()) return analysis.relationships;
    const q = relFilter.toLowerCase();
    return analysis.relationships.filter(
      (r) => r.caller.toLowerCase().includes(q) || r.callee.toLowerCase().includes(q)
    );
  }, [analysis, relFilter]);

  // Derived File Summary Items
  const fileSummaryItems = useMemo(() => {
    if (!analysis || !analysis.files) return [];
    return analysis.files.map((fullPath) => {
      const parts = fullPath.replace(/\\/g, "/").split("/");
      const fileName = parts[parts.length - 1];
      
      let fileSummary = "Analyzed by Kyro AST Engine";
      if (fileName.includes("auth")) fileSummary = "Manages user authentication, JWT tokens, and secure login verification routes.";
      else if (fileName.includes("db") || fileName.includes("database")) fileSummary = "Handles database connections, ORM models, and direct query executions.";
      else if (fileName.includes("employee")) fileSummary = "Core business logic for employee CRUD operations and data validation.";
      else if (fileName.includes("main")) fileSummary = "Application entry point initializing middleware, routing, and server config.";
      else if (fileName.includes("utils")) fileSummary = "Shared utility functions, formatters, and reusable helper methods.";

      // Find functions mentioning this file or in relationships
      const relatedRels = (analysis.relationships || []).filter((r) => {
        const baseName = fileName.replace(".py", "").toLowerCase();
        return r.caller.toLowerCase().includes(baseName) || r.callee.toLowerCase().includes(baseName);
      });

      return {
        fullPath,
        fileName,
        relatedRelationsCount: relatedRels.length,
        summary: fileSummary
      };
    });
  }, [analysis]);

  return (
    <div className="app-shell">
      {/* ------------------------------------------------ */}
      {/* Cosmic Twinkling Stars & Strings Background      */}
      {/* ------------------------------------------------ */}
      <StarBackground />

      {/* ------------------------------------------------ */}
      {/* Top Navigation Bar (Image 2 & Image 3 Style)     */}
      {/* ------------------------------------------------ */}
      <header className="navbar">
        <div className="nav-brand" onClick={() => setCurrentPage("home")}>
          <img
            src="/kyro-logo.jpg"
            alt="CodeBase Intelligence Logo"
            className="brand-logo-img"
          />
          <div className="brand-titles">
            <span className="brand-title">
              CodeBase <span>Intelligence</span>
            </span>
            <span className="brand-subtitle">KYRO RAG AGENT</span>
          </div>
        </div>

        {/* Multi-page Nav Pills */}
        <nav className="nav-links">
          <button
            className={`nav-link-btn ${currentPage === "home" ? "active" : ""}`}
            onClick={() => setCurrentPage("home")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Home
          </button>

          <button
            className={`nav-link-btn ${currentPage === "upload" ? "active" : ""}`}
            onClick={() => setCurrentPage("upload")}
          >
            <UploadCloudIcon size={14} />
            Upload
          </button>

          <button
            className={`nav-link-btn ${currentPage === "summary" ? "active" : ""}`}
            onClick={() => setCurrentPage("summary")}
            disabled={!analysis}
          >
            <NetworkIcon size={14} />
            Summary & Graph
          </button>

          <button
            className={`nav-link-btn ${currentPage === "chat" ? "active" : ""}`}
            onClick={() => setCurrentPage("chat")}
            disabled={!analysis}
          >
            <TerminalIcon size={14} />
            Talk with Kyro
          </button>
        </nav>

        {/* Right Actions */}
        <div className="nav-actions">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          >
            {theme === "dark" ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </button>

          {analysis ? (
            <button
              className="btn-nav-primary"
              onClick={() => setCurrentPage("chat")}
            >
              <SparklesIcon size={14} />
              <span>Talk with Kyro</span>
            </button>
          ) : (
            <button
              className="btn-nav-primary"
              onClick={() => setCurrentPage("upload")}
            >
              <span>Get Started</span>
              <ArrowRightIcon size={13} />
            </button>
          )}
        </div>
      </header>

      {/* ------------------------------------------------ */}
      {/* PAGE 1: Home / Landing Page                      */}
      {/* ------------------------------------------------ */}
      {currentPage === "home" && (
        <main className="landing-container">
          {/* Asymmetric Hero Section */}
          <section className="hero-asymmetric-section">
            <div className="hero-left-content">
              <div className="agent-badge-pill">
                <SparklesIcon size={14} />
                <span>Meet Kyro • Your Codebase Intelligence Agent</span>
              </div>

              <h1 className="hero-headline">
                Understand.<br />
                Explore.<br />
                Build <span className="gradient-accent">Faster.</span>
              </h1>

              <p className="hero-subparagraph">
                Kyro reads, understands, and navigates your entire codebase. Get instant answers, visualize relationships, and make intelligent changes — all in one place.
              </p>

              <div className="hero-cta-group">
                <button
                  className="btn-hero-primary"
                  onClick={() => setCurrentPage("upload")}
                >
                  <span>Try Kyro Now</span>
                  <ArrowRightIcon size={16} />
                </button>

                <button
                  className="btn-hero-secondary"
                  onClick={() => setCurrentPage("demo")}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
                  <span>Watch Demo</span>
                </button>
              </div>

              {/* Trust Bar matching Image */}
              <div className="hero-trust-bar">
                <div className="avatar-stack">
                  <div className="avatar-stack-item">AK</div>
                  <div className="avatar-stack-item">PR</div>
                  <div className="avatar-stack-item">DL</div>
                  <div className="avatar-stack-item">JD</div>
                </div>
                <span className="trust-text">
                  Trusted by developers, students and teams
                </span>
              </div>
            </div>

            {/* Right: Globe Burst */}
            <div style={{ width: "100%", position: "relative", zIndex: 10 }}>
              <Globe3D onExplore={() => setCurrentPage("demo")} />
            </div>
          </section>

          {/* 4 Feature Cards Row matching Image 2 */}
          <section className="features-grid">
            <div className="feature-card" onClick={() => setCurrentPage("upload")}>
              <div className="feature-icon-box blue">
                <FileCodeIcon size={22} />
              </div>
              <div className="feature-title-row">
                <h4 className="feature-title">Codebase Understanding</h4>
                <ArrowRightIcon size={14} style={{ color: "var(--text-muted)" }} />
              </div>
              <p className="feature-desc">
                Scan and analyze your entire project structure with automated AST parsing.
              </p>
            </div>

            <div className="feature-card" onClick={() => (analysis ? setCurrentPage("chat") : setCurrentPage("upload"))}>
              <div className="feature-icon-box green">
                <BotIcon size={22} />
              </div>
              <div className="feature-title-row">
                <h4 className="feature-title">Smart Q&A</h4>
                <ArrowRightIcon size={14} style={{ color: "var(--text-muted)" }} />
              </div>
              <p className="feature-desc">
                Get accurate answers from your codebase with zero hallucinations.
              </p>
            </div>

            <div className="feature-card" onClick={() => (analysis ? setCurrentPage("summary") : setCurrentPage("upload"))}>
              <div className="feature-icon-box cyan">
                <NetworkIcon size={22} />
              </div>
              <div className="feature-title-row">
                <h4 className="feature-title">Visual Code Graph</h4>
                <ArrowRightIcon size={14} style={{ color: "var(--text-muted)" }} />
              </div>
              <p className="feature-desc">
                See file relationships, caller-callee hierarchies, and dependencies.
              </p>
            </div>

            <div className="feature-card" onClick={() => setCurrentPage("upload")}>
              <div className="feature-icon-box amber">
                <SparklesIcon size={22} />
              </div>
              <div className="feature-title-row">
                <h4 className="feature-title">Intelligent Edits</h4>
                <ArrowRightIcon size={14} style={{ color: "var(--text-muted)" }} />
              </div>
              <p className="feature-desc">
                Make safe, context-aware code changes grounded in full AST graph memory.
              </p>
            </div>
          </section>


        </main>
      )}

      {/* ------------------------------------------------ */}
      {/* PAGE 2: Upload Page                              */}
      {/* ------------------------------------------------ */}
      {currentPage === "upload" && (
        <main className="upload-page-wrapper">
          <div className="upload-card-container">
            <div className="upload-header">
              <h2>Upload Your Project</h2>
              <p>
                Upload your repository ZIP file to generate function call graphs, parse AST syntax trees, and initialize Kyro's RAG memory.
              </p>
            </div>

            {/* Drag & Drop Zone */}
            <div
              className={`dropzone ${isDragging ? "active" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                className="hidden-file-input"
              />

              <div className="dropzone-icon">
                <UploadCloudIcon size={28} />
              </div>

              <div className="dropzone-label">
                Click to browse or drop your codebase .ZIP
              </div>

              <div className="dropzone-subtext">
                Supports archived repositories containing Python (.py) source modules
              </div>
            </div>

            {/* Selected File Banner */}
            {file && (
              <div className="selected-file-banner">
                <div className="file-info">
                  <FileZipIcon size={22} style={{ color: "var(--accent-primary)" }} />
                  <div>
                    <div className="file-name">{file.name}</div>
                    <div className="file-meta">
                      {(file.size / 1024).toFixed(1)} KB • Ready for AST analysis
                    </div>
                  </div>
                </div>
                <span className="agent-badge-pill" style={{ fontSize: "11px", padding: "2px 8px" }}>
                  Ready
                </span>
              </div>
            )}

            {/* Sample Project Hint */}
            <div className="sample-hint-badge" onClick={loadSampleProject}>
              <CpuIcon size={14} />
              <span>Hint: You can test with <code>workspace/sample_project/auth.zip</code></span>
            </div>

            {/* Analyze Action Button */}
            {!analysis ? (
              <button
                className="btn-primary-action"
                onClick={uploadFile}
                disabled={loading || !file}
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    <span>Extracting AST & Building Graph...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon size={16} />
                    <span>Analyze Codebase</span>
                  </>
                )}
              </button>
            ) : (
              <button
                className="btn-primary-action btn-success-continue"
                onClick={() => setCurrentPage("summary")}
              >
                <CheckCircleIcon size={16} />
                <span>Continue to Summary & Graph →</span>
              </button>
            )}

            {/* Loading Steps */}
            {loading && (
              <div className="loading-steps-box">
                <div className="step-row active">
                  <div className="step-dot"></div>
                  <span>1. Extracting archive & scanning AST syntax tree...</span>
                </div>
                <div className="step-row active">
                  <div className="step-dot"></div>
                  <span>2. Mapping caller-callee function relationships...</span>
                </div>
                <div className="step-row active">
                  <div className="step-dot"></div>
                  <span>3. Vectorizing code chunks into ChromaDB memory...</span>
                </div>
              </div>
            )}

            {/* Status Message */}
            {message && !loading && (
              <div className={`message-toast ${messageType}`} style={{ marginTop: "18px" }}>
                {messageType === "error" ? <AlertCircleIcon size={16} /> : <CheckCircleIcon size={16} />}
                <span>{message}</span>
              </div>
            )}
          </div>
        </main>
      )}

      {/* ------------------------------------------------ */}
      {/* PAGE 3: Summary & Architecture Graph             */}
      {/* ------------------------------------------------ */}
      {currentPage === "summary" && analysis && (
        <main className="summary-page-wrapper">
          {/* Prominent "Talk with Kyro" RAG Hook Banner */}
          <div className="kyro-rag-hook-banner">
            <div className="kyro-rag-hook-content">
              <img
                src="/kyro-logo.jpg"
                alt="Kyro Robot"
                className="kyro-mascot-avatar"
              />
              <div className="kyro-hook-text">
                <h3>Talk with Kyro — Your Codebase Intelligence Agent</h3>
                <p>
                  Kyro has indexed <strong>{analysis.chunk_count} code chunks</strong> across <strong>{analysis.file_count} files</strong> with <strong>{analysis.relationships.length} function dependencies</strong>. Ask questions about control flow, verification, or database logic!
                </p>
              </div>
            </div>

            <button
              className="btn-talk-kyro"
              onClick={() => setCurrentPage("chat")}
            >
              <SparklesIcon size={16} />
              <span>Talk with Kyro Now</span>
              <ArrowRightIcon size={15} />
            </button>
          </div>

          {/* Metric Stats Ribbon */}
          <div className="stats-ribbon">
            <div className="stat-item">
              <div className="stat-icon-wrapper">
                <FileCodeIcon size={20} />
              </div>
              <div>
                <div className="stat-val">{analysis.file_count}</div>
                <div className="stat-lbl">Files Parsed</div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon-wrapper" style={{ color: "#c084fc", background: "rgba(139, 92, 246, 0.15)" }}>
                <LayersIcon size={20} />
              </div>
              <div>
                <div className="stat-val">{analysis.chunk_count}</div>
                <div className="stat-lbl">ChromaDB Vectors</div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon-wrapper" style={{ color: "#67e8f9", background: "rgba(6, 182, 212, 0.15)" }}>
                <NetworkIcon size={20} />
              </div>
              <div>
                <div className="stat-val">{analysis.relationships.length}</div>
                <div className="stat-lbl">Call Relationships</div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon-wrapper" style={{ color: "#6ee7b7", background: "rgba(16, 185, 129, 0.15)" }}>
                <CheckCircleIcon size={20} />
              </div>
              <div>
                <div className="stat-val">Active</div>
                <div className="stat-lbl">AST Index Status</div>
              </div>
            </div>
          </div>

          {/* Split Workspace: Left File Summary Deck, Right Interactive Graph */}
          <div className="summary-workspace-grid">
            {/* Left Rail: Comprehensive File Summary & Architecture Deck */}
            <aside className="file-summary-deck">
              <div className="deck-section-title">
                <FileCodeIcon size={16} style={{ color: "var(--accent-primary)" }} />
                <span>Repository Files Summary</span>
              </div>

              <div className="deck-files-list">
                {fileSummaryItems.map((item, idx) => (
                  <div className="deck-file-card" key={idx}>
                    <div className="deck-file-header">
                      <span className="deck-file-name">
                        <FileCodeIcon size={14} />
                        {item.fileName}
                      </span>
                      <span className="deck-file-badge">PYTHON</span>
                    </div>

                    <div className="deck-file-meta">
                      <span>File #{idx + 1}</span>
                      <span>•</span>
                      <span>{item.relatedRelationsCount} Call Link(s)</span>
                    </div>

                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "10px", lineHeight: 1.4 }}>
                      {item.summary}
                    </p>

                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                      <span className="deck-tag-pill">AST Ready</span>
                      <span className="deck-tag-pill">Vectorized</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="deck-section-title" style={{ marginTop: "10px" }}>
                <NetworkIcon size={16} style={{ color: "var(--accent-cyan)" }} />
                <span>Call Graph Hotspots</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {analysis.relationships && analysis.relationships.slice(0, 4).map((rel, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(14, 18, 38, 0.7)",
                      border: "1px solid var(--border-card)",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "12px",
                      fontFamily: "var(--font-mono)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <span style={{ color: "#93c5fd" }}>{rel.caller}()</span>
                    <span style={{ color: "var(--text-muted)" }}>→</span>
                    <span style={{ color: "#c084fc" }}>{rel.callee}()</span>
                  </div>
                ))}
              </div>
            </aside>

            {/* Right Rail: Graph & Relationship Explorer Card */}
            <div className="summary-main-card">
              <div className="summary-card-header">
                <div className="summary-tabs-list">
                  <button
                    className={`summary-tab-btn ${summaryTab === "graph" ? "active" : ""}`}
                    onClick={() => setSummaryTab("graph")}
                  >
                    <NetworkIcon size={14} />
                    <span>Call Graph Canvas</span>
                    <span className="agent-badge-pill" style={{ fontSize: "10px", padding: "1px 6px" }}>{graphNodes.length}</span>
                  </button>

                  <button
                    className={`summary-tab-btn ${summaryTab === "relationships" ? "active" : ""}`}
                    onClick={() => setSummaryTab("relationships")}
                  >
                    <TerminalIcon size={14} />
                    <span>Relationships Explorer</span>
                    <span className="agent-badge-pill" style={{ fontSize: "10px", padding: "1px 6px" }}>{analysis.relationships.length}</span>
                  </button>

                  <button
                    className={`summary-tab-btn ${summaryTab === "files" ? "active" : ""}`}
                    onClick={() => setSummaryTab("files")}
                  >
                    <FileCodeIcon size={14} />
                    <span>Analyzed Files</span>
                    <span className="agent-badge-pill" style={{ fontSize: "10px", padding: "1px 6px" }}>{analysis.file_count}</span>
                  </button>
                </div>

                <button className="btn-secondary" onClick={() => setCurrentPage("upload")}>
                  <UploadCloudIcon size={13} />
                  <span>Re-upload</span>
                </button>
              </div>

              {/* TAB 1: Graph Canvas */}
              {summaryTab === "graph" && (
                <div className="graph-canvas-box">
                  <ReactFlow
                    nodes={graphNodes}
                    edges={graphEdges}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                  >
                    <Background color="rgba(59, 130, 246, 0.15)" gap={22} size={1.2} />
                    <Controls />
                    <MiniMap nodeColor="#38bdf8" maskColor="rgba(6, 8, 20, 0.7)" />
                  </ReactFlow>
                </div>
              )}

              {/* TAB 2: Searchable Relationships Explorer */}
              {summaryTab === "relationships" && (
                <div className="relationships-table-wrapper">
                  <div className="search-input-box">
                    <SearchIcon size={15} className="search-icon-svg" />
                    <input
                      type="text"
                      placeholder="Search functions (e.g. login, verify_user)..."
                      value={relFilter}
                      onChange={(e) => setRelFilter(e.target.value)}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {filteredRelationships.length > 0 ? (
                      filteredRelationships.map((rel, index) => (
                        <div className="rel-row-item" key={index}>
                          <div className="rel-flow-tags">
                            <span className="rel-badge">caller: {rel.caller}()</span>
                            <span style={{ color: "var(--text-muted)" }}>→</span>
                            <span className="rel-badge callee">callee: {rel.callee}()</span>
                          </div>

                          <button
                            className="btn-ask-pill"
                            onClick={() => {
                              const q = `How does ${rel.caller} call and interact with ${rel.callee}?`;
                              setQuestion(q);
                              setCurrentPage("chat");
                              askCopilot(q);
                            }}
                          >
                            <SparklesIcon size={12} />
                            <span>Ask Kyro</span>
                          </button>
                        </div>
                      ))
                    ) : (
                      <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px" }}>
                        No relationships match "{relFilter}"
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: Analyzed Source Files */}
              {summaryTab === "files" && (
                <div className="relationships-table-wrapper">
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {analysis.files && analysis.files.map((fileItem, idx) => (
                      <div className="rel-row-item" key={idx}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontFamily: "var(--font-mono)", fontSize: "13px", minWidth: 0, flex: 1 }}>
                          <FileCodeIcon size={16} style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
                          <span title={fileItem} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {fileItem.split(/[/\\]/).pop()}
                          </span>
                        </div>
                        <span className="agent-badge-pill" style={{ fontSize: "10px", padding: "2px 8px", flexShrink: 0 }}>
                          PYTHON
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* ------------------------------------------------ */}
      {/* PAGE 4: Talk with Kyro (Exact Match to Image 3)  */}
      {/* ------------------------------------------------ */}
      {currentPage === "chat" && (
        <main className="chat-page-wrapper">
          {/* Sub-header Card matching Image 3 */}
          <div className="chat-subheader-card">
            <div className="chat-subheader-left">
              <img
                src="/kyro-logo.jpg"
                alt="Kyro Avatar"
                className="chat-mascot-tiny-icon"
              />
              <div>
                <div className="chat-subheader-title">
                  <span>Kyro Copilot</span>
                  <SparklesIcon size={14} style={{ color: "#38bdf8" }} />
                </div>
                <div className="chat-subheader-subtitle">
                  Grounded on {graphNodes.length} AST functions & {analysis?.chunk_count || 0} vectors
                </div>
              </div>
            </div>

            <div className="chat-subheader-actions">
              <button
                className="btn-chat-outline"
                onClick={() => setCurrentPage("summary")}
                title="View full codebase graph"
              >
                <NetworkIcon size={14} />
                <span>View Graph</span>
              </button>

              <button
                className="btn-chat-blue"
                onClick={resetAll}
                title="Upload a new codebase"
              >
                <RefreshCwIcon size={14} />
                <span>+ New Project</span>
              </button>
            </div>
          </div>

          {/* Empty State Hero matching Image 3 (or Message Feed when chat starts) */}
          {messages.length === 0 ? (
            <div className="image3-empty-state">


              {/* Title & Subtitle matching Image 3 */}
              <h2 className="image3-empty-title">
                What would you like to know about this code?
              </h2>

              <p className="image3-empty-desc">
                Kyro searches ChromaDB vector chunks and traverses the function relationship graph to answer architectural questions accurately.
              </p>

              {/* 2x2 Prompt Suggestion Cards matching Image 3 */}
              <div className="image3-suggestions-grid">
                <div
                  className="image3-prompt-card"
                  onClick={() => {
                    const q = "How does login verify the user?";
                    setQuestion(q);
                    askCopilot(q);
                  }}
                >
                  <div className="image3-prompt-left">
                    <div className="image3-prompt-icon-box">
                      <UserIcon size={16} />
                    </div>
                    <span className="image3-prompt-text">How does login verify the user?</span>
                  </div>
                  <ArrowRightIcon size={14} style={{ color: "var(--text-muted)" }} />
                </div>

                <div
                  className="image3-prompt-card"
                  onClick={() => {
                    const q = "Explain the dependency graph of this codebase";
                    setQuestion(q);
                    askCopilot(q);
                  }}
                >
                  <div className="image3-prompt-left">
                    <div className="image3-prompt-icon-box" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#c084fc" }}>
                      <NetworkIcon size={16} />
                    </div>
                    <span className="image3-prompt-text">Explain the dependency graph of this codebase</span>
                  </div>
                  <ArrowRightIcon size={14} style={{ color: "var(--text-muted)" }} />
                </div>

                <div
                  className="image3-prompt-card"
                  onClick={() => {
                    const q = "Where is user authentication validated?";
                    setQuestion(q);
                    askCopilot(q);
                  }}
                >
                  <div className="image3-prompt-left">
                    <div className="image3-prompt-icon-box" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#6ee7b7" }}>
                      <ShieldCheckIcon size={16} />
                    </div>
                    <span className="image3-prompt-text">Where is user authentication validated?</span>
                  </div>
                  <ArrowRightIcon size={14} style={{ color: "var(--text-muted)" }} />
                </div>

                <div
                  className="image3-prompt-card"
                  onClick={() => {
                    const q = "What functions call database operations?";
                    setQuestion(q);
                    askCopilot(q);
                  }}
                >
                  <div className="image3-prompt-left">
                    <div className="image3-prompt-icon-box" style={{ background: "rgba(6, 182, 212, 0.15)", color: "#67e8f9" }}>
                      <DatabaseIcon size={16} />
                    </div>
                    <span className="image3-prompt-text">What functions call database operations?</span>
                  </div>
                  <ArrowRightIcon size={14} style={{ color: "var(--text-muted)" }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="chat-messages-scroll">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`chat-bubble-row ${msg.role === "user" ? "user" : "assistant"}`}
                >
                  <div className={`chat-avatar ${msg.role === "user" ? "user-av" : "kyro-av"}`} style={{ overflow: "hidden", padding: msg.role === "assistant" ? 0 : undefined }}>
                    {msg.role === "user" ? (
                      <span>ME</span>
                    ) : (
                      <img src="/kyro-logo.jpg" alt="Kyro Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </div>

                  <div className="chat-content-container">
                    <div className="chat-sender-name">
                      {msg.role === "user" ? "You" : "Kyro Agent"}
                    </div>

                    <div className="chat-bubble-body">
                      <div className="copilot-markdown">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>

                      {/* Copy Answer Action */}
                      {msg.role === "assistant" && (
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: "3px 8px", fontSize: "11px" }}
                            onClick={() => handleCopyMessage(msg.content, index)}
                          >
                            {copiedIndex === index ? (
                              <>
                                <CheckIcon size={12} style={{ color: "var(--accent-emerald)" }} />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <CopyIcon size={12} />
                                <span>Copy Answer</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Embedded query-specific graph card */}
                      {msg.role === "assistant" &&
                        msg.queryGraph &&
                        msg.queryGraph.nodes &&
                        msg.queryGraph.nodes.length > 0 && (
                          <div className="query-graph-card">
                            <div className="query-graph-header">
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <NetworkIcon size={14} style={{ color: "var(--accent-cyan)" }} />
                                <span>Related Subgraph ({msg.queryGraph.nodes.length} functions in context)</span>
                              </div>
                              <span className="agent-badge-pill" style={{ fontSize: "10px", padding: "1px 6px" }}>AST Path</span>
                            </div>

                            <div className="query-graph-box">
                              <ReactFlow
                                nodes={msg.queryGraph.nodes.map((node, nodeIndex) => ({
                                  id: node.id,
                                  data: {
                                    label: (
                                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                        <span style={{ color: "#38bdf8", fontWeight: 700 }}>fn</span>
                                        <span>{node.label || node.id}()</span>
                                      </div>
                                    )
                                  },
                                  position: {
                                    x: (nodeIndex % 3) * 220 + 30,
                                    y: Math.floor(nodeIndex / 3) * 120 + 30
                                  }
                                }))}
                                edges={msg.queryGraph.edges.map((edge, edgeIndex) => ({
                                  id: `subgraph-edge-${index}-${edgeIndex}`,
                                  source: edge.source,
                                  target: edge.target,
                                  animated: true,
                                  style: { stroke: "#06b6d4", strokeWidth: 2 }
                                }))}
                                fitView
                                fitViewOptions={{ padding: 0.2 }}
                              >
                                <Background color="rgba(59, 130, 246, 0.15)" gap={16} size={1} />
                                <Controls />
                              </ReactFlow>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Thinking Indicator */}
              {chatLoading && (
                <div className="chat-bubble-row assistant">
                  <div className="chat-avatar kyro-av">
                    <BotIcon size={16} />
                  </div>
                  <div className="chat-content-container">
                    <div className="chat-sender-name">Kyro Agent</div>
                    <div className="chat-bubble-body thinking-box" style={{ background: "rgba(14, 18, 38, 0.9)", border: "1px solid var(--border-card)" }}>
                      <span>Kyro is synthesizing answer from AST graph and vectors</span>
                      <div className="thinking-dots">
                        <div className="thinking-dot"></div>
                        <div className="thinking-dot"></div>
                        <div className="thinking-dot"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}

          {/* Bottom Glowing Neon Input Dock matching Image 3 */}
          <div className="image3-input-dock">
            <div className="image3-input-inner">
              <div className="image3-input-row">
                <button className="image3-clip-btn" title="Attach file or code snippet">
                  <PaperclipIcon size={18} />
                </button>

                <textarea
                  className="image3-textarea"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Kyro anything about your code (e.g. 'How does login verify the user?')..."
                  rows={2}
                />
              </div>

              <div className="image3-toolbar">
                <div className="image3-hint">
                  <kbd>Enter</kbd> to send, <kbd>Shift + Enter</kbd> for new line
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <SparklesIcon size={16} style={{ color: "#38bdf8" }} />
                  <button
                    className="image3-send-btn"
                    onClick={() => askCopilot()}
                    disabled={chatLoading || !question.trim()}
                    title="Send to Kyro"
                  >
                    <SendIcon size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* PAGE: Demo / Architecture Flow */}
      {currentPage === "demo" && (
        <ArchitectureFlow onNext={() => setCurrentPage("upload")} />
      )}
    </div>
  );
}

export default App;