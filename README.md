# AURA // Luxury Architectural Scrollytelling

An editorial, lag-free architectural scrollytelling web experience powered by high-DPI HTML5 Canvas, Lenis smooth scrolling, and GSAP ScrollTrigger.

🌐 **Live Demo:** [https://saimjawed254.github.io/archi-demo/](https://saimjawed254.github.io/archi-demo/)

---

## ✨ Features

- **Buttery Smooth 60–120 FPS Scrubbing:** Frame-sequence canvas pipeline eliminating H.264 video decoding latency and stutter.
- **Edge-Mirrored Canvas:** Horizontally mirrors live frame edge pixels to eliminate black letterboxing on ultra-wide and laptop displays.
- **Minimalist Editorial Luxury Typography:** Inspired by high-end architectural studios (TARQ Studio), featuring Cormorant Garamond italic serif and refined Inter sans typography.
- **Warm Architectural Amber Highlights:** Amber/orange ambient glow (`#ff9d00`) and contrast drop shadows engineered for 100% legibility over bright skies and clouds.
- **10-Floor Interactive Building Inspection:** Pixel-accurate hover hitboxes directly over the physical building facade across 10 residential levels (Penthouse 10 down to Floor 01), featuring luminescent ribbons and floating editorial spec labels.
- **Atomic Glitch / Warp Transition:** Seamless, non-scrubbable transition between video sequences with RGB aberration and horizontal wave scanlines.
- **Permanent Circular Scroll Indicator:** 96px rotating circular badge (`• KEEP SCROLLING •`) with an animated floating/breathing mouse icon positioned to conceal the video watermark.

---

## 🛠️ Tech Stack

- **Vite** — Next Generation Frontend Tooling
- **HTML5 Canvas 2D** — High-DPI frame sequence rendering
- **Lenis** — Modern smooth scroll library
- **GSAP & ScrollTrigger** — Choreographed timeline and scroll animations
- **FFmpeg Static** — Lanczos 8-tap super-sampling & unsharp enhancement

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/saimjawed254/archi-demo.git

# Navigate into the project directory
cd archi-demo

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173/` in your browser.

### Production Build

```bash
npm run build
```

The production assets will be built to the `dist/` directory.

---

## 📄 License

MIT License © 2026 Saim Jawed
