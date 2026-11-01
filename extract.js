import ffmpeg from 'ffmpeg-static';
import { execSync } from 'child_process';
import fs from 'fs';

if (!fs.existsSync('public')) fs.mkdirSync('public');
if (!fs.existsSync('public/frames1')) fs.mkdirSync('public/frames1', { recursive: true });
if (!fs.existsSync('public/frames2')) fs.mkdirSync('public/frames2', { recursive: true });

if (!fs.existsSync('public/frames1/frame_0302.jpg')) {
  console.log('Extracting & Enhancing Video 1 to 1080p Lanczos HD...');
  execSync(`"${ffmpeg}" -i "assets/1st.mp4" -vf "scale=1920:1080:flags=lanczos,unsharp=5:5:0.8:5:5:0.4" -q:v 2 "public/frames1/frame_%04d.jpg" -y`);
}
const f1Count = fs.readdirSync('public/frames1').length;
console.log('Video 1 frames ready:', f1Count);

if (!fs.existsSync('public/frames2/frame_0240.jpg')) {
  console.log('Extracting & Enhancing Video 2 to 1080p Lanczos HD...');
  execSync(`"${ffmpeg}" -i "assets/2nd.mp4" -vf "scale=1920:1080:flags=lanczos,unsharp=5:5:0.8:5:5:0.4" -q:v 2 "public/frames2/frame_%04d.jpg" -y`);
}
const f2Count = fs.readdirSync('public/frames2').length;
console.log('Video 2 frames ready:', f2Count);

if (!fs.existsSync('public/frames3')) fs.mkdirSync('public/frames3', { recursive: true });

if (!fs.existsSync('public/frames3/frame_0240.jpg')) {
  console.log('Extracting & Enhancing Video 3 to 1080p Lanczos HD...');
  execSync(`"${ffmpeg}" -i "assets/3rd.mp4" -vf "scale=1920:1080:flags=lanczos,unsharp=5:5:0.8:5:5:0.4" -q:v 2 "public/frames3/frame_%04d.jpg" -y`);
}

// Stitch Video 4 continuation: frame 191 is exact match of Video 3 frame 240, append frames 192-240 as 241-289
if (!fs.existsSync('public/frames3/frame_0289.jpg') && fs.existsSync('assets/4th.mp4')) {
  console.log('Extracting & Enhancing Video 4 continuation frames (192-240)...');
  const tempDir = 'temp_v4_extract';
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  execSync(`"${ffmpeg}" -i "assets/4th.mp4" -vf "scale=1920:1080:flags=lanczos,unsharp=5:5:0.8:5:5:0.4" -q:v 2 "${tempDir}/frame_%04d.jpg" -y`);
  
  let targetNum = 241;
  for (let s = 192; s <= 240; s++) {
    const sFile = `${tempDir}/frame_${String(s).padStart(4, '0')}.jpg`;
    const dFile = `public/frames3/frame_${String(targetNum).padStart(4, '0')}.jpg`;
    fs.copyFileSync(sFile, dFile);
    targetNum++;
  }
  fs.rmSync(tempDir, { recursive: true, force: true });
}

const f3Count = fs.readdirSync('public/frames3').length;
console.log('Video 3 + 4 sequence frames ready:', f3Count);

console.log('High-fidelity 1080p frame enhancement complete!');

