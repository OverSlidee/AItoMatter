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

  // Beat 0a: Introduced by VeloLabs (0.0 to 0.08)
  const opacity0a = useTransform(smoothScroll, [0.0, 0.05, 0.08], [1, 1, 0]);
  const y0a = useTransform(smoothScroll, [0.0, 0.05, 0.08], [0, 0, -40]);
  const blur0a = useTransform(smoothScroll, [0.0, 0.05, 0.08], ["blur(0px)", "blur(0px)", "blur(12px)"]);

  // Beat 0b: Build By VeloLabs.IO (0.08 to 0.16)
  const opacity0b = useTransform(smoothScroll, [0.07, 0.10, 0.14, 0.16], [0, 1, 1, 0]);
  const y0b = useTransform(smoothScroll, [0.07, 0.10, 0.14, 0.16], [40, 0, 0, -40]);
  const blur0b = useTransform(smoothScroll, [0.07, 0.10, 0.14, 0.16], ["blur(12px)", "blur(0px)", "blur(0px)", "blur(12px)"]);

  // Beat Aether: Aether Reveal (0.97 to 1.0)
  const opacityAether = useTransform(smoothScroll, [0.96, 0.98, 1.0], [0, 1, 1]);
  const yAether = useTransform(smoothScroll, [0.96, 0.98, 1.0], [40, 0, 0]);
  const blurAether = useTransform(smoothScroll, [0.96, 0.98, 1.0], ["blur(12px)", "blur(0px)", "blur(0px)"]);

  // Pointer event mappings to prevent background overlay clicks when hidden
  const pointer0a = useTransform(opacity0a, (v) => v > 0.15 ? "auto" : "none");
  const pointer0b = useTransform(opacity0b, (v) => v > 0.15 ? "auto" : "none");
  const pointerAether = useTransform(opacityAether, (v) => v > 0.15 ? "auto" : "none");

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
        const frameIndex = Math.floor(boundedTime * 60); // 60 fps for interpolated high-fidelity frames
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
        if (targetScroll > 0.0 && targetScroll <= 0.08) baseTension = 4.2; 
        else if (targetScroll > 0.08 && targetScroll <= 0.18) baseTension = 14.8; 
        else if (targetScroll > 0.18 && targetScroll <= 0.95) {
          baseTension = 14.8 + (targetScroll - 0.18) * 220; 
        }
        else if (targetScroll > 0.95) baseTension = 198.4; 

        const currentTensionText = tensionRef.current.innerText;
        const currentTensionVal = parseFloat(currentTensionText) || 0;
        const targetTensionVal = baseTension + (Math.random() * 1.5);
        const nextTensionVal = currentTensionVal + (targetTensionVal - currentTensionVal) * 0.12;
        tensionRef.current.innerText = `${nextTensionVal.toFixed(2)} GPa`;
      }

      if (statusRef.current) {
        let statusMsg = "STANDBY";
        if (targetScroll < 0.08) {
          statusMsg = "INTRO COGNITION";
        } else if (targetScroll >= 0.08 && targetScroll < 0.18) {
          statusMsg = "VELOLABS BUILD INIT";
        } else if (targetScroll >= 0.18 && targetScroll < 0.95) {
          statusMsg = "OPERATING NEURAL CORE v1.5";
        } else {
          statusMsg = "AETHER ACTIVE - AI TO MATTER";
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
          
          {/* Beat 0a: Intro */}
          <motion.div 
            style={{ opacity: opacity0a, y: y0a, filter: blur0a, pointerEvents: pointer0a }} 
            className="space-y-6 absolute flex flex-col items-center justify-center w-full px-4"
          >
            <div className="inline-flex items-center space-x-2 bg-zinc-900/60 border border-zinc-850 px-4 py-1.5 rounded-full text-amber-500 text-[10px] font-mono shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <span>COMPUTATIONAL ENGINEERING EXPERIMENT</span>
            </div>
            <h1 
              style={{ textShadow: "0 0 35px rgba(245,158,11,0.25), 0 4px 12px rgba(0,0,0,0.85)" }}
              className="text-4xl md:text-6xl font-extrabold tracking-[0.2em] leading-none text-amber-500 uppercase"
            >
              INTRODUCED BY VELOLABS
            </h1>
            <p className="text-amber-500/80 text-xs font-mono tracking-[0.2em] uppercase leading-relaxed max-w-lg">
              SCROLL TO DECONSTRUCT THE CORE &amp; EXPLORE PLATFORM CAPABILITIES.
            </p>
          </motion.div>

          {/* Beat 0b: Build By VeloLabs */}
          <motion.div 
            style={{ opacity: opacity0b, y: y0b, filter: blur0b, pointerEvents: pointer0b }} 
            className="space-y-6 absolute flex flex-col items-center justify-center w-full px-4"
          >
            <div className="inline-flex items-center space-x-2 bg-zinc-900/60 border border-zinc-850 px-4 py-1.5 rounded-full text-amber-500 text-[10px] font-mono shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <span>SYSTEM COMPILE INITIATED</span>
            </div>
            <h1 
              style={{ textShadow: "0 0 35px rgba(245,158,11,0.25), 0 4px 12px rgba(0,0,0,0.85)" }}
              className="text-4xl md:text-6xl font-extrabold tracking-[0.2em] leading-none text-amber-500 uppercase"
            >
              BUILD BY VELOLABS.IO
            </h1>
            <p className="text-amber-500/80 text-xs font-mono tracking-[0.2em] uppercase leading-relaxed max-w-lg">
              ESTABLISHING CORE INTERACTION WITH THE CEM MODEL.
            </p>
          </motion.div>

          {/* Beat Aether: Aether Core Reveal */}
          <motion.div 
            style={{ opacity: opacityAether, y: yAether, filter: blurAether, pointerEvents: pointerAether }} 
            className="space-y-6 absolute flex flex-col items-center justify-center w-full px-4"
          >
            <div className="text-amber-500/80 font-mono text-[9px] tracking-[0.3em] uppercase">SYSTEM / CORE ACTIVATED</div>
            <h2 
              style={{ textShadow: "0 0 45px rgba(245,158,11,0.3), 0 4px 15px rgba(0,0,0,0.9)" }}
              className="text-5xl md:text-8xl font-black tracking-[0.25em] leading-none text-amber-500 uppercase"
            >
              AETHER
            </h2>
            <p className="text-amber-500 text-xs font-mono tracking-[0.2em] uppercase leading-relaxed max-w-xl">
              AI to Matter CEM engine
            </p>
            
            <div className="grid grid-cols-3 gap-4 font-mono text-[9px] w-full max-w-md pt-4 pointer-events-auto">
              <div className="glass-panel p-3 rounded border border-zinc-850 bg-zinc-900/40 backdrop-blur-md">
                <span className="text-zinc-400 block mb-1 uppercase">Solves Speed</span>
                <span className="text-sm font-bold text-amber-550">0.08 s</span>
              </div>
              <div className="glass-panel p-3 rounded border border-zinc-850 bg-zinc-900/40 backdrop-blur-md">
                <span className="text-zinc-400 block mb-1 uppercase">Training Corpus</span>
                <span className="text-sm font-bold text-zinc-300">2.8M CAD</span>
              </div>
              <div className="glass-panel p-3 rounded border border-zinc-850 bg-zinc-900/40 backdrop-blur-md">
                <span className="text-zinc-400 block mb-1 uppercase">Manifold</span>
                <span className="text-sm font-bold text-emerald-500">100% Solid</span>
              </div>
            </div>

            <div className="space-y-4 pt-4 pointer-events-auto">
              <Link
                href="/workspace"
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-zinc-955 font-mono font-bold text-xs py-4 px-10 rounded shadow-md transition-all flex items-center justify-center space-x-3 cursor-pointer"
              >
                <span>LAUNCH COMPILER WORKSPACE</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="text-[9px] font-mono text-zinc-450 uppercase tracking-wider">
                &copy; {new Date().getFullYear()} VeloLabs. AI TO MATTER COMPILER PIPELINE.
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* VERTICAL DOT NAVIGATION */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 flex flex-col space-y-6 z-45">
        {[
          { label: "00 / INTRO", val: 0.0, activeStart: 0.0, activeEnd: 0.08 },
          { label: "01 / BUILD", val: 0.11, activeStart: 0.08, activeEnd: 0.18 },
          { label: "02 / AETHER", val: 0.98, activeStart: 0.95, activeEnd: 1.0 },
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
