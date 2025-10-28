"use client";

import React from "react";

declare global {
  interface Window {
    MathJax?: {
      typesetPromise: (elements?: Element[]) => Promise<void>;
    };
    __mathJaxLoader?: Promise<void>;
  }
}

const MATHJAX_SCRIPT_SRC = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";

async function loadMathJax(): Promise<void> {
  if (typeof window === "undefined") return;

  if (window.MathJax) return;

  if (!window.__mathJaxLoader) {
    window.__mathJaxLoader = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.async = true;
      script.src = MATHJAX_SCRIPT_SRC;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load MathJax."));
      document.head.appendChild(script);
    });
  }

  await window.__mathJaxLoader;
}

export function MathPreview({ html, className }: { html: string; className?: string }) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let disposed = false;

    async function renderPreview() {
      if (!containerRef.current) return;

      if (!html) {
        containerRef.current.innerHTML = "<em class=\"text-xs text-gray-500\">Nothing to preview yet.</em>";
        return;
      }

      containerRef.current.innerHTML = html;

      try {
        await loadMathJax();
        if (disposed || !window.MathJax) return;
        await window.MathJax.typesetPromise?.([containerRef.current]);
      } catch (error) {
        if (containerRef.current) {
          containerRef.current.innerHTML = `<span class="text-xs text-red-600">Failed to render preview.</span>`;
        }
        console.error("MathJax preview error:", error);
      }
    }

    renderPreview();

    return () => {
      disposed = true;
    };
  }, [html]);

  return (
    <div
      ref={containerRef}
      className={`prose prose-sm max-w-none text-gray-800 ${className ?? ""}`.trim()}
    />
  );
}

export default MathPreview;
