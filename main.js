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

// Section 3 Elements (Interior Penthouse Residence & Growing Video)
const canvas3 = document.getElementById('canvas-3');
const ctx3 = canvas3.getContext('2d', { alpha: false });
const interiorIntroView = document.getElementById('interior-intro-view');
const interiorHud = document.getElementById('interior-hud');
const minimapBeaconGroup = document.getElementById('minimap-beacon-group');
const minimapZoneText = document.getElementById('minimap-zone-text');
const roomEyebrow = document.getElementById('room-eyebrow');
const roomTitle = document.getElementById('room-title');
const roomDesc = document.getElementById('room-desc');
const interiorRoomCard = document.getElementById('interior-room-card');

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
let coverW3 = 1920;
let coverH3 = 1080;
let coverShiftX3 = 0;
let coverShiftY3 = 0;

function updateLayout() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;

  if (canvas3) {
    canvas3.width = window.innerWidth * dpr;
    canvas3.height = window.innerHeight * dpr;
    const scale3 = Math.max(canvas3.width / 1920, canvas3.height / 1080);
    coverW3 = 1920 * scale3;
    coverH3 = 1080 * scale3;
    coverShiftX3 = (canvas3.width - coverW3) / 2;
    coverShiftY3 = (canvas3.height - coverH3) / 2;
  }

  const clientW = window.innerWidth;
  const clientH = window.innerHeight;

  const hRatio = clientW / 1920;
  const vRatio = clientH / 1080;
  const ratio = Math.min(hRatio, vRatio);

  const renderW = 1920 * ratio;
  const renderH = 1080 * ratio;
  const shiftX = (clientW - renderW) / 2;
  const shiftY = (clientH - renderH) / 2;

  // Watermark mask coordinates (Video 2 & Video 3)
  const markX = shiftX + (renderW * 0.906);
  const markY = shiftY + (renderH * 0.835);

  scrollPrompt.style.left = `${markX}px`;
  scrollPrompt.style.top = `${markY}px`;
  scrollPrompt.classList.add('visible');

  // Position Liquid Glass Room Info Card safely 24px to the left of the scroll sticker
  if (interiorRoomCard) {
    const badgeLeft = markX - 48; // Left edge of 96px circular badge
    const rightDist = Math.max(20, (clientW - badgeLeft) + 24);
    interiorRoomCard.style.right = `${rightDist}px`;
    interiorRoomCard.style.bottom = `${Math.max(24, clientH - markY - 36)}px`;
  }

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
  renderInterior();
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
// 1080P ENHANCED FRAME PIPELINE WITH PRELOADER TRACKING (VIDEOS 1, 2, 3)
// ----------------------------------------------------------------------------
const F1_COUNT = 151;
const F2_COUNT = 120;
const F3_COUNT = 390;
const TOTAL_FRAMES = F1_COUNT + F2_COUNT + F3_COUNT;

const frames1 = [];
const frames2 = [];
const frames3 = [];

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
  renderInterior();

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

function onFrameFinished(i, tag) {
  loadedCount++;
  if (tag === 'f1' && i === 1) {
    render();
  }
  if (tag === 'f3' && i === 1) {
    renderInterior();
  }
  const realPercent = Math.min(100, Math.floor((loadedCount / TOTAL_FRAMES) * 100));
  updateLoaderProgress(realPercent);
}

for (let i = 1; i <= F1_COUNT; i++) {
  const img = new Image();
  img.src = `${BASE}/frames1/frame_${pad(i)}.webp`;
  img.onload = () => {
    if (img.decode) {
      img.decode().catch(() => {}).finally(() => onFrameFinished(i, 'f1'));
    } else {
      onFrameFinished(i, 'f1');
    }
  };
  img.onerror = () => onFrameFinished(i, 'f1');
  frames1.push(img);
}

