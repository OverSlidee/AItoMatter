"use client";

import { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right" | "fade";
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number;
}

export default function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 1000,
  className = "",
  threshold = 0.05
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Stop observing once visible to prevent animation jitter on scroll-back
          if (ref.current) {
            observer.unobserve(ref.current);
          }
        }
      },
      { 
        threshold,
        rootMargin: "0px 0px -50px 0px" // triggers slightly before entering view
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold]);

  const getDirectionStyles = () => {
    if (isVisible) {
      return "opacity-100 translate-y-0 translate-x-0 scale-100";
    }

    switch (direction) {
      case "up":
        return "opacity-0 translate-y-16 scale-[0.98]";
      case "down":
        return "opacity-0 -translate-y-16 scale-[0.98]";
      case "left":
        return "opacity-0 translate-x-16 scale-[0.98]";
      case "right":
        return "opacity-0 -translate-x-16 scale-[0.98]";
      case "fade":
      default:
        return "opacity-0 scale-[0.98]";
    }
  };

  return (
    <div
      ref={ref}
      className={`transition-all cubic-bezier(0.16, 1, 0.3, 1) ${getDirectionStyles()} ${className}`}
      style={{
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
}
