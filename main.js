import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const scrollTrack = document.getElementById('scroll-track');
const scrollPrompt = document.getElementById('scroll-prompt');

// Preloader Elements
const preloader = document.getElementById('preloader');
const preloaderBar = document.getElementById('preloader-bar');
const preloaderPercent = document.getElementById('preloader-percent');
const preloaderStatus = document.querySelector('.preloader-status');

// UI Overlays
const homeOverlay = document.getElementById('home-overlay');
const inspectionOverlay = document.getElementById('inspection-overlay');
const buildingLayer = document.getElementById('building-interaction-layer');
const floorRibbon = document.getElementById('floor-ribbon');
const floorSpecLabel = document.getElementById('floor-spec-label');
const specEditorialText = document.getElementById('spec-editorial-text');
const floorHitboxes = document.querySelectorAll('.floor-hitbox');

// ----------------------------------------------------------------------------
// EXACT MEASURED FLOOR BOUNDS ON 1920x1080 (FLOORS 10 DOWN TO 1)
// ----------------------------------------------------------------------------
// Tower width spans exactly 30.00% to 69.80% (764px wide on 1920)
const TOWER_LEFT_NORM = 0.3000;
const TOWER_WIDTH_NORM = 0.3980;

// Pixel-measured vertical coordinates for 10 full residential floors
const FLOOR_DEFS = {
  10: { top: 0.1435, height: 0.0630, label: '( Penthouse 10 — 340 m² )' },
  9:  { top: 0.2065, height: 0.0620, label: '( Floor 09 — 310 m² )' },
  8:  { top: 0.2685, height: 0.0620, label: '( Floor 08 — 245 m² )' },
  7:  { top: 0.3305, height: 0.0620, label: '( Floor 07 — 198 m² )' },
  6:  { top: 0.3925, height: 0.0620, label: '( Floor 06 — 175 m² )' },
  5:  { top: 0.4546, height: 0.0620, label: '( Floor 05 — 154 m² )' },
  4:  { top: 0.5166, height: 0.0620, label: '( Floor 04 — 140 m² )' },
  3:  { top: 0.5787, height: 0.0620, label: '( Floor 03 — 135 m² )' },
  2:  { top: 0.6407, height: 0.0620, label: '( Floor 02 — 125 m² )' },
  1:  { top: 0.7027, height: 0.0620, label: '( Floor 01 — 110 m² )' },
};

let activeFloorNum = 7;

// ----------------------------------------------------------------------------
// HIGH-DPI CANVAS & EXACT RESPONSIVE ALIGNMENT
// ----------------------------------------------------------------------------
function updateLayout() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;

  const clientW = window.innerWidth;
  const clientH = window.innerHeight;

  const hRatio = clientW / 1920;
  const vRatio = clientH / 1080;
  const ratio = Math.min(hRatio, vRatio);

  const renderW = 1920 * ratio;
  const renderH = 1080 * ratio;
  const shiftX = (clientW - renderW) / 2;
  const shiftY = (clientH - renderH) / 2;

  // Watermark mask coordinates (Video 2)
  const markX = shiftX + (renderW * 0.906);
  const markY = shiftY + (renderH * 0.835);

  scrollPrompt.style.left = `${markX}px`;
  scrollPrompt.style.top = `${markY}px`;
  scrollPrompt.classList.add('visible');

  // Align 10 floor hitboxes directly over the physical building facade
  const towerLeft = shiftX + (renderW * TOWER_LEFT_NORM);
  const towerWidth = renderW * TOWER_WIDTH_NORM;

  floorHitboxes.forEach((box) => {
    const fNum = parseInt(box.getAttribute('data-floor'), 10);
    const def = FLOOR_DEFS[fNum];
    if (def) {
      box.style.left = `${towerLeft}px`;
      box.style.width = `${towerWidth}px`;
      box.style.top = `${shiftY + (renderH * def.top)}px`;
      box.style.height = `${renderH * def.height}px`;
    }
  });

  // Re-align floor ribbon & floating label
  highlightFloor(activeFloorNum, false);

  render();
}

window.addEventListener('resize', updateLayout);