for (let i = 1; i <= F2_COUNT; i++) {
  const img = new Image();
  img.src = `${BASE}/frames2/frame_${pad(i)}.webp`;
  img.onload = () => {
    if (img.decode) {
      img.decode().catch(() => {}).finally(() => onFrameFinished(i, 'f2'));
    } else {
      onFrameFinished(i, 'f2');
    }
  };
  img.onerror = () => onFrameFinished(i, 'f2');
  frames2.push(img);
}

for (let i = 1; i <= F3_COUNT; i++) {
  const img = new Image();
  img.src = `${BASE}/frames3/frame_${pad(i)}.webp`;
  img.onload = () => {
    if (img.decode) {
      img.decode().catch(() => {}).finally(() => onFrameFinished(i, 'f3'));
    } else {
      onFrameFinished(i, 'f3');
    }
  };
  img.onerror = () => onFrameFinished(i, 'f3');
  frames3.push(img);
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
function drawMirroredEdgesAndCenter(img, alpha = 1.0, targetCtx = ctx, targetCanvas = canvas) {
  if (!img || !img.complete || img.naturalWidth === 0) return;

  const canvasW = targetCanvas.width;
  const canvasH = targetCanvas.height;
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;

  const hRatio = canvasW / imgW;
  const vRatio = canvasH / imgH;
  const ratio = Math.min(hRatio, vRatio);

  const renderW = imgW * ratio;
  const renderH = imgH * ratio;
  const shiftX = (canvasW - renderW) / 2;
  const shiftY = (canvasH - renderH) / 2;

  targetCtx.save();
  targetCtx.globalAlpha = alpha;
  targetCtx.imageSmoothingEnabled = true;
  targetCtx.imageSmoothingQuality = 'high';

  // Fill side blank spaces by repeating / mirroring the edge pixels
  if (shiftX > 0) {
    // Left edge repeat (mirrored reflection of sky, trees, and daylight)
    targetCtx.save();
    targetCtx.translate(shiftX, 0);
    targetCtx.scale(-1, 1);
    targetCtx.drawImage(img, 0, 0, imgW * 0.35, imgH, 0, shiftY, shiftX, renderH);
    targetCtx.restore();

    // Right edge repeat (mirrored reflection, safely bounded to 0.85 width to completely exclude the watermark)
    targetCtx.save();
    targetCtx.translate(canvasW - shiftX, 0);
    targetCtx.scale(-1, 1);
    targetCtx.drawImage(img, imgW * 0.55, 0, imgW * 0.30, imgH, -shiftX, shiftY, shiftX, renderH);
    targetCtx.restore();
  }

  // Fill top & bottom blank spaces on vertical/portrait viewports
  if (shiftY > 0) {
    // Top edge repeat
    targetCtx.save();
    targetCtx.translate(0, shiftY);
    targetCtx.scale(1, -1);
    targetCtx.drawImage(img, 0, 0, imgW, imgH * 0.35, shiftX, 0, renderW, shiftY);
    targetCtx.restore();

    // Bottom edge repeat (safely bounded to avoid watermark at bottom-right)
    targetCtx.save();
    targetCtx.translate(0, canvasH - shiftY);
    targetCtx.scale(1, -1);
    targetCtx.drawImage(img, 0, imgH * 0.45, imgW, imgH * 0.32, shiftX, -shiftY, renderW, shiftY);
    targetCtx.restore();
  }

  // Draw Crisp Center Frame
  targetCtx.drawImage(img, shiftX, shiftY, renderW, renderH);
  targetCtx.restore();
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
// ----------------------------------------------------------------------------
// SECTION 3: EXPANDING ROUNDED CARD & IN-RESIDENCE LIQUID GLASS HUD
// ----------------------------------------------------------------------------
// SECTION 3: CAPSULE-SHAPED RESIDENCE REVEAL & MULTI-ZONE SCRUB (3, 4, 4-REV, 5)
// ----------------------------------------------------------------------------
let currentFrame3Idx = 0;
let lastRoomZone = -1;

function updateRoomDetails(zone) {
  if (zone === lastRoomZone) return;
  lastRoomZone = zone;

  if (zone === 1) {
    if (minimapBeaconGroup) minimapBeaconGroup.setAttribute('transform', 'translate(42, 40)');
    if (minimapZoneText) minimapZoneText.textContent = 'Zone: Outdoor Sky Terrace';
    if (roomEyebrow) roomEyebrow.textContent = '01 // RESIDENTIAL SUITE';
    if (roomTitle) roomTitle.textContent = 'Private Terrace & Sky Garden';
    if (roomDesc) roomDesc.textContent = 'Natural teak vertical battens, honed anthracite flagstones, and architectural climbing flora overlooking the Milan skyline.';
  } else if (zone === 2) {
    if (minimapBeaconGroup) minimapBeaconGroup.setAttribute('transform', 'translate(78, 44)');
    if (minimapZoneText) minimapZoneText.textContent = 'Zone: Grand Salon & Foyer';
    if (roomEyebrow) roomEyebrow.textContent = '02 // LIVING QUARTERS';
    if (roomTitle) roomTitle.textContent = 'The Grand Salon & Chandelier';
    if (roomDesc) roomDesc.textContent = 'Expansive full-height glazing transitioning into bespoke walnut joinery and custom glass sphere chandelier illumination.';
  } else if (zone === 3) {
    if (minimapBeaconGroup) minimapBeaconGroup.setAttribute('transform', 'translate(132, 40)');
    if (minimapZoneText) minimapZoneText.textContent = 'Zone: East Panorama Balcony';
    if (roomEyebrow) roomEyebrow.textContent = '03 // EAST RESIDENCE';
    if (roomTitle) roomTitle.textContent = 'East Panorama Suite & Balcony';
    if (roomDesc) roomDesc.textContent = 'Bioclimatic glass balcony and private executive salon offering sweeping panoramic vistas towards the sunrise.';
  } else if (zone === 4) {
    if (minimapBeaconGroup) minimapBeaconGroup.setAttribute('transform', 'translate(78, 44)');
    if (minimapZoneText) minimapZoneText.textContent = 'Zone: Salon Central Foyer';
    if (roomEyebrow) roomEyebrow.textContent = '04 // CENTRAL FOYER';
    if (roomTitle) roomTitle.textContent = 'Salon Foyer & North Promenade';
    if (roomDesc) roomDesc.textContent = 'Returning through the central salon axis towards the north culinary wing and private dining pavilion.';
  } else if (zone === 5) {
    if (minimapBeaconGroup) minimapBeaconGroup.setAttribute('transform', 'translate(117, 72)');
    if (minimapZoneText) minimapZoneText.textContent = 'Zone: Dining Salon & Sculptural Stoneware';
    if (roomEyebrow) roomEyebrow.textContent = '05 // BESPOKE INTERIOR';
    if (roomTitle) roomTitle.textContent = 'Sculptural Marble Dining Suite';
    if (roomDesc) roomDesc.textContent = 'Nero Marquina marble table with handcrafted stoneware vases, rounded bouclé armchairs, and minimalist architectural wall art.';
  }
}

let lastRenderedFrame3 = -1;

function renderInterior() {
  if (!canvas3) return;
  const frame = getLoadedFrame(frames3, currentFrame3Idx);
  if (!frame || !frame.complete || frame.naturalWidth === 0) return;

  // Ultra-fast draw using precomputed cover coordinates (zero layout or math overhead)
  ctx3.drawImage(frame, coverShiftX3, coverShiftY3, coverW3, coverH3);
  lastRenderedFrame3 = currentFrame3Idx;
}

const easeInOut = gsap.parseEase('power2.inOut');
let lastScaleVal = -1;
let lastRadiusVal = -1;
let lastInsetVal = -1;

ScrollTrigger.create({
  trigger: '#section-3',
  start: 'top top',
  end: 'bottom bottom',
  pin: '.interior-pinned-stage',
  pinSpacing: true,
  scrub: true,
  onUpdate: (self) => {
    const p = self.progress;
    const isMobile = window.innerWidth <= 768;
    const startScale = isMobile ? 0.78 : 0.50;
    const baseInsetX = isMobile ? 6 : 9;

    // ------------------------------------------------------------------------
    // PHASE 1: COMPACT CAPSULE EXPANDS TO FULL SCREEN (0.0 to 0.16)
    // ------------------------------------------------------------------------
    if (p <= 0.16) {
      const expandT = Math.min(1.0, Math.max(0, p / 0.16));
      const easeT = easeInOut(expandT);

      const curScale = startScale + ((1.0 - startScale) * easeT);
      const curInsetX = baseInsetX * (1 - easeT);
      const curRadiusVh = 50 * (1 - easeT);

      // 100% GPU-accelerated compositor transform (0 layout reflows)
      if (Math.abs(curScale - lastScaleVal) > 0.0004) {
        lastScaleVal = curScale;
        canvas3.style.transform = `translate(-50%, -50%) scale(${curScale.toFixed(4)})`;
      }

      if (Math.abs(curRadiusVh - lastRadiusVal) > 0.1 || Math.abs(curInsetX - lastInsetVal) > 0.05) {
        lastRadiusVal = curRadiusVh;
        lastInsetVal = curInsetX;
        if (easeT >= 0.98 || curRadiusVh <= 0.5) {
          canvas3.style.clipPath = 'none';
          canvas3.style.borderRadius = '0px';
        } else {
          canvas3.style.clipPath = `inset(0 ${curInsetX.toFixed(2)}vw 0 ${curInsetX.toFixed(2)}vw round ${curRadiusVh.toFixed(2)}vh)`;
          canvas3.style.borderRadius = `${curRadiusVh.toFixed(1)}vh`;
        }
      }

      // Editorial whitespace text smoothly fades away
      const textAlpha = Math.max(0, 1 - (expandT * 1.5));
      interiorIntroView.style.opacity = textAlpha.toFixed(3);

      // Keep HUD hidden during expansion
      if (interiorHud.classList.contains('active')) {
        interiorHud.classList.remove('active');
      }

      // Keep video on frame 0 thumbnail
      if (currentFrame3Idx !== 0 || lastRenderedFrame3 !== 0) {
        currentFrame3Idx = 0;
        updateRoomDetails(1);
        renderInterior();
      }

    } else {
      // ------------------------------------------------------------------------
      // PHASE 2: FULL-SIZE IN-RESIDENCE VIDEO SCRUB & LIQUID GLASS HUD (0.16 to 1.0)
      // ------------------------------------------------------------------------
      if (lastScaleVal !== 1.0) {
        lastScaleVal = 1.0;
        lastRadiusVal = 0;
        lastInsetVal = 0;
        canvas3.style.transform = 'translate(-50%, -50%) scale(1)';
        canvas3.style.clipPath = 'none';
        canvas3.style.borderRadius = '0px';
      }

      interiorIntroView.style.opacity = '0';

      // Reveal in-residence HUD (Minimap and Room Info Card)
      if (!interiorHud.classList.contains('active')) {
        interiorHud.classList.add('active');
      }

      // Scrub through Video 3 -> 4 -> 4(rev) -> 5 sequence across extended 546vh runway
      const scrubT = (p - 0.16) / 0.84;
      const targetFrame = Math.min(F3_COUNT - 1, Math.floor(scrubT * (F3_COUNT - 1)));

      if (targetFrame !== currentFrame3Idx) {
        currentFrame3Idx = targetFrame;
        renderInterior();
      }

      // Dynamic zone transitions matching physical room camera positions
      if (scrubT < 0.20) {
        updateRoomDetails(1); // 01 Terrace / Balcony
      } else if (scrubT < 0.44) {
        updateRoomDetails(2); // 02 Grand Salon
      } else if (scrubT < 0.62) {
        updateRoomDetails(3); // 03 East Panorama Suite (Video 4 fwd)
      } else if (scrubT < 0.80) {
        updateRoomDetails(4); // 04 Salon Foyer return (Video 4 rev)
      } else {
        updateRoomDetails(5); // 05 Sculptural Dining Suite (Video 5 fwd)
      }
    }
  }
});

// Initial layout & frame paint
updateLayout();

