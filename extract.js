import ffmpeg from 'ffmpeg-static';
import { execSync } from 'child_process';
import fs from 'fs';

if (!fs.existsSync('public')) fs.mkdirSync('public');
if (!fs.existsSync('public/frames1')) fs.mkdirSync('public/frames1', { recursive: true });
if (!fs.existsSync('public/frames2')) fs.mkdirSync('public/frames2', { recursive: true });

console.log('Extracting & Enhancing Video 1 to 1080p Lanczos HD...');
execSync(`"${ffmpeg}" -i "assets/1st.mp4" -vf "scale=1920:1080:flags=lanczos,unsharp=5:5:0.8:5:5:0.4" -q:v 2 "public/frames1/frame_%04d.jpg" -y`);
const f1Count = fs.readdirSync('public/frames1').length;
console.log('Video 1 enhanced:', f1Count, 'frames');

console.log('Extracting & Enhancing Video 2 to 1080p Lanczos HD...');
execSync(`"${ffmpeg}" -i "assets/2nd.mp4" -vf "scale=1920:1080:flags=lanczos,unsharp=5:5:0.8:5:5:0.4" -q:v 2 "public/frames2/frame_%04d.jpg" -y`);
const f2Count = fs.readdirSync('public/frames2').length;
console.log('Video 2 enhanced:', f2Count, 'frames');

console.log('High-fidelity 1080p frame enhancement complete!');