// ----------------------------------------------------------------------------
// MINIMALIST FLOOR HIGHLIGHT (ORANGE & WHITE LUMINESCENCE ON HOVER)
// ----------------------------------------------------------------------------
function highlightFloor(fNum, triggerFlash = true) {
  activeFloorNum = fNum;
  const def = FLOOR_DEFS[fNum];
  if (!def) return;

  const clientW = window.innerWidth;
  const clientH = window.innerHeight;
  const hRatio = clientW / 1920;
  const vRatio = clientH / 1080;
  const ratio = Math.min(hRatio, vRatio);

  const renderW = 1920 * ratio;
  const renderH = 1080 * ratio;
  const shiftX = (clientW - renderW) / 2;
  const shiftY = (clientH - renderH) / 2;

  const towerLeft = shiftX + (renderW * TOWER_LEFT_NORM);
  const towerWidth = renderW * TOWER_WIDTH_NORM;

  const bandTop = shiftY + (renderH * def.top);
  const bandH = renderH * def.height;

  // Position Ribbon precisely across the floor
  floorRibbon.style.left = `${towerLeft}px`;
  floorRibbon.style.width = `${towerWidth}px`;
  floorRibbon.style.top = `${bandTop}px`;
  floorRibbon.style.height = `${bandH}px`;
  floorRibbon.classList.add('visible');

  // Flash animation
  if (triggerFlash) {
    floorRibbon.classList.remove('flash-active');
    void floorRibbon.offsetWidth;
    floorRibbon.classList.add('flash-active');
  }

  // Position Floating Editorial Label beside the floor
  specEditorialText.textContent = def.label;
  floorSpecLabel.style.left = `${towerLeft + towerWidth + 18}px`;
  floorSpecLabel.style.top = `${bandTop + (bandH / 2)}px`;
  floorSpecLabel.classList.add('visible');
}

// Attach hover listener directly onto each floor of the physical building
floorHitboxes.forEach((box) => {
  box.addEventListener('mouseenter', () => {
    const fNum = parseInt(box.getAttribute('data-floor'), 10);
    highlightFloor(fNum, true);
  });
});

// ----------------------------------------------------------------------------
// 1080P ENHANCED FRAME PIPELINE WITH PRELOADER TRACKING
// ----------------------------------------------------------------------------
const F1_COUNT = 302;
const F2_COUNT = 240;
const TOTAL_FRAMES = F1_COUNT + F2_COUNT;

const frames1 = [];
const frames2 = [];

function pad(num, size = 4) {
  let s = num + '';
  while (s.length < size) s = '0' + s;
  return s;
}

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

let loadedCount = 0;
let currentDisplayPercent = 0;
let isPreloaderComplete = false;

// Lock interaction and scroll immediately while sequence downloads
document.body.style.overflow = 'hidden';
window.scrollTo(0, 0);

function updateLoaderProgress(target) {
  gsap.to({ val: currentDisplayPercent }, {
    val: target,
    duration: 0.22,
    ease: 'power1.out',
    onUpdate: function() {
      currentDisplayPercent = Math.floor(this.targets()[0].val);
      if (preloaderBar) preloaderBar.style.width = `${currentDisplayPercent}%`;
      if (preloaderPercent) preloaderPercent.textContent = `${currentDisplayPercent}%`;

      if (currentDisplayPercent >= 100 && !isPreloaderComplete) {
        completePreloader();
      }
    }
  });
}

function completePreloader() {
  if (isPreloaderComplete) return;
  isPreloaderComplete = true;

  if (preloaderStatus) preloaderStatus.textContent = 'Sequence Ready';
  if (preloaderBar) preloaderBar.style.width = '100%';
  if (preloaderPercent) preloaderPercent.textContent = '100%';

  render();

  setTimeout(() => {
    if (preloader) {
      preloader.classList.add('fade-out');
      setTimeout(() => {
        preloader.style.display = 'none';
        document.body.style.overflow = '';
        lenis.start();
        ScrollTrigger.refresh();
      }, 850);
    }
  }, 350);
}

function onFrameFinished(i, isF1) {
  loadedCount++;
  if (isF1 && i === 1) {
    render();
  }
  const realPercent = Math.min(100, Math.floor((loadedCount / TOTAL_FRAMES) * 100));
  updateLoaderProgress(realPercent);
}

for (let i = 1; i <= F1_COUNT; i++) {
  const img = new Image();
  img.src = `${BASE}/frames1/frame_${pad(i)}.jpg`;
  img.onload = () => onFrameFinished(i, true);
  img.onerror = () => onFrameFinished(i, true);
  frames1.push(img);
}

for (let i = 1; i <= F2_COUNT; i++) {
  const img = new Image();
  img.src = `${BASE}/frames2/frame_${pad(i)}.jpg`;
  img.onload = () => onFrameFinished(i, false);
  img.onerror = () => onFrameFinished(i, false);
  frames2.push(img);
}

// Fallback safety: ensures unlock even if remote network delays a single frame
setTimeout(() => {
  if (!isPreloaderComplete && loadedCount >= Math.floor(TOTAL_FRAMES * 0.5)) {
    updateLoaderProgress(100);
  }
}, 10000);

function getLoadedFrame(list, targetIdx) {
  const target = list[targetIdx];
  if (target && target.complete && target.naturalWidth > 0) return target;
  for (let i = targetIdx - 1; i >= 0; i--) {
    if (list[i] && list[i].complete && list[i].naturalWidth > 0) return list[i];
  }
  for (let i = targetIdx + 1; i < list.length; i++) {
    if (list[i] && list[i].complete && list[i].naturalWidth > 0) return list[i];
  }
  return target || null;
}

