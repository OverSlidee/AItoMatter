"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Layers, 
  Cpu, 
  Sparkles, 
  Activity, 
  Gauge,
  Binary 
} from "lucide-react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

function HeaderButton({ label, start, end, smoothScroll, onClick }: { label: string, start: number, end: number, smoothScroll: any, onClick: () => void }) {
  const color = useTransform(
    smoothScroll,
    [start - 0.02, start, end, end + 0.02],
    ["#a1a1aa", "#f59e0b", "#f59e0b", "#a1a1aa"] // zinc-400 to amber-500
  );
  
  return (
    <button onClick={onClick} className="cursor-pointer transition-colors text-[9px] font-mono tracking-widest">
      <motion.span style={{ color }}>{label}</motion.span>
    </button>
  );
}

function DotIndicator({ item, smoothScroll, onClick }: { item: any, smoothScroll: any, onClick: () => void }) {
  const scale = useTransform(
    smoothScroll,
    [item.activeStart - 0.02, item.activeStart, item.activeEnd, item.activeEnd + 0.02],
    [1, 1.25, 1.25, 1]
  );
  
  const color = useTransform(
    smoothScroll,
    [item.activeStart - 0.02, item.activeStart, item.activeEnd, item.activeEnd + 0.02],
    ["#3f3f46", "#f59e0b", "#f59e0b", "#3f3f46"]
  );
  
  const opacity = useTransform(
    smoothScroll,
    [item.activeStart - 0.02, item.activeStart, item.activeEnd, item.activeEnd + 0.02],
    [0.4, 1, 1, 0.4]
  );

  return (
    <button 
      onClick={onClick} 
      className="group flex items-center space-x-4 justify-end focus:outline-none cursor-pointer text-right"
    >
      <span className="text-[8px] font-mono tracking-widest text-zinc-500 group-hover:text-amber-500 transition-all opacity-0 group-hover:opacity-100 uppercase pointer-events-none transform translate-x-2 group-hover:translate-x-0">
        {item.label}
      </span>
      <motion.div
        style={{ scale, backgroundColor: color, opacity }}
        className="w-2.5 h-2.5 rounded-full border border-zinc-950 shadow-sm transition-shadow group-hover:shadow-[0_0_8px_rgba(245,158,11,0.5)]"
      />
    </button>
  );
}

