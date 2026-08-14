import React from "react";

const AnimatedWaveBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. Dynamic Liquid Mesh Gradient Base Layer */}
      <div
        className="absolute inset-0 opacity-80 dark:opacity-90 animate-mesh-gradient"
        style={{
          background: `
            radial-gradient(circle at 15% 20%, rgba(139, 92, 246, 0.45) 0%, transparent 45%),
            radial-gradient(circle at 85% 30%, rgba(6, 182, 212, 0.5) 0%, transparent 50%),
            radial-gradient(circle at 50% 80%, rgba(59, 130, 246, 0.4) 0%, transparent 55%),
            linear-gradient(135deg, #09090b 0%, #0d1117 40%, #0f172a 100%)
          `,
        }}
      />

      {/* 2. Wave Canvas / SVG Layers Inspired by Reference UI */}
      <div className="absolute inset-x-0 bottom-0 h-[65vh] opacity-65 flex items-end">
        {/* Layer A — Deep Blue-Violet Wave */}
        <svg
          className="absolute bottom-0 left-0 w-[200%] h-full animate-wave-1 fill-cyan-500/20 dark:fill-cyan-400/25 blur-sm"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path d="M0,192L48,181.3C96,171,192,150,288,154.7C384,160,480,192,576,197.3C672,203,768,181,864,165.3C960,150,1056,139,1152,149.3C1248,160,1344,192,1392,208L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>

        {/* Layer B — Cyan-Violet Wave Offset */}
        <svg
          className="absolute bottom-0 left-0 w-[200%] h-full animate-wave-2 fill-purple-500/20 dark:fill-purple-400/30 blur-[2px]"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path d="M0,128L48,144C96,160,192,192,288,186.7C384,181,480,139,576,133.3C672,128,768,160,864,176C960,192,1056,192,1152,176C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>

        {/* Layer C — Glowing Foreground Cyan Wave Highlight */}
        <svg
          className="absolute -bottom-2 left-0 w-[200%] h-[75%] animate-wave-1 opacity-70 fill-cyan-400/30 dark:fill-cyan-300/35"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path d="M0,224L60,213.3C120,203,240,181,360,186.7C480,192,600,224,720,213.3C840,203,960,149,1080,138.7C1200,128,1320,160,1380,176L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
        </svg>
      </div>

      {/* 3. Glassmorphism Noise Overlay */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
    </div>
  );
};

export default AnimatedWaveBackground;