// ----------------------------------------------------------------------------
// MIRRORED EDGE REPEAT RENDERER (NO BLACK BARS, NATURAL LIGHT)
// ----------------------------------------------------------------------------
function drawMirroredEdgesAndCenter(img, alpha = 1.0) {
  if (!img || !img.complete || img.naturalWidth === 0) return;

  const canvasW = canvas.width;
  const canvasH = canvas.height;
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;

  const hRatio = canvasW / imgW;
  const vRatio = canvasH / imgH;
  const ratio = Math.min(hRatio, vRatio);

  const renderW = imgW * ratio;
  const renderH = imgH * ratio;
  const shiftX = (canvasW - renderW) / 2;
  const shiftY = (canvasH - renderH) / 2;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Fill side blank spaces by repeating / mirroring the edge pixels
  if (shiftX > 0) {
    // Left edge repeat (mirrored reflection of sky, trees, and daylight)
    ctx.save();
    ctx.translate(shiftX, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, imgW * 0.35, imgH, 0, shiftY, shiftX, renderH);
    ctx.restore();

    // Right edge repeat (mirrored reflection)
    ctx.save();
    ctx.translate(canvasW - shiftX, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, imgW * 0.65, 0, imgW * 0.35, imgH, -shiftX, shiftY, shiftX, renderH);
    ctx.restore();
  }

  // Draw Crisp Center Frame
  ctx.drawImage(img, shiftX, shiftY, renderW, renderH);
  ctx.restore();
}

// ----------------------------------------------------------------------------
// HIGH-ENERGY WIGGLE DISTORTION TRANSITION
// ----------------------------------------------------------------------------
let animWiggleTime = 0;