export default function LandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Real-time direct DOM refs for HUD elements (prevents React re-renders for fluid 60/120fps operation)
  const timecodeRef = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const scrollPctRef = useRef<HTMLSpanElement>(null);
  const deviationRef = useRef<HTMLSpanElement>(null);
  const tensionRef = useRef<HTMLSpanElement>(null);
  const graphPathRef = useRef<SVGPathElement>(null);

  // Diagnostics HUD collapse state
  const [hudBypass, setHudBypass] = useState(false);

  // Framer Motion Scroll Progress Indicator
  const { scrollYProgress } = useScroll();
  
  // Custom spring physics to mimic the deceleration and inertia of oryzo.ai
  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 20, // Lower stiffness for a heavier, cinematic feel
    damping: 24,    // Damps out micro-stutters and adds smooth ease-out inertia
    mass: 0.8,
    restDelta: 0.0001
  });

  const scrollToSection = (progress: number) => {
    const targetY = progress * (document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({
      top: targetY,
      behavior: "smooth"
    });
  };

  // Beat 0: Intro (0.0 to 0.12)
  const opacity0 = useTransform(smoothScroll, [0.0, 0.08, 0.12], [1, 1, 0]);
  const y0 = useTransform(smoothScroll, [0.0, 0.08, 0.12], [0, 0, -40]);
  const blur0 = useTransform(smoothScroll, [0.0, 0.08, 0.12], ["blur(0px)", "blur(0px)", "blur(12px)"]);

  // Beat 1: Aether Reveal (0.12 to 0.32)
  const opacity1 = useTransform(smoothScroll, [0.10, 0.16, 0.28, 0.32], [0, 1, 1, 0]);
  const y1 = useTransform(smoothScroll, [0.10, 0.16, 0.28, 0.32], [40, 0, 0, -40]);
  const blur1 = useTransform(smoothScroll, [0.10, 0.16, 0.28, 0.32], ["blur(12px)", "blur(0px)", "blur(0px)", "blur(12px)"]);

  // Beat 2: Ingest (0.32 to 0.50)
  const opacity2 = useTransform(smoothScroll, [0.30, 0.36, 0.46, 0.50], [0, 1, 1, 0]);
  const y2 = useTransform(smoothScroll, [0.30, 0.36, 0.46, 0.50], [40, 0, 0, -40]);
  const blur2 = useTransform(smoothScroll, [0.30, 0.36, 0.46, 0.50], ["blur(12px)", "blur(0px)", "blur(0px)", "blur(12px)"]);

  // Beat 3: Physics (0.50 to 0.68)
  const opacity3 = useTransform(smoothScroll, [0.48, 0.54, 0.64, 0.68], [0, 1, 1, 0]);
  const y3 = useTransform(smoothScroll, [0.48, 0.54, 0.64, 0.68], [40, 0, 0, -40]);
  const blur3 = useTransform(smoothScroll, [0.48, 0.54, 0.64, 0.68], ["blur(12px)", "blur(0px)", "blur(0px)", "blur(12px)"]);

  // Beat 4: Kinematics (0.68 to 0.84)
  const opacity4 = useTransform(smoothScroll, [0.66, 0.72, 0.80, 0.84], [0, 1, 1, 0]);
  const y4 = useTransform(smoothScroll, [0.66, 0.72, 0.80, 0.84], [40, 0, 0, -40]);
  const blur4 = useTransform(smoothScroll, [0.66, 0.72, 0.80, 0.84], ["blur(12px)", "blur(0px)", "blur(0px)", "blur(12px)"]);

  // Beat 5: Workspace (0.84 to 1.0)
  const opacity5 = useTransform(smoothScroll, [0.82, 0.88, 1.0], [0, 1, 1]);
  const y5 = useTransform(smoothScroll, [0.82, 0.88, 1.0], [40, 0, 0]);
  const blur5 = useTransform(smoothScroll, [0.82, 0.88, 1.0], ["blur(12px)", "blur(0px)", "blur(0px)"]);

  // Pointer event mappings to prevent background overlay clicks when hidden
  const pointer0 = useTransform(opacity0, (v) => v > 0.15 ? "auto" : "none");
  const pointer1 = useTransform(opacity1, (v) => v > 0.15 ? "auto" : "none");
  const pointer2 = useTransform(opacity2, (v) => v > 0.15 ? "auto" : "none");
  const pointer3 = useTransform(opacity3, (v) => v > 0.15 ? "auto" : "none");
  const pointer4 = useTransform(opacity4, (v) => v > 0.15 ? "auto" : "none");
  const pointer5 = useTransform(opacity5, (v) => v > 0.15 ? "auto" : "none");

  // Scroll indicator chevron opacity (only active in intro block)
  const scrollIndicatorOpacity = useTransform(smoothScroll, [0.0, 0.05], [1, 0]);

  // Ambient glow shifts linked to spring progress
  const orb1Scale = useTransform(smoothScroll, [0, 0.5, 1], [1, 1.3, 1]);
  const orb1Opacity = useTransform(smoothScroll, [0, 0.3, 0.7, 1], [0.25, 0.4, 0.3, 0.2]);
  const orb1Y = useTransform(smoothScroll, [0, 1], ["0px", "100px"]);

  const orb2Scale = useTransform(smoothScroll, [0, 0.5, 1], [1, 1.2, 1.5]);
  const orb2Opacity = useTransform(smoothScroll, [0, 0.4, 0.8, 1], [0.15, 0.3, 0.2, 0.3]);
  const orb2X = useTransform(smoothScroll, [0, 1], ["0px", "-150px"]);

  // 3D tilted grid shift
  const gridY = useTransform(smoothScroll, [0, 1], ["0px", "-120px"]);
  const gridOpacity = useTransform(smoothScroll, [0, 0.5, 1], [0.45, 0.2, 0.45]);

  // Eased Video Scrubbing Engine (Awwwards-Level)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animFrame: number;
    let smoothTime = 0;
    let lastTime = 0;
    let lastScroll = 0;

    const updateVideo = () => {
      animFrame = requestAnimationFrame(updateVideo);
      
      const duration = 10.0; // Hardcoded length in seconds (10s)
      const targetScroll = smoothScroll.get();
      const targetTime = targetScroll * duration;

      // Filter micro-jittering in browsers by easing targetTime
      smoothTime += (targetTime - smoothTime) * 0.10;
      
      const boundedTime = Math.max(0, Math.min(duration - 0.02, smoothTime));

      const now = performance.now();
      
      // Throttle seeking slightly to allow GPU decoder to load frames smoothly
      if (now - lastTime > 20) { 
        if (Math.abs(video.currentTime - boundedTime) > 0.01 && !video.seeking) {
          video.currentTime = boundedTime;
          lastTime = now;
        }
      }

      // Calculate scroll speed
      const speed = Math.abs(targetScroll - lastScroll);
      lastScroll = targetScroll;

      // Update HUD telemetry directly in the DOM to avoid triggering React re-renders at 60Hz/120Hz
      if (timecodeRef.current) {
        const secs = Math.floor(boundedTime);
        const ms = Math.floor((boundedTime % 1) * 100);
        timecodeRef.current.innerText = `00:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
      }

      if (frameRef.current) {
        const frameIndex = Math.floor(boundedTime * 30); // 30 fps for standard frame indices
        frameRef.current.innerText = `FR / ${frameIndex.toString().padStart(3, '0')}`;
      }

      if (scrollPctRef.current) {
        scrollPctRef.current.innerText = `${(targetScroll * 100).toFixed(1)}%`;
      }

      if (deviationRef.current) {
        const baseDeviation = 1.0 + Math.sin(boundedTime * 2.5) * 0.12;
        const flicker = (Math.random() - 0.5) * 0.008;
        deviationRef.current.innerText = `${(baseDeviation + flicker).toFixed(4)} σ`;
      }

      if (tensionRef.current) {
        let baseTension = 0.0;
        if (targetScroll > 0.12 && targetScroll <= 0.32) baseTension = 14.2;
        else if (targetScroll > 0.32 && targetScroll <= 0.50) baseTension = 48.7;
        else if (targetScroll > 0.50 && targetScroll <= 0.68) baseTension = 192.3; // Physics stress peaks
        else if (targetScroll > 0.68 && targetScroll <= 0.84) baseTension = 97.4;
        else if (targetScroll > 0.84) baseTension = 4.8;

        const currentTensionText = tensionRef.current.innerText;
        const currentTensionVal = parseFloat(currentTensionText) || 0;
        const targetTensionVal = baseTension + (Math.random() * 1.5);
        const nextTensionVal = currentTensionVal + (targetTensionVal - currentTensionVal) * 0.12;
        tensionRef.current.innerText = `${nextTensionVal.toFixed(2)} GPa`;
      }

      if (statusRef.current) {
        let statusMsg = "STANDBY";
        if (targetScroll < 0.12) {
          statusMsg = "INTRO COGNITION";
        } else if (targetScroll >= 0.12 && targetScroll < 0.32) {
          statusMsg = "AETHER CORE INITIALIZATION";
        } else if (targetScroll >= 0.32 && targetScroll < 0.50) {
          statusMsg = "DATASHEET INGESTION PIPELINE";
        } else if (targetScroll >= 0.50 && targetScroll < 0.68) {
          statusMsg = "PHYSICS AUDIT / STRESS RESOLVER";
        } else if (targetScroll >= 0.68 && targetScroll < 0.84) {
          statusMsg = "KINEMATIC CLEARANCE MATRIX";
        } else {
          statusMsg = "WATERTIGHT CAD COMPILED";
        }
        statusRef.current.innerText = statusMsg;
      }

      if (graphPathRef.current) {
        const points = [];
        const w = 150;
        const h = 40;
        const centerY = h / 2;
        const amplitude = 1.5 + speed * 1200 + Math.sin(now * 0.004) * 3;
        const frequency = 0.18 + speed * 3.5;
        
        for (let i = 0; i <= 15; i++) {
          const x = (i / 15) * w;
          const y = centerY + Math.sin(i * frequency + now * 0.008) * amplitude;
          points.push(`${x},${y}`);
        }
        graphPathRef.current.setAttribute("d", `M ${points.join(" L ")}`);
      }
    };

    const handleLoadedMetadata = () => {
      video.currentTime = 0;
    };

    if (video.readyState >= 1) {
      handleLoadedMetadata();
    } else {
      video.addEventListener("loadedmetadata", handleLoadedMetadata);
    }

    updateVideo();

    return () => {
      cancelAnimationFrame(animFrame);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [smoothScroll]);

  // Metallic Text Shadow for readability over glowing video core
  const metallicShadow = {
    textShadow: "0 0 35px rgba(0,0,0,0.95), 0 4px 12px rgba(0,0,0,0.85)"
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen text-zinc-100 relative bg-[#09090b] overflow-hidden">
      
      {/* Cinematic Organic Noise Overlay */}
      <div className="noise-overlay" />

      {/* Scroll Progress Bar at the top of the viewport */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-amber-500 origin-left z-50"
        style={{ scaleX: smoothScroll }}
      />

      {/* Subtle Background Parallax Ambient Bronze Orbs & Grids */}
      <motion.div 
        style={{ scale: orb1Scale, opacity: orb1Opacity, y: orb1Y }}
        className="fixed -top-20 -left-20 w-[600px] h-[600px] bronze-glow-orb pointer-events-none z-10" 
      />
      <motion.div 
        style={{ scale: orb2Scale, opacity: orb2Opacity, x: orb2X }}
        className="fixed -bottom-20 -right-20 w-[600px] h-[600px] copper-glow-orb pointer-events-none z-10" 
      />
      <motion.div 
        style={{ y: gridY, opacity: gridOpacity, perspective: 1000, rotateX: 45 }}
        className="dot-grid fixed inset-0 pointer-events-none z-10 origin-center" 
      />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 border-b border-zinc-900 bg-zinc-950/60 backdrop-blur-xl z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-amber-550 transition-all shadow-md">
              <Layers className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono font-extrabold tracking-widest text-zinc-200 transition-all text-sm leading-none">
                VELOLABS
              </span>
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-1">Autonomous CAD Engine</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8 text-[10px] font-mono tracking-widest text-zinc-400">
            <HeaderButton label="Intro" start={0.0} end={0.12} smoothScroll={smoothScroll} onClick={() => scrollToSection(0.0)} />
            <HeaderButton label="Aether" start={0.12} end={0.32} smoothScroll={smoothScroll} onClick={() => scrollToSection(0.22)} />
            <HeaderButton label="01 / Ingest" start={0.32} end={0.50} smoothScroll={smoothScroll} onClick={() => scrollToSection(0.41)} />
            <HeaderButton label="02 / Audit" start={0.50} end={0.68} smoothScroll={smoothScroll} onClick={() => scrollToSection(0.59)} />
            <HeaderButton label="03 / Solver" start={0.68} end={0.84} smoothScroll={smoothScroll} onClick={() => scrollToSection(0.77)} />
            <HeaderButton label="04 / Workspace" start={0.84} end={1.0} smoothScroll={smoothScroll} onClick={() => scrollToSection(0.95)} />
          </nav>
          
          <div>
            <Link
              href="/workspace"
              className="px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-550 text-amber-500 hover:text-amber-400 text-xs font-bold font-mono tracking-wider transition-all flex items-center space-x-2 cursor-pointer shadow-sm"
            >
              <span>LAUNCH WORKSPACE</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* FULL-SCREEN FIXED VIDEO CONTAINER */}
      <div className="fixed inset-0 w-screen h-screen z-0 pointer-events-none flex items-center justify-center overflow-hidden bg-[#09090b]">
        {/* HUD backdrop elements centered under the video */}
        <div className="absolute w-[95vw] h-[95vw] lg:w-[60vw] lg:h-[60vw] rounded-full border border-zinc-900/35 pointer-events-none z-0 animate-spin-slow opacity-25" />
        <div className="absolute w-[75vw] h-[75vw] lg:w-[45vw] lg:h-[45vw] rounded-full border border-dashed border-amber-500/5 pointer-events-none z-0 animate-pulse-slow" />
        
        <video
          ref={videoRef}
          src="/neural_core.mp4"
          preload="auto"
          muted
          playsInline
          className="w-full h-full object-contain relative z-10 opacity-70 mix-blend-screen"
          style={{ filter: "contrast(1.15) brightness(0.95)" }}
        />
      </div>

      {/* CENTERED FIXED SCROLLYTELLING OVERLAY CONTAINER */}
      <div className="fixed inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="max-w-4xl mx-auto px-6 w-full flex flex-col items-center justify-center text-center relative min-h-[450px]">
          
          {/* Beat 0: Intro */}
          <motion.div 
            style={{ opacity: opacity0, y: y0, filter: blur0, pointerEvents: pointer0 }} 
            className="space-y-6 absolute flex flex-col items-center justify-center w-full px-4"
          >
            <div className="inline-flex items-center space-x-2 bg-zinc-900/60 border border-zinc-850 px-4 py-1.5 rounded-full text-amber-550 text-[10px] font-mono shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <span>COMPUTATIONAL ENGINEERING EXPERIMENT</span>
            </div>
            <h1 
              style={metallicShadow}
              className="text-4xl md:text-6xl font-extrabold tracking-[0.2em] leading-none text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-400 to-zinc-200 uppercase"
            >
              INTRODUCED BY VELOLABS
            </h1>
            <p className="text-zinc-400 text-xs font-mono tracking-[0.2em] uppercase leading-relaxed max-w-lg">
              SCROLL TO DECONSTRUCT THE CORE &amp; EXPLORE PLATFORM CAPABILITIES.
            </p>
          </motion.div>

          {/* Beat 1: Aether Reveal */}
          <motion.div 
            style={{ opacity: opacity1, y: y1, filter: blur1, pointerEvents: pointer1 }} 
            className="space-y-6 absolute flex flex-col items-center justify-center w-full px-4"
          >
            <div className="text-zinc-555 font-mono text-[9px] tracking-[0.3em] uppercase">SYSTEM / ARCHITECTURE</div>
            <h2 
              style={metallicShadow}
              className="text-4xl md:text-7xl font-black tracking-[0.25em] leading-none text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-400 to-zinc-200 uppercase"
            >
              AETHER
            </h2>
            <p className="text-zinc-350 text-xs font-mono tracking-[0.2em] uppercase leading-relaxed max-w-xl">
              OUR CUSTOM COMPUTATIONAL ENGINEERING ENGINE. TRANSLATING RAW ARTIFICIAL INTELLIGENCE DIRECTLY INTO WATERTIGHT PHYSICAL MATTER.
            </p>
          </motion.div>

          {/* Beat 2: Capability 1 - Ingest */}
          <motion.div 
            style={{ opacity: opacity2, y: y2, filter: blur2, pointerEvents: pointer2 }} 
            className="space-y-6 absolute flex flex-col items-center justify-center w-full px-4"
          >
            <div className="inline-flex items-center space-x-2 bg-zinc-900/60 border border-zinc-850 px-3 py-1 rounded text-amber-550 text-[10px] font-mono">
              <Binary className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <span>CAPABILITY 01</span>
            </div>
            <h2 
              style={metallicShadow}
              className="text-4xl md:text-5xl font-black tracking-[0.18em] leading-none text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-400 to-zinc-200 uppercase"
            >
              INGEST DATASHEETS
            </h2>
            <p className="text-zinc-350 text-xs font-mono tracking-[0.2em] uppercase leading-relaxed max-w-xl">
              UPLOAD MANUFACTURER PDF SPECIFICATIONS OR TYPE SIMPLE MECHANICAL REQUIREMENTS. AETHER INSTANTLY PARSES PRECISION BOUNDARIES AND FORCE LOADS.
            </p>
          </motion.div>

          {/* Beat 3: Capability 2 - Audits */}
          <motion.div 
            style={{ opacity: opacity3, y: y3, filter: blur3, pointerEvents: pointer3 }} 
            className="space-y-6 absolute flex flex-col items-center justify-center w-full px-4"
          >
            <div className="inline-flex items-center space-x-2 bg-zinc-900/60 border border-zinc-850 px-3 py-1 rounded text-amber-550 text-[10px] font-mono">
              <Activity className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <span>CAPABILITY 02</span>
            </div>
            <h2 
              style={metallicShadow}
              className="text-4xl md:text-5xl font-black tracking-[0.18em] leading-none text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-400 to-zinc-200 uppercase"
            >
              PHYSICS AUDITS
            </h2>
            <p className="text-zinc-350 text-xs font-mono tracking-[0.2em] uppercase leading-relaxed max-w-xl">
              EVALUATES MECHANICAL STRAIN UNDER TORQUE LOAD. THE MODEL AUTOMATICALLY REINFORCES STRUCTURES AND THICKENS CASES TO ENFORCE OVERRIDE LIMITS.
            </p>
          </motion.div>

          {/* Beat 4: Capability 3 - Kinematics */}
          <motion.div 
            style={{ opacity: opacity4, y: y4, filter: blur4, pointerEvents: pointer4 }} 
            className="space-y-6 absolute flex flex-col items-center justify-center w-full px-4"
          >
            <div className="inline-flex items-center space-x-2 bg-zinc-900/60 border border-zinc-850 px-3 py-1 rounded text-amber-550 text-[10px] font-mono">
              <Cpu className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <span>CAPABILITY 03</span>
            </div>
            <h2 
              style={metallicShadow}
              className="text-4xl md:text-5xl font-black tracking-[0.18em] leading-none text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-400 to-zinc-200 uppercase"
            >
              KINEMATIC SOLVER
            </h2>
            <p className="text-zinc-350 text-xs font-mono tracking-[0.2em] uppercase leading-relaxed max-w-xl">
              VERIFIES ROTATIONAL CLEARANCES AND CLOSED-LOOP TRANSMISSION LINKAGES. ENSURES ALL MOVING JOINTS SWING FREELY WITHOUT COLLISION.
            </p>
          </motion.div>

          {/* Beat 5: Workspace CTA & Stats */}
          <motion.div 
            style={{ opacity: opacity5, y: y5, filter: blur5, pointerEvents: pointer5 }} 
            className="space-y-6 absolute flex flex-col items-center justify-center w-full px-4"
          >
            <div className="inline-flex items-center space-x-2 bg-zinc-900/60 border border-zinc-850 px-3 py-1 rounded text-amber-550 text-[10px] font-mono">
              <Gauge className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <span>CEM PRODUCTION TELEMETRY</span>
            </div>
            <h2 
              style={metallicShadow}
              className="text-4xl md:text-5xl font-black tracking-[0.18em] leading-none text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-400 to-zinc-200 uppercase"
            >
              04 / WORKSPACE
            </h2>
            
            <div className="grid grid-cols-3 gap-4 font-mono text-[9px] w-full max-w-md">
              <div className="glass-panel p-3 rounded border border-zinc-850 bg-zinc-900/40 backdrop-blur-md">
                <span className="text-zinc-500 block mb-1 uppercase">Solves Speed</span>
                <span className="text-sm font-bold text-amber-500">0.08 s</span>
              </div>
              <div className="glass-panel p-3 rounded border border-zinc-850 bg-zinc-900/40 backdrop-blur-md">
                <span className="text-zinc-500 block mb-1 uppercase">Training Corpus</span>
                <span className="text-sm font-bold text-zinc-300">2.8M CAD</span>
              </div>
              <div className="glass-panel p-3 rounded border border-zinc-850 bg-zinc-900/40 backdrop-blur-md">
                <span className="text-zinc-500 block mb-1 uppercase">Manifold</span>
                <span className="text-sm font-bold text-emerald-500">100% Solid</span>
              </div>
            </div>

            <div className="space-y-4 pt-2 pointer-events-auto">
              <Link
                href="/workspace"
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold text-xs py-4 px-10 rounded shadow-md transition-all flex items-center justify-center space-x-3 cursor-pointer"
              >
                <span>LAUNCH COMPILER WORKSPACE</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                &copy; {new Date().getFullYear()} VeloLabs. AI TO MATTER COMPILER PIPELINE.
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* VERTICAL DOT NAVIGATION */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 flex flex-col space-y-6 z-45">
        {[
          { label: "00 / INTRO", val: 0.0, activeStart: 0.0, activeEnd: 0.12 },
          { label: "01 / AETHER", val: 0.22, activeStart: 0.12, activeEnd: 0.32 },
          { label: "02 / INGEST", val: 0.41, activeStart: 0.32, activeEnd: 0.50 },
          { label: "03 / AUDIT", val: 0.59, activeStart: 0.50, activeEnd: 0.68 },
          { label: "04 / SOLVER", val: 0.77, activeStart: 0.68, activeEnd: 0.84 },
          { label: "05 / WORKSPACE", val: 0.95, activeStart: 0.84, activeEnd: 1.0 },
        ].map((item, idx) => (
          <DotIndicator key={idx} item={item} smoothScroll={smoothScroll} onClick={() => scrollToSection(item.val)} />
        ))}
      </div>

      {/* HIGH-PERFORMANCE REAL-TIME TELEMETRY HUD */}
      <div className="fixed inset-x-8 bottom-8 flex justify-between items-end z-40 pointer-events-none font-mono text-[9px] text-zinc-500">
        
        {/* LEFT HUD: COMPILER STATE & TIMECODES */}
        <div className="space-y-2 max-w-[280px] md:max-w-xs bg-zinc-950/45 backdrop-blur-md p-4 rounded-lg border border-zinc-900/60 shadow-xl pointer-events-auto">
          <div className="flex items-center space-x-2 border-b border-zinc-900 pb-1.5 mb-2 w-full justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              <span className="text-[10px] font-extrabold tracking-widest text-zinc-300">AETHER TENSOR COMPILER</span>
            </div>
            <button 
              onClick={() => setHudBypass(!hudBypass)}
              className="px-2 py-0.5 border border-zinc-800 hover:border-amber-550 rounded bg-zinc-900/50 text-zinc-400 hover:text-amber-550 transition-colors text-[7px] cursor-pointer"
            >
              {hudBypass ? "SHOW TELEMETRY" : "HIDE"}
            </button>
          </div>
          <div className={`space-y-1 transition-all duration-300 overflow-hidden ${hudBypass ? 'opacity-0 max-h-0' : 'opacity-100 max-h-[150px]'}`}>
            <div className="flex justify-between space-x-8">
              <span className="uppercase text-zinc-600">System Mode:</span>
              <span ref={statusRef} className="text-zinc-300 font-bold uppercase text-right">AETHER STANDBY</span>
            </div>
            <div className="flex justify-between space-x-8">
              <span className="uppercase text-zinc-600">Timecode:</span>
              <span ref={timecodeRef} className="text-amber-500 font-bold">00:00.00</span>
            </div>
            <div className="flex justify-between space-x-8">
              <span className="uppercase text-zinc-600">Frame Index:</span>
              <span ref={frameRef} className="text-zinc-300">FR / 000</span>
            </div>
            <div className="flex justify-between space-x-8">
              <span className="uppercase text-zinc-650">Scroll Depth:</span>
              <span ref={scrollPctRef} className="text-zinc-400">0.0%</span>
            </div>
          </div>
        </div>

        {/* RIGHT HUD: SOLVER LOAD & GRAPH */}
        <div className="space-y-2 max-w-[280px] md:max-w-xs bg-zinc-950/45 backdrop-blur-md p-4 rounded-lg border border-zinc-900/60 shadow-xl flex flex-col items-end pointer-events-auto">
          <div className="flex items-center space-x-2 border-b border-zinc-900 pb-1.5 mb-2 w-full justify-between">
            <span className="text-[10px] font-extrabold tracking-widest text-zinc-300">SOLVER MATRIX DIAGNOSTICS</span>
            <span className="text-emerald-500 font-bold">SOLID MANIFOLD</span>
          </div>
          <div className={`w-full space-y-1 text-right mb-2 transition-all duration-300 overflow-hidden ${hudBypass ? 'opacity-0 max-h-0' : 'opacity-100 max-h-[150px]'}`}>
            <div className="flex justify-between space-x-8">
              <span className="uppercase text-zinc-600">Latent Dims:</span>
              <span className="text-zinc-300 font-bold">1024 x 1024 x 128</span>
            </div>
            <div className="flex justify-between space-x-8">
              <span className="uppercase text-zinc-600">Voxel Deviation:</span>
              <span ref={deviationRef} className="text-zinc-400">1.0000 σ</span>
            </div>
            <div className="flex justify-between space-x-8">
              <span className="uppercase text-zinc-650">Aether Tension:</span>
              <span ref={tensionRef} className="text-amber-500 font-bold">0.00 GPa</span>
            </div>
            {/* Dynamic SVG Waveform Chart */}
            <div className="h-10 w-[150px] border border-zinc-900/80 rounded bg-zinc-950/80 overflow-hidden relative mt-2 ml-auto">
              <svg className="w-full h-full" viewBox="0 0 150 40">
                <path
                  ref={graphPathRef}
                  fill="none"
                  stroke="url(#amber-grad)"
                  strokeWidth="1.5"
                  d="M 0 20 L 150 20"
                />
                <defs>
                  <linearGradient id="amber-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                    <stop offset="50%" stopColor="#d97706" stopOpacity="1" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>

      </div>

      {/* Scroll indicator chevron */}
      <motion.div 
        style={{ opacity: scrollIndicatorOpacity }}
        className="fixed bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-2 text-zinc-500 z-30 pointer-events-none"
      >
        <span className="text-[9px] font-mono tracking-[0.3em] uppercase animate-pulse">SCROLL TO OPERATE CORE</span>
        <div className="w-[1px] h-8 bg-gradient-to-b from-amber-500 to-transparent animate-bounce" />
      </motion.div>

      {/* SCROLL RANGE SPACE DRIVER */}
      <div className="h-[550vh] w-full pointer-events-none" />

    </div>
  );
}
