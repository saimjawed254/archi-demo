import ffmpeg from 'ffmpeg-static';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function pad(num, size = 4) {
  let s = num + '';
  while (s.length < size) s = '0' + s;
  return s;
}

if (!fs.existsSync('public')) fs.mkdirSync('public');
if (!fs.existsSync('public/frames1')) fs.mkdirSync('public/frames1', { recursive: true });
if (!fs.existsSync('public/frames2')) fs.mkdirSync('public/frames2', { recursive: true });
if (!fs.existsSync('public/frames3')) fs.mkdirSync('public/frames3', { recursive: true });

// Video 1: 151 WebP frames (Step 2 sampling from 302 frames)
if (!fs.existsSync('public/frames1/frame_0151.webp')) {
  console.log('Extracting Video 1 to 151 WebP frames (Step 2 sampling)...');
  execSync(`"${ffmpeg}" -i "assets/1st.mp4" -vf "select='not(mod(n\\,2))',scale=1920:1080:flags=lanczos,unsharp=5:5:0.8:5:5:0.4" -vsync vfr -c:v libwebp -quality 65 "public/frames1/frame_%04d.webp" -y`);
}
console.log('Video 1 frames ready:', fs.readdirSync('public/frames1').length);

// Video 2: 120 WebP frames (Step 2 sampling from 240 frames)
if (!fs.existsSync('public/frames2/frame_0120.webp')) {
  console.log('Extracting Video 2 to 120 WebP frames (Step 2 sampling)...');
  execSync(`"${ffmpeg}" -i "assets/2nd.mp4" -vf "select='not(mod(n\\,2))',scale=1920:1080:flags=lanczos,unsharp=5:5:0.8:5:5:0.4" -vsync vfr -c:v libwebp -quality 65 "public/frames2/frame_%04d.webp" -y`);
}
console.log('Video 2 frames ready:', fs.readdirSync('public/frames2').length);

// Video 3 + 4 Continuation: 145 WebP frames (Step 2 sampling from 289 frames)
if (!fs.existsSync('public/frames3/frame_0145.webp')) {
  console.log('Extracting Video 3 + 4 sequence to 145 WebP frames...');
  // Video 3 frames 1 to 240 (sampled to 120 frames)
  const temp3 = 'temp_v3_extract';
  if (!fs.existsSync(temp3)) fs.mkdirSync(temp3, { recursive: true });
  execSync(`"${ffmpeg}" -i "assets/3rd.mp4" -vf "select='not(mod(n\\,2))',scale=1920:1080:flags=lanczos,unsharp=5:5:0.8:5:5:0.4" -vsync vfr -c:v libwebp -quality 65 "${temp3}/frame_%04d.webp" -y`);

  for (let i = 1; i <= 120; i++) {
    fs.copyFileSync(`${temp3}/frame_${pad(i)}.webp`, `public/frames3/frame_${pad(i)}.webp`);
  }
  fs.rmSync(temp3, { recursive: true, force: true });

  // Video 4 continuation: frames 192-240 (49 frames sampled to 25 frames)
  if (fs.existsSync('assets/4th.mp4')) {
    const temp4 = 'temp_v4_extract';
    if (!fs.existsSync(temp4)) fs.mkdirSync(temp4, { recursive: true });
    execSync(`"${ffmpeg}" -i "assets/4th.mp4" -vf "scale=1920:1080:flags=lanczos,unsharp=5:5:0.8:5:5:0.4" -vsync vfr -c:v libwebp -quality 65 "${temp4}/frame_%04d.webp" -y`);

    let targetNum = 121;
    for (let s = 192; s <= 240; s += 2) {
      const sFile = `${temp4}/frame_${pad(s)}.webp`;
      const dFile = `public/frames3/frame_${pad(targetNum)}.webp`;
      if (fs.existsSync(sFile)) {
        fs.copyFileSync(sFile, dFile);
        targetNum++;
      }
    }
    fs.rmSync(temp4, { recursive: true, force: true });
  }
}
console.log('Video 3 + 4 frames ready:', fs.readdirSync('public/frames3').length);

console.log('Step-2 WebP frame pipeline complete!');
