"use client";

import { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  Upload, 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  Cpu, 
  Terminal as TerminalIcon, 
  Download, 
  Plus, 
  Search, 
  Database,
  ArrowRight,
  Sparkles,
  Layers
} from "lucide-react";
import ThreeDViewer from "../components/ThreeDViewer";

interface Job {
  jobId: string;
  parentId: string | null;
  prompt: string;
  componentType: string | null;
  manufacturingMethod: "FDM_Plastic" | "SLA_Resin" | "SLM_Metal" | null;
  material: string | null;
  status: "pending" | "researching" | "queueing" | "compiling" | "completed" | "failed";
  progress: number;
  logs: string;
  originalDimensions: string | null;
  finalDimensions: string | null;
  outputFilePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isCreating, setIsCreating] = useState(true);
  
  // Form State
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [modifyPrompt, setModifyPrompt] = useState("");

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Find all ancestors and descendants in a linear chain of iterations
  const getVersionTimeline = () => {
    if (!selectedJob) return [];
    
    const chainMap = new Map<string, Job>();
    chainMap.set(selectedJob.jobId, selectedJob);
    
    const jobMap = new Map<string, Job>();
    jobs.forEach(j => jobMap.set(j.jobId, j));
    
    // Trace parents upwards
    let parentId = selectedJob.parentId;
    while (parentId && jobMap.has(parentId)) {
      const parent = jobMap.get(parentId)!;
      chainMap.set(parent.jobId, parent);
      parentId = parent.parentId;
    }
    
    // Trace children downwards
    let currentId = selectedJob.jobId;
    while (true) {
      const child = jobs.find(j => j.parentId === currentId);
      if (child) {
        chainMap.set(child.jobId, child);
        currentId = child.jobId;
      } else {
        break;
      }
    }
    
    return Array.from(chainMap.values()).sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  };

  const handleModifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modifyPrompt.trim() || !selectedJob) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("prompt", modifyPrompt);
    formData.append("parentId", selectedJob.jobId);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setModifyPrompt("");
        await fetchJobs();
        
        const newJob: Job = {
          jobId: data.jobId,
          parentId: selectedJob.jobId,
          prompt: modifyPrompt,
          componentType: null,
          manufacturingMethod: null,
          material: null,
          status: "pending",
          progress: 0,
          logs: "[SYSTEM] Initiating design iteration...\n",
          originalDimensions: null,
          finalDimensions: null,
          outputFilePath: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setSelectedJob(newJob);
        setIsCreating(false);
      }
    } catch (err) {
      console.error("Modify submit error:", err);
      alert("Failed to submit design modification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch all jobs
  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      if (data.jobs) {
        setJobs(data.jobs);
        
        // Update selected job details if currently viewing one
        if (selectedJob) {
          const updated = data.jobs.find((j: Job) => j.jobId === selectedJob.jobId);
          if (updated) {
            setSelectedJob(updated);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, [selectedJob]);

  // Polling for selected job when active
  useEffect(() => {
    if (!selectedJob) return;
    const active = ["pending", "researching", "queueing", "compiling"].includes(selectedJob.status);
    if (!active) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/jobs/${selectedJob.jobId}`);
        const data = await res.json();
        if (data.job) {
          setSelectedJob(data.job);
          // Auto-scroll terminal
          if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    const interval = setInterval(poll, 1500);
    return () => clearInterval(interval);
  }, [selectedJob]);

  // Auto scroll terminal logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedJob?.logs]);

  // Handle Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Submit new compilation job
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("prompt", prompt);
    if (file) {
      formData.append("file", file);
    }

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        // Reset form
        setPrompt("");
        setFile(null);
        setIsCreating(false);
        
        // Fetch jobs and select the new one
        await fetchJobs();
        const newJob = jobs.find(j => j.jobId === data.jobId);
        if (newJob) {
          setSelectedJob(newJob);
        } else {
          // Fallback if jobs state hasn't updated yet
          setSelectedJob({
            jobId: data.jobId,
            parentId: null,
            prompt,
            componentType: null,
            manufacturingMethod: null,
            material: null,
            status: "pending",
            progress: 0,
            logs: "[SYSTEM] Initiating job...\n",
            originalDimensions: null,
            finalDimensions: null,
            outputFilePath: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error("Compilation error:", err);
      alert("Failed to submit engineering request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: Job["status"]) => {
    switch (status) {
      case "completed": return "text-emerald-400 bg-emerald-950/40 border-emerald-900";
      case "failed": return "text-red-400 bg-red-950/40 border-red-900";
      case "compiling": return "text-purple-400 bg-purple-950/40 border-purple-900 animate-pulse";
      case "researching": return "text-cyan-400 bg-cyan-950/40 border-cyan-900";
      default: return "text-slate-400 bg-slate-900/60 border-slate-800";
    }
  };

  const formatKeyName = (key: string) => {
    return key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
  };

  // Check if a dimension was modified by physics or tolerances
  const isDimensionModified = (key: string, origVal: number, finalVal: number) => {
    if (origVal === undefined || finalVal === undefined) return false;
    return Math.abs(origVal - finalVal) > 0.001;
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-screen text-slate-100 font-sans">
      
      {/* Sidebar: Lists past generations */}
      <aside className="w-full md:w-80 glass-panel border-r border-slate-800 flex flex-col shrink-0 md:sticky md:top-0 md:h-screen">
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="h-5 w-5 text-cyan-400" />
            <span className="font-mono font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              VELOLABS CEM
            </span>
          </div>
          <button
            onClick={() => {
              setSelectedJob(null);
              setIsCreating(true);
            }}
            className="p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-900/60 hover:bg-cyan-900/60 hover:border-cyan-400/80 text-cyan-400 transition-all cursor-pointer"
            title="Start New Generation"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Search / List header */}
        <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-800/40 flex justify-between">
          <span>COMPILATION RUNS</span>
          <span>{jobs.length} total</span>
        </div>

        {/* Jobs list */}
        <div className="flex-grow overflow-y-auto divide-y divide-slate-900/40 p-2 space-y-1">
          {jobs.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-xs font-mono">
              No historical runs found
            </div>
          ) : (
            jobs.map((job) => (
              <button
                key={job.jobId}
                onClick={() => {
                  setSelectedJob(job);
                  setIsCreating(false);
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedJob?.jobId === job.jobId
                    ? "bg-slate-800/40 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.05)]"
                    : "bg-transparent border-transparent hover:bg-slate-900/30 hover:border-slate-800/60"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-[10px] text-slate-500 truncate max-w-[120px]">
                    {job.jobId}
                  </span>
                  <span className={`text-[9px] px-2 py-0.5 rounded border uppercase font-mono ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-semibold line-clamp-2 leading-relaxed">
                  {job.prompt}
                </p>
                {job.componentType && (
                  <div className="mt-2 flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                    <span className="bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800">
                      {job.componentType.toUpperCase()}
                    </span>
                    <span>{job.material}</span>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col bg-slate-950/20 min-h-screen">
        
        {/* Form to submit new compilation */}
        {isCreating ? (
          <div className="max-w-3xl mx-auto w-full p-6 md:py-12">
            
            {/* Platform Banner */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center space-x-2 bg-cyan-950/20 border border-cyan-800/40 px-3 py-1 rounded-full text-cyan-400 text-xs font-mono mb-4">
                <Sparkles className="h-3.5 w-3.5 animate-spin" />
                <span>Next-Gen Autonomous Voxel Engine</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-400 to-purple-400">
                  Computational Engineering Platform
                </span>
              </h1>
              <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                Provide design parameters or upload a manufacturer datasheet. The AI agent extracts dimensions, runs structural overrides, and C# compiles a watertight `.3mf` print file.
              </p>
            </div>

            {/* Ingestion Glass Form */}
            <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 glow-card space-y-6">
              
              {/* Text Prompt */}
              <div className="space-y-2">
                <label className="block text-xs font-bold font-mono tracking-widest text-slate-400 uppercase">
                  1. Define Component Intent
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder='e.g., "Design a heavy bracket to support 450N load, made of SLM Titanium, width 40mm, length 80mm with a 5mm screw hole" or "NEMA 17 bracket housing made of FDM plastic"'
                  rows={4}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-sm font-sans focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 transition-all leading-relaxed"
                />
              </div>

              {/* Datasheet Upload Area */}
              <div className="space-y-2">
                <label className="block text-xs font-bold font-mono tracking-widest text-slate-400 uppercase">
                  2. Upload PDF Datasheet (Optional)
                </label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                    dragActive 
                      ? "border-cyan-400 bg-cyan-950/20" 
                      : "border-slate-800 bg-slate-950/40 hover:bg-slate-900/20 hover:border-slate-700"
                  }`}
                  onClick={() => document.getElementById("pdf-upload")?.click()}
                >
                  <input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Upload className={`h-8 w-8 mb-2 ${file ? "text-cyan-400" : "text-slate-500"}`} />
                  {file ? (
                    <div>
                      <p className="text-sm font-medium text-cyan-400">{file.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-slate-300">Drag & drop your PDF datasheet here</p>
                      <p className="text-xs text-slate-500 mt-1">Supports standard engineering table layouts</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isSubmitting || !prompt.trim()}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white py-3.5 px-6 rounded-xl text-sm font-bold font-mono tracking-wider flex items-center justify-center space-x-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.15)] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_25px_rgba(6,182,212,0.25)] cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Cpu className="h-4 w-4 animate-spin" />
                    <span>EXTRACTING DATA & COMPILING...</span>
                  </>
                ) : (
                  <>
                    <span>START AUTONOMOUS COMPILATION</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          // Active Job Viewer Screen
          selectedJob && (
            <div className="p-6 md:p-8 space-y-6 flex-grow flex flex-col max-w-6xl mx-auto w-full">
              
              {/* Version History Breadcrumb Timeline */}
              {(() => {
                const timeline = getVersionTimeline();
                if (timeline.length <= 1) return null;
                return (
                  <div className="glass-panel rounded-xl p-3 flex flex-wrap items-center gap-2 border border-slate-800/80 bg-slate-900/20 shrink-0 shadow-lg">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mr-2">
                      Design Iteration Timeline:
                    </span>
                    {timeline.map((t, idx) => {
                      const isActive = t.jobId === selectedJob.jobId;
                      return (
                        <div key={t.jobId} className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedJob(t)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                              isActive
                                ? "bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.25)]"
                                : "bg-slate-950/80 border border-slate-800/60 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                            }`}
                          >
                            v{idx + 1}: {t.prompt.substring(0, 24)}{t.prompt.length > 24 ? "..." : ""}
                          </button>
                          {idx < timeline.length - 1 && (
                            <span className="text-slate-600 text-xs font-bold font-mono">→</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Job Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-5 gap-4">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 mb-1">
                    <span>JOB ID:</span>
                    <span className="text-slate-400 font-bold">{selectedJob.jobId}</span>
                  </div>
                  <h2 className="text-xl font-bold font-sans">
                    {selectedJob.prompt}
                  </h2>
                </div>

                {selectedJob.outputFilePath && (
                  <a
                    href={selectedJob.outputFilePath}
                    download
                    className="self-start md:self-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-mono font-bold text-xs py-2.5 px-4 rounded-lg flex items-center space-x-2 border border-emerald-400/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>DOWNLOAD PRODUCTION 3MF</span>
                  </a>
                )}
              </div>

              {/* Progress Tracker Stepper */}
              <div className="glass-panel rounded-xl p-4">
                <div className="flex justify-between text-xs font-mono text-slate-400 mb-2">
                  <span>SYSTEM PIPELINE TRACKER</span>
                  <span className="text-cyan-400 font-bold">{selectedJob.progress}%</span>
                </div>
                <div className="w-full bg-slate-900 border border-slate-800 h-2 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-500"
                    style={{ width: `${selectedJob.progress}%` }}
                  />
                </div>
                
                {/* Stepper Status Indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                  <div className="flex items-center space-x-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${
                      selectedJob.progress >= 10 ? "bg-cyan-400 step-glow-cyan" : "bg-slate-800"
                    }`} />
                    <span className="text-[11px] font-mono text-slate-300">1. Ingest Prompt</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${
                      selectedJob.progress >= 40 ? "bg-cyan-400 step-glow-cyan" : "bg-slate-800"
                    }`} />
                    <span className="text-[11px] font-mono text-slate-300">2. Research Agent</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${
                      selectedJob.progress >= 60 ? "bg-purple-400 step-glow-purple" : "bg-slate-800"
                    }`} />
                    <span className="text-[11px] font-mono text-slate-300">3. Physics check</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${
                      selectedJob.progress >= 100 ? (selectedJob.status === "failed" ? "bg-red-400" : "bg-emerald-400") : "bg-slate-800"
                    }`} />
                    <span className="text-[11px] font-mono text-slate-300">4. Voxel Output</span>
                  </div>
                </div>
              </div>

              {/* Dynamic split pane */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                {/* Left Side: Real-time Terminal Log Console */}
                <div className="glass-panel rounded-xl overflow-hidden border border-slate-800/80 flex flex-col h-[400px]">
                  <div className="bg-slate-950/80 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-2">
                      <TerminalIcon className="h-4 w-4 text-cyan-400" />
                      <span className="text-xs font-mono font-semibold tracking-wider text-slate-400">
                        COMPILER LOG CONSOLE
                      </span>
                    </div>
                    {/* Glowing status */}
                    <div className="flex items-center space-x-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                      <span className="text-[10px] font-mono text-slate-500 uppercase">{selectedJob.status}</span>
                    </div>
                  </div>
                  <div className="flex-grow p-4 overflow-y-auto font-mono text-[11px] leading-relaxed bg-[#030509] space-y-1.5 select-text">
                    {selectedJob.logs.split("\n").map((line, idx) => {
                      if (!line.trim()) return null;
                      let color = "text-slate-400";
                      if (line.includes("[PHYSICS OVERRIDE]")) color = "text-amber-400 font-bold";
                      else if (line.includes("[SYSTEM ERROR]")) color = "text-red-400 font-bold";
                      else if (line.includes("[TOLERANCE ENGINE]")) color = "text-purple-400";
                      else if (line.includes("[SYSTEM]")) color = "text-cyan-400";
                      else if (line.includes("[WEB SEARCH]")) color = "text-slate-500";
                      else if (line.includes("SUCCESSFUL")) color = "text-emerald-400 font-bold";
                      
                      return (
                        <div key={idx} className={color}>
                          {line}
                        </div>
                      );
                    })}
                    <div ref={logsEndRef} />
                  </div>
                </div>

                {/* Right Side: Interactive 3D Model Canvas Viewer */}
                <div className="glass-panel rounded-xl overflow-hidden h-[400px]">
                  {selectedJob.status === "completed" && selectedJob.finalDimensions ? (
                    <ThreeDViewer
                      componentType={selectedJob.componentType!}
                      dimensions={selectedJob.finalDimensions}
                      outputFilePath={selectedJob.outputFilePath}
                    />
                  ) : selectedJob.status === "failed" ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-center p-6 space-y-2">
                      <AlertTriangle className="h-12 w-12 text-red-500/70" />
                      <h4 className="font-mono text-sm text-red-400">Compilation Failed</h4>
                      <p className="text-xs max-w-xs leading-relaxed">
                        Refer to the log console to inspect engineering errors or LLM schema stabilization faults.
                      </p>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-center p-6 space-y-4">
                      <Cpu className="h-12 w-12 text-cyan-500/30 animate-spin" />
                      <div className="space-y-1">
                        <h4 className="font-mono text-sm text-cyan-400">Compiling 3D Geometry</h4>
                        <p className="text-xs max-w-xs leading-relaxed">
                          PicoGK solid voxels are being generated via Boolean addition & subtraction...
                        </p>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Bottom Block: Mechanical Parameters Auditing Grid */}
              {selectedJob.status === "completed" && selectedJob.originalDimensions && selectedJob.finalDimensions && (
                <div className="glass-panel rounded-xl p-6 space-y-6">
                  
                  {/* Title & Metadata */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-mono text-sm font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center space-x-2">
                      <Database className="h-4 w-4 text-cyan-400" />
                      <span>DATA BRIDGE AUDITING METRICS</span>
                    </h3>
                    <div className="flex items-center space-x-4 text-xs font-mono">
                      <span>Method: <strong className="text-purple-400">{selectedJob.manufacturingMethod}</strong></span>
                      <span>Material: <strong className="text-cyan-400">{selectedJob.material}</strong></span>
                    </div>
                  </div>

                  {/* Comparative parameter cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {(() => {
                      const orig = JSON.parse(selectedJob.originalDimensions || "{}");
                      const final = JSON.parse(selectedJob.finalDimensions || "{}");
                      const keys = Object.keys(final);

                      return keys.map((key) => {
                        const oVal = orig[key];
                        const fVal = final[key];
                        const modified = isDimensionModified(key, oVal, fVal);

                        return (
                          <div
                            key={key}
                            className={`p-3 rounded-lg border transition-all ${
                              modified
                                ? "bg-amber-950/20 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.03)]"
                                : "bg-slate-900/40 border-slate-800/80"
                            }`}
                          >
                            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wide">
                              {formatKeyName(key)}
                            </span>
                            
                            <div className="flex items-baseline space-x-2 mt-1">
                              <span className="text-lg font-bold font-mono">
                                {Number(fVal).toFixed(2)}mm
                              </span>

                              {modified && (
                                <>
                                  <span className="text-xs text-slate-500 line-through">
                                    {Number(oVal).toFixed(2)}mm
                                  </span>
                                  <span className="text-[10px] font-mono bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded font-semibold flex items-center space-x-0.5">
                                    <AlertTriangle className="h-3 w-3 inline" />
                                    <span>ADJUSTED</span>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Notification banner on overrides */}
                  {(() => {
                    const orig = JSON.parse(selectedJob.originalDimensions || "{}");
                    const final = JSON.parse(selectedJob.finalDimensions || "{}");
                    const overridesApplied = Object.keys(final).some(k => isDimensionModified(k, orig[k], final[k]));
                    
                    if (overridesApplied) {
                      return (
                        <div className="bg-amber-950/20 border border-amber-900/60 p-4 rounded-lg flex items-start space-x-3 text-amber-300">
                          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                          <div className="text-xs leading-relaxed space-y-1">
                            <h5 className="font-mono font-bold uppercase tracking-wider">Physics Safety / Tolerances Applied</h5>
                            <p>
                              The C# compilation runtime adjusted your original parameters (highlighted in orange). Wall thicknesses have been scaled up to satisfy structural Hoop Stress and cantilever shear loads, and internal diameters have been expanded to offset print shrinkage.
                            </p>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="bg-emerald-950/20 border border-emerald-900/60 p-4 rounded-lg flex items-start space-x-3 text-emerald-300">
                          <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                          <div className="text-xs leading-relaxed space-y-1">
                            <h5 className="font-mono font-bold uppercase tracking-wider">All Parameters Safe</h5>
                            <p>
                              Your extracted dimensions fully satisfy the necessary structural safety limits. No mechanical overrides were triggered. Standard manufacturing tolerances have been applied.
                            </p>
                          </div>
                        </div>
                      );
                    }
                  })()}

                </div>
              )}

              {/* Conversational Design Modifier Chat */}
              {(selectedJob.status === "completed" || selectedJob.status === "failed") && (
                <form onSubmit={handleModifySubmit} className="glass-panel rounded-xl p-6 glow-card space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase flex items-center space-x-2">
                      <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
                      <span>Iterative Assistant — Modify Model Design</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      Modifying Version: v{getVersionTimeline().findIndex(t => t.jobId === selectedJob.jobId) + 1}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={modifyPrompt}
                      onChange={(e) => setModifyPrompt(e.target.value)}
                      placeholder='e.g. "add a smaller gear offset by 30mm" or "change the pipe length to 120mm"'
                      disabled={isSubmitting}
                      className="flex-grow bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 transition-all font-sans text-slate-100 placeholder-slate-500"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting || !modifyPrompt.trim()}
                      className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-mono font-bold text-xs py-3.5 px-6 rounded-xl flex items-center space-x-2 shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      <span>SEND MODIFICATION</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              )}

            </div>
          )
        )}
      </main>
      
    </div>
  );
}