function drawWiggleDistortion(img, intensity) {
  if (!img || !img.complete || img.naturalWidth === 0) return;

  const canvasW = canvas.width;
  const canvasH = canvas.height;
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;

  drawMirroredEdgesAndCenter(img, 1.0);

  const hRatio = canvasW / imgW;
  const vRatio = canvasH / imgH;
  const baseRatio = Math.min(hRatio, vRatio);

  const scaleMultiplier = 1.0 + (0.05 * intensity);
  const ratio = baseRatio * scaleMultiplier;

  const renderW = imgW * ratio;
  const renderH = imgH * ratio;
  const shiftX = (canvasW - renderW) / 2;
  const shiftY = (canvasH - renderH) / 2;

  animWiggleTime += 0.08;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const slices = 36;
  const srcSliceH = imgH / slices;
  const dstSliceH = renderH / slices;

  for (let i = 0; i < slices; i++) {
    const sy = i * srcSliceH;
    const dy = shiftY + (i * dstSliceH);

    const wave = Math.sin((i * 0.45) + (animWiggleTime * 6)) * (44 * intensity);
    const noise = Math.sin((i * 1.8) + (animWiggleTime * 12)) * (18 * intensity);
    const offsetX = shiftX + wave + noise;

    ctx.drawImage(
      img,
      0, sy, imgW, srcSliceH,
      offsetX, dy, renderW, dstSliceH + 0.6
    );
  }

  if (intensity > 0.25) {
    const splitOffset = 16 * intensity;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    
    ctx.globalAlpha = 0.38 * intensity;
    ctx.fillStyle = 'rgba(255, 40, 80, 0.4)';
    ctx.drawImage(img, shiftX - splitOffset, shiftY, renderW, renderH);

    ctx.globalAlpha = 0.38 * intensity;
    ctx.fillStyle = 'rgba(40, 220, 255, 0.4)';
    ctx.drawImage(img, shiftX + splitOffset, shiftY, renderW, renderH);
    
    ctx.restore();
  }

  if (intensity > 0.75) {
    const flashAlpha = (intensity - 0.75) * 1.3;
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.4, flashAlpha)})`;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  ctx.restore();
}

// ----------------------------------------------------------------------------
// STATE MACHINE: ATOMIC NON-SCRUB TRANSITION & CLEAN SCRUB
// ----------------------------------------------------------------------------
let mode = 'zone1';
const warpState = { progress: 0 };
let currentFrame1Idx = 0;
let currentFrame2Idx = 0;

function render() {
  ctx.fillStyle = '#06080b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (mode === 'zone1') {
    const frame = getLoadedFrame(frames1, currentFrame1Idx);
    drawMirroredEdgesAndCenter(frame, 1.0);

  } else if (mode === 'zone2') {
    const frame = getLoadedFrame(frames2, currentFrame2Idx);
    drawMirroredEdgesAndCenter(frame, 1.0);

  } else if (mode === 'transitioning_forward' || mode === 'transitioning_backward') {
    const t = warpState.progress;
    const intensity = Math.sin(t * Math.PI);

    if (t < 0.5) {
      const frame1 = getLoadedFrame(frames1, F1_COUNT - 1);
      drawWiggleDistortion(frame1, intensity);
    } else {
      const frame2 = getLoadedFrame(frames2, 0);
      drawWiggleDistortion(frame2, intensity);
    }
  }
}

// ----------------------------------------------------------------------------
// LENIS SMOOTH SCROLL INITIALIZATION
// ----------------------------------------------------------------------------
const lenis = new Lenis({
  duration: 1.1,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  wheelMultiplier: 0.95,
  touchMultiplier: 1.5,
});

// Locked until sequence is loaded
lenis.stop();

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// ----------------------------------------------------------------------------
// ATOMIC TRANSITION TRIGGERS
// ----------------------------------------------------------------------------
function triggerForwardTransition() {
  if (mode !== 'zone1') return;
  mode = 'transitioning_forward';

  inspectionOverlay.classList.remove('active');
  buildingLayer.classList.remove('active');
  lenis.stop();

  gsap.fromTo(
    warpState,
    { progress: 0 },
    {
      progress: 1,
      duration: 0.65,
      ease: 'power2.inOut',
      onUpdate: () => render(),
      onComplete: () => {
        mode = 'zone2';
        currentFrame2Idx = 0;
        
        const total = scrollTrack.scrollHeight - window.innerHeight;
        const targetScroll = total * 0.52;
        lenis.scrollTo(targetScroll, { immediate: true });
        lenis.start();

        render();
      }
    }
  );
}

function triggerBackwardTransition() {
  if (mode !== 'zone2') return;
  mode = 'transitioning_backward';

  inspectionOverlay.classList.remove('active');
  buildingLayer.classList.remove('active');
  lenis.stop();

  gsap.fromTo(
    warpState,
    { progress: 1 },
    {
      progress: 0,
      duration: 0.65,
      ease: 'power2.inOut',
      onUpdate: () => render(),
      onComplete: () => {
        mode = 'zone1';
        currentFrame1Idx = F1_COUNT - 1;

        const total = scrollTrack.scrollHeight - window.innerHeight;
        const targetScroll = total * 0.46;
        lenis.scrollTo(targetScroll, { immediate: true });
        lenis.start();

        inspectionOverlay.classList.add('active');
        buildingLayer.classList.add('active');
        render();
      }
    }
  );
}

// ----------------------------------------------------------------------------
// SCROLLTRACK SCROLLTRIGGER COORDINATOR
// ----------------------------------------------------------------------------
ScrollTrigger.create({
  trigger: scrollTrack,
  start: 'top top',
  end: 'bottom bottom',
  scrub: true,
  onUpdate: (self) => {
    if (mode === 'transitioning_forward' || mode === 'transitioning_backward') {
      return;
    }

    const p = self.progress;
    const boundary = 0.50;

    if (p < boundary) {
      // ----------------------------------------------------------------------
      // ZONE 1: VIDEO 1
      // ----------------------------------------------------------------------
      if (mode === 'zone2' && self.direction === -1) {
        triggerBackwardTransition();
        return;
      }

      mode = 'zone1';
      const localP = p / boundary;

      // 1. Home Overlay Fades Out as User Scrolls Away from Top
      if (localP < 0.35) {
        const homeAlpha = Math.max(0, 1 - (localP / 0.25));
        homeOverlay.style.opacity = homeAlpha;
      } else {
        homeOverlay.style.opacity = '0';
      }

      // 2. Flight vs Resistance Hold
      if (localP < 0.85) {
        // Active flight: Only top navigation is visible!
        inspectionOverlay.classList.remove('active');
        buildingLayer.classList.remove('active');
        currentFrame1Idx = Math.floor((localP / 0.85) * (F1_COUNT - 1));
      } else {
        // RESISTANCE ZONE (Last Frame): Reveal TARQ Editorial Inspection UI & Floor Hover
        currentFrame1Idx = F1_COUNT - 1;
        homeOverlay.style.opacity = '0';
        inspectionOverlay.classList.add('active');
        buildingLayer.classList.add('active');
      }
      render();

    } else {
      // ----------------------------------------------------------------------
      // ZONE 2: VIDEO 2
      // ----------------------------------------------------------------------
      if (mode === 'zone1' && self.direction === 1) {
        triggerForwardTransition();
        return;
      }

      mode = 'zone2';
      homeOverlay.style.opacity = '0';
      inspectionOverlay.classList.remove('active');
      buildingLayer.classList.remove('active');

      const localP = (p - boundary) / (1.0 - boundary);
      currentFrame2Idx = Math.min(F2_COUNT - 1, Math.floor(localP * (F2_COUNT - 1)));
      render();
    }
  }
});

// Initial layout & frame paint
updateLayout();
