"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
  Layers,
  Trash2,
  Home,
  RefreshCw,
  Info,
  ShieldAlert,
  Sliders,
  Check,
  Gauge,
  Activity
} from "lucide-react";
import ThreeDViewer from "../../components/ThreeDViewer";

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

export default function Workspace() {
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

  // Check query params for template injection
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const templatePrompt = searchParams.get("prompt");
      if (templatePrompt) {
        setPrompt(templatePrompt);
        setIsCreating(true);
      }
    }
  }, []);

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

  const handleModifySubmit = async (e: React.FormEvent, inPlace: boolean = false) => {
    if (e) e.preventDefault();
    if (!modifyPrompt.trim() || !selectedJob) return;

    setIsSubmitting(true);

    try {
      if (inPlace) {
        const res = await fetch(`/api/jobs/${selectedJob.jobId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: modifyPrompt })
        });
        const data = await res.json();
        if (data.success) {
          setModifyPrompt("");
          await fetchJobs();
          
          // Re-set selected job with the pending state for in-place re-compilation
          setSelectedJob({
            ...selectedJob,
            prompt: `${selectedJob.prompt}, and then: ${modifyPrompt}`,
            status: "pending",
            progress: 0,
            logs: `[SYSTEM] Re-submitting job for in-place modifications.\n[USER UPDATE] ${modifyPrompt}\n`,
            outputFilePath: null
          });
        } else {
          alert(`Failed to update job: ${data.error}`);
        }
      } else {
        const formData = new FormData();
        formData.append("prompt", modifyPrompt);
        formData.append("parentId", selectedJob.jobId);

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
        } else {
          alert(`Failed to submit modification: ${data.error}`);
        }
      }
    } catch (err: any) {
      console.error("Modify submit error:", err);
      alert(`Failed to submit design modification: ${err.message}`);
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
          } else {
            setSelectedJob(null);
            setIsCreating(true);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job run? This will recursively delete all child iterations and permanently remove files from the VPS.")) {
      return;
    }
    
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        await fetchJobs();
      } else {
        alert(`Failed to delete job: ${data.error}`);
      }
    } catch (err: any) {
      console.error("Delete job error:", err);
      alert(`Failed to delete job: ${err.message}`);
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
      case "completed": return "text-emerald-400 bg-emerald-950/40 border-emerald-900/60";
      case "failed": return "text-red-400 bg-red-950/40 border-red-900/60";
      case "compiling": return "text-purple-400 bg-purple-950/40 border-purple-900/60 animate-pulse";
      case "researching": return "text-cyan-400 bg-cyan-950/40 border-cyan-900/60";
      default: return "text-slate-400 bg-slate-900/60 border-slate-800/80";
    }
  };

  const formatKeyName = (key: string) => {
    return key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
  };

  const getCaseInsensitiveValue = (obj: any, searchKey: string) => {
    if (!obj) return undefined;
    const lowerKey = searchKey.toLowerCase();
    const foundKey = Object.keys(obj).find(k => k.toLowerCase() === lowerKey);
    return foundKey ? obj[foundKey] : undefined;
  };

  const formatValue = (key: string, val: number) => {
    const k = key.toLowerCase();
    if (k === "toothcount") {
      return `${Math.round(val)}`;
    }
    if (k === "module") {
      return `${Number(val).toFixed(2)}`;
    }
    if (k === "pressurepsi") {
      return `${Number(val).toFixed(1)} PSI`;
    }
    if (k === "loadnewtons") {
      return `${Number(val).toFixed(0)} N`;
    }
    return `${Number(val).toFixed(2)}mm`;
  };

  const isDimensionModified = (key: string, origVal: number | undefined, finalVal: number | undefined) => {
    if (origVal === undefined || finalVal === undefined) return false;
    return Math.abs(Number(origVal) - Number(finalVal)) > 0.001;
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-screen text-slate-100 font-sans relative">
      
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 cyan-glow-orb pointer-events-none -z-10 opacity-50" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 purple-glow-orb pointer-events-none -z-10 opacity-50" />
      <div className="dot-grid" />

      {/* Sidebar: Lists past generations */}
      <aside className="w-full md:w-80 glass-panel border-r border-slate-800/60 flex flex-col shrink-0 md:sticky md:top-0 md:h-screen z-10 bg-slate-950/60">
        
        {/* Header Branding */}
        <div className="p-5 border-b border-slate-900 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/30 group-hover:border-cyan-400/80 transition-all">
                <Layers className="h-5 w-5 text-cyan-400" />
              </div>
              <span className="font-mono font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 group-hover:from-cyan-300 group-hover:to-purple-300 transition-all text-sm">
                VELOLABS CEM
              </span>
            </Link>
            <div className="flex space-x-2">
              <Link
                href="/"
                className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:bg-slate-800/80 hover:border-slate-600/80 text-slate-400 hover:text-slate-100 transition-all cursor-pointer"
                title="Return to Home"
              >
                <Home className="h-4 w-4" />
              </Link>
              <button
                onClick={() => {
                  setSelectedJob(null);
                  setIsCreating(true);
                }}
                className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-900/60 hover:bg-cyan-900/60 hover:border-cyan-400/80 text-cyan-400 transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.1)]"
                title="Start New Generation"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Sidebar telemetry metrics */}
          <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-500 bg-slate-950 p-2 rounded-lg border border-slate-900/60">
            <div className="flex justify-between">
              <span>SYS.QUEUE:</span>
              <span className="text-emerald-400 font-bold">OK</span>
            </div>
            <div className="flex justify-between border-l border-slate-900 pl-2">
              <span>VOXELS:</span>
              <span className="text-cyan-400 font-bold">5.0M</span>
            </div>
          </div>
        </div>

        {/* Search / List header */}
        <div className="px-5 py-3 text-[10px] font-bold font-mono tracking-widest text-slate-500 border-b border-slate-900 flex justify-between items-center bg-slate-950/30">
          <span>COMPILATION RUNS</span>
          <span className="bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 text-slate-400 font-bold">{jobs.length} runs</span>
        </div>

        {/* Jobs list */}
        <div className="flex-grow overflow-y-auto divide-y divide-slate-900/40 p-3 space-y-2">
          {jobs.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs font-mono border border-dashed border-slate-900 rounded-xl bg-slate-950/20">
              No historical runs found
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.jobId}
                onClick={() => {
                  setSelectedJob(job);
                  setIsCreating(false);
                }}
                className={`group w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                  selectedJob?.jobId === job.jobId
                    ? "bg-slate-900/50 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.08)]"
                    : "bg-transparent border-transparent hover:bg-slate-900/20 hover:border-slate-850"
                }`}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-mono text-[9px] text-slate-500 truncate max-w-[125px]">
                    #{job.jobId.slice(0, 12)}...
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-md border uppercase font-mono tracking-wider font-semibold ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteJob(job.jobId);
                      }}
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-all cursor-pointer"
                      title="Delete Run"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-300 font-medium line-clamp-2 leading-relaxed">
                  {job.prompt}
                </p>
                {job.componentType && (
                  <div className="mt-2.5 flex items-center space-x-2 text-[9px] font-mono text-slate-400">
                    <span className="bg-slate-950/80 px-2 py-0.5 rounded border border-slate-900/80 text-cyan-400/80 uppercase tracking-wider font-bold">
                      {job.componentType.replace("_", " ")}
                    </span>
                    <span>•</span>
                    <span>{job.material}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-grow flex flex-col bg-slate-950/10 min-h-screen z-10">
        
        {/* Form to submit new compilation */}
        {isCreating ? (
          <div className="max-w-3xl mx-auto w-full p-6 md:py-16 space-y-8 animate-fade-in-up">
            
            {/* Platform Banner */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center space-x-2 bg-cyan-950/30 border border-cyan-800/40 px-4 py-1.5 rounded-full text-cyan-400 text-[10px] font-mono shadow-[0_0_15px_rgba(6,182,212,0.05)]">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                <span>Next-Gen Autonomous Voxel Engine</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-300 to-purple-400 font-black">
                  Computational Engineering Platform
                </span>
              </h1>
              <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                Provide design parameters or upload a manufacturer datasheet. The AI agent extracts dimensions, runs structural overrides, and compiles a watertight `.3mf` print file.
              </p>
            </div>

            {/* Ingestion Glass Form */}
            <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 md:p-8 glow-card space-y-6">
              
              {/* Text Prompt */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold font-mono tracking-widest text-slate-400 uppercase">
                  1. Define Component Intent
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder='e.g., "Design a heavy bracket to support 450N load, made of SLM Titanium, width 40mm, length 80mm with a 5mm screw hole" or "NEMA 17 bracket housing made of FDM plastic"'
                  rows={4}
                  className="w-full bg-slate-950/80 border border-slate-900/60 rounded-xl p-4 text-sm font-sans focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 transition-all leading-relaxed placeholder-slate-500 text-slate-100"
                />
              </div>

              {/* Datasheet Upload Area */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold font-mono tracking-widest text-slate-400 uppercase">
                  2. Upload PDF Datasheet (Optional)
                </label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                    dragActive 
                      ? "border-cyan-400 bg-cyan-950/20" 
                      : "border-slate-800/80 bg-slate-950/40 hover:bg-slate-900/20 hover:border-slate-700"
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
                  <div className={`p-3 rounded-full mb-3 ${file ? "bg-cyan-950/40 text-cyan-400 border border-cyan-800/40" : "bg-slate-900/60 text-slate-500 border border-slate-800/40"}`}>
                    <Upload className="h-6 w-6" />
                  </div>
                  {file ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-cyan-400">{file.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-slate-300">Drag & drop your PDF datasheet here</p>
                      <p className="text-xs text-slate-500 mt-1.5 font-mono">Supports standard engineering table layouts</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isSubmitting || !prompt.trim()}
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white py-4 px-6 rounded-xl text-xs font-bold font-mono tracking-wider flex items-center justify-center space-x-2.5 transition-all shadow-[0_0_20px_rgba(6,182,212,0.15)] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_25px_rgba(6,182,212,0.25)] cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Cpu className="h-4 w-4 animate-spin text-cyan-250" />
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
            <div className="p-6 md:p-8 space-y-6 flex-grow flex flex-col max-w-6xl mx-auto w-full animate-fade-in-up">
              
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
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-900 pb-5 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500">
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-400">JOB RUN</span>
                    <span>ID:</span>
                    <span className="text-cyan-400 font-bold font-mono">{selectedJob.jobId}</span>
                  </div>
                  <h2 className="text-lg md:text-xl font-bold font-sans tracking-tight text-slate-100">
                    {selectedJob.prompt}
                  </h2>
                </div>

                {selectedJob.outputFilePath && (
                  <a
                    href={selectedJob.outputFilePath}
                    download
                    className="self-start md:self-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-mono font-bold text-xs py-2.5 px-4.5 rounded-xl flex items-center space-x-2 border border-emerald-400/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all cursor-pointer hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                  >
                    <Download className="h-4 w-4" />
                    <span>DOWNLOAD PRODUCTION 3MF</span>
                  </a>
                )}
              </div>

              {/* Progress Tracker Stepper */}
              <div className="glass-panel rounded-2xl p-5 border border-slate-800/60 bg-slate-900/30">
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-2.5">
                  <span className="tracking-wider">SYSTEM PIPELINE TRACKER</span>
                  <span className="text-cyan-400 font-bold">{selectedJob.progress}%</span>
                </div>
                <div className="w-full bg-slate-950 border border-slate-800/60 h-2.5 rounded-full overflow-hidden mb-5">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-brand-purple transition-all duration-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                    style={{ width: `${selectedJob.progress}%` }}
                  />
                </div>
                
                {/* Stepper Status Indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                  <div className="flex items-center space-x-2.5">
                    <div className={`h-3 w-3 rounded-full transition-all ${
                      selectedJob.progress >= 10 ? "bg-cyan-400 step-glow-cyan" : "bg-slate-900 border border-slate-800"
                    }`} />
                    <span className="text-xs font-mono text-slate-300">1. Ingest Prompt</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <div className={`h-3 w-3 rounded-full transition-all ${
                      selectedJob.progress >= 40 ? "bg-cyan-400 step-glow-cyan" : "bg-slate-900 border border-slate-800"
                    }`} />
                    <span className="text-xs font-mono text-slate-300">2. Research Agent</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <div className={`h-3 w-3 rounded-full transition-all ${
                      selectedJob.progress >= 60 ? "bg-purple-400 step-glow-purple" : "bg-slate-900 border border-slate-800"
                    }`} />
                    <span className="text-xs font-mono text-slate-300">3. Physics Check</span>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <div className={`h-3 w-3 rounded-full transition-all ${
                      selectedJob.progress >= 100 
                        ? (selectedJob.status === "failed" ? "bg-red-400 shadow-[0_0_12px_rgba(239,68,68,0.6)]" : "bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]") 
                        : "bg-slate-900 border border-slate-800"
                    }`} />
                    <span className="text-xs font-mono text-slate-300">4. Voxel Output</span>
                  </div>
                </div>
              </div>

              {/* Dynamic split pane */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                {/* Left Side: Real-time Terminal Log Console */}
                <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80 flex flex-col h-[420px] shadow-2xl relative">
                  {/* HUD decorative corners */}
                  <div className="hud-corner hud-tl" />
                  <div className="hud-corner hud-tr" />
                  <div className="hud-corner hud-bl" />
                  <div className="hud-corner hud-br" />
                  
                  <div className="bg-slate-950/80 border-b border-slate-900 px-4 py-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center space-x-2">
                      <TerminalIcon className="h-4 w-4 text-cyan-400" />
                      <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                        COMPILER LOG CONSOLE
                      </span>
                    </div>
                    {/* Glowing status */}
                    <div className="flex items-center space-x-2.5 bg-slate-900/60 px-2.5 py-1 rounded-md border border-slate-850">
                      <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">{selectedJob.status}</span>
                    </div>
                  </div>
                  <div className="flex-grow p-4 overflow-y-auto font-mono text-[11px] leading-relaxed bg-[#020408] space-y-1.5 select-text terminal-accent-glow">
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
                    {/* Pulsing CLI caret indicator */}
                    <div className="text-cyan-400 font-bold flex items-center">
                      <span>velolabs-cem:~$&nbsp;</span>
                      <span className="w-1.5 h-3 bg-cyan-400 animate-pulse inline-block" />
                    </div>
                    <div ref={logsEndRef} />
                  </div>
                </div>

                {/* Right Side: Interactive 3D Model Canvas Viewer */}
                <div className="glass-panel rounded-2xl overflow-hidden h-[420px] shadow-2xl relative cyber-scanline">
                  {/* HUD decorative corners */}
                  <div className="hud-corner hud-tl" />
                  <div className="hud-corner hud-tr" />
                  <div className="hud-corner hud-bl" />
                  <div className="hud-corner hud-br" />
                  
                  {selectedJob.status === "completed" && selectedJob.finalDimensions ? (
                    <ThreeDViewer
                      componentType={selectedJob.componentType!}
                      dimensions={selectedJob.finalDimensions}
                      outputFilePath={selectedJob.outputFilePath}
                    />
                  ) : selectedJob.status === "failed" ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-center p-6 space-y-3 bg-slate-950/60">
                      <div className="p-3 rounded-full bg-red-950/30 border border-red-900/60 text-red-500/80 animate-pulse">
                        <AlertTriangle className="h-8 w-8" />
                      </div>
                      <h4 className="font-mono text-sm text-red-400 uppercase tracking-widest font-bold">Compilation Failed</h4>
                      <p className="text-xs max-w-xs leading-relaxed text-slate-400">
                        Refer to the log console to inspect engineering errors or LLM schema stabilization faults.
                      </p>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-center p-6 space-y-4 bg-slate-950/60">
                      <div className="p-4 rounded-full bg-cyan-950/20 border border-cyan-800/30 text-cyan-400/80 relative">
                        <Cpu className="h-8 w-8 animate-spin" />
                        <span className="absolute inset-0 rounded-full border border-cyan-400 animate-ping opacity-25" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-mono text-sm text-cyan-400 uppercase tracking-wider font-bold">Compiling 3D Geometry</h4>
                        <p className="text-xs max-w-xs leading-relaxed text-slate-400">
                          PicoGK solid voxels are being generated via Boolean addition & subtraction...
                        </p>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Bottom Block: Mechanical Parameters Auditing Grid */}
              {selectedJob.status === "completed" && selectedJob.originalDimensions && selectedJob.finalDimensions && (
                <div className="glass-panel rounded-2xl p-6 space-y-6 border border-slate-800/80 shadow-xl bg-slate-900/20">
                  
                  {/* Title & Metadata */}
                  <div className="flex items-center justify-between border-b border-slate-850 pb-4">
                    <h3 className="font-mono text-xs font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center space-x-2 uppercase">
                      <Database className="h-4 w-4 text-cyan-400" />
                      <span>DATA BRIDGE AUDITING METRICS</span>
                    </h3>
                    <div className="flex items-center space-x-4 text-xs font-mono">
                      <span>Method: <strong className="text-purple-400 font-bold bg-purple-950/40 px-2 py-0.5 rounded border border-purple-900/40">{selectedJob.manufacturingMethod}</strong></span>
                      <span>Material: <strong className="text-cyan-400 font-bold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-900/40">{selectedJob.material}</strong></span>
                    </div>
                  </div>

                  {/* Comparative parameter cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {(() => {
                      const orig = JSON.parse(selectedJob.originalDimensions || "{}");
                      const final = JSON.parse(selectedJob.finalDimensions || "{}");
                      
                      // Filter keys to exclude irrelevant properties that are 0 in both original and final schemas
                      const keys = Object.keys(final).filter((key) => {
                        const oVal = getCaseInsensitiveValue(orig, key);
                        const fVal = final[key];
                        return (oVal !== undefined && Number(oVal) > 0) || (fVal !== undefined && Number(fVal) > 0);
                      });

                      return keys.map((key) => {
                        const oVal = getCaseInsensitiveValue(orig, key);
                        const fVal = final[key];
                        const modified = isDimensionModified(key, oVal, fVal);

                        // Visual stats display comparison ratio
                        const percentageChange = oVal && Number(oVal) > 0 
                          ? Math.min(100, Math.max(10, Math.round((Number(fVal) / Number(oVal)) * 100))) 
                          : 100;

                        return (
                          <div
                            key={key}
                            className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                              modified
                                ? "bg-amber-950/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.02)]"
                                : "bg-slate-900/30 border-slate-800/80 hover:border-slate-700/80"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="block text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                                {formatKeyName(key)}
                              </span>
                              {!modified ? (
                                <span className="p-0.5 rounded-full bg-emerald-950/30 border border-emerald-900/40 text-emerald-450">
                                  <Check className="h-3 w-3" />
                                </span>
                              ) : (
                                <span className="p-0.5 rounded-full bg-amber-955/30 border border-amber-900/40 text-amber-450 animate-pulse">
                                  <Sliders className="h-3 w-3" />
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-baseline space-x-2.5 mt-3 mb-2.5">
                              <span className="text-base font-bold font-mono text-slate-100">
                                {formatValue(key, Number(fVal))}
                              </span>

                              {modified && oVal !== undefined && (
                                <>
                                  <span className="text-xs text-slate-500 line-through font-mono">
                                    {formatValue(key, Number(oVal))}
                                  </span>
                                  <span className="text-[8px] font-mono bg-amber-500/10 text-amber-450 px-2 py-0.5 rounded border border-amber-900/40 font-bold tracking-wider uppercase">
                                    ADJUSTED
                                  </span>
                                </>
                              )}
                            </div>

                            {/* HUD scale indicator graph */}
                            <div className="w-full bg-slate-950/80 h-1 rounded-full overflow-hidden mt-1">
                              <div 
                                className={`h-full rounded-full ${modified ? "bg-amber-550" : "bg-cyan-550"}`}
                                style={{ width: `${percentageChange}%` }}
                              />
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
                    const overridesApplied = Object.keys(final).some((k) => {
                      const oVal = getCaseInsensitiveValue(orig, k);
                      return isDimensionModified(k, oVal, final[k]);
                    });
                    
                    if (overridesApplied) {
                      return (
                        <div className="bg-amber-950/10 border border-amber-900/60 p-4 rounded-xl flex items-start space-x-3 text-amber-300">
                          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                          <div className="text-xs leading-relaxed space-y-1">
                            <h5 className="font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5">
                              <ShieldAlert className="h-4 w-4 inline text-amber-400" />
                              <span>Physics Safety / Tolerances Applied</span>
                            </h5>
                            <p className="text-slate-400">
                              The C# compilation runtime adjusted your original parameters (highlighted in orange). Wall thicknesses have been scaled up to satisfy structural Hoop Stress and cantilever shear loads, and internal diameters have been expanded to offset print shrinkage.
                            </p>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="bg-emerald-950/10 border border-emerald-900/60 p-4 rounded-xl flex items-start space-x-3 text-emerald-300">
                          <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                          <div className="text-xs leading-relaxed space-y-1">
                            <h5 className="font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5">
                              <CheckCircle className="h-4 w-4 inline text-emerald-400" />
                              <span>All Parameters Safe</span>
                            </h5>
                            <p className="text-slate-400">
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
                <form onSubmit={(e) => handleModifySubmit(e, false)} className="glass-panel rounded-2xl p-5 glow-card space-y-4 border border-slate-800/80 bg-slate-900/20 shadow-xl">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold font-mono tracking-widest text-slate-400 uppercase flex items-center space-x-2">
                      <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
                      <span>Iterative Assistant — Modify Model Design</span>
                    </label>
                    <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-950 border border-slate-850 px-2.5 py-0.5 rounded-md tracking-wider">
                      MODIFING VERSION: v{getVersionTimeline().findIndex(t => t.jobId === selectedJob.jobId) + 1}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                      type="text"
                      value={modifyPrompt}
                      onChange={(e) => setModifyPrompt(e.target.value)}
                      placeholder='e.g. "add a smaller gear offset by 30mm" or "change the pipe length to 120mm"'
                      disabled={isSubmitting}
                      className="flex-grow bg-slate-950/80 border border-slate-800/60 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 transition-all font-sans text-slate-100 placeholder-slate-500"
                    />
                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={(e) => handleModifySubmit(e as any, true)}
                        disabled={isSubmitting || !modifyPrompt.trim()}
                        className="bg-slate-900/60 border border-slate-850 hover:border-slate-650 hover:bg-slate-850 text-slate-200 font-mono font-bold text-xs py-3.5 px-5 rounded-xl flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        title="Update this version in-place"
                      >
                        <span>EDIT CURRENT</span>
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !modifyPrompt.trim()}
                        className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-mono font-bold text-xs py-3.5 px-6 rounded-xl flex items-center space-x-2 shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        title="Create a new version iteration"
                      >
                        <span>NEW VERSION</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
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
