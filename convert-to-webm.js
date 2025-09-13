#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const inputDir = path.resolve(process.argv[2] || "./videos");
const deleteOriginals = process.argv.includes("--delete");
const forceReencode = process.argv.includes("--force");

// ---------- Helpers ----------
function hasAudioStream(filePath) {
  try {
    const probe = execSync(
      `ffprobe -v error -select_streams a:0 -show_entries stream=codec_type -of csv=p=0 "${filePath}"`,
      { stdio: ["ignore", "pipe", "pipe"] }
    )
      .toString()
      .trim();
    return probe.length > 0;
  } catch {
    // ffprobe not installed or no audio stream found
    return false;
  }
}

function checkFfmpeg() {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
  } catch {
    console.error(
      "❌ ffmpeg not found. Install it and ensure it's on your PATH."
    );
    process.exit(1);
  }
}

function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    console.error("❌ Input directory does not exist:", dir);
    process.exit(1);
  }
}

// ---------- Main ----------
checkFfmpeg();
ensureDirExists(inputDir);

console.log("🎞️ Starting video → WebM conversion");
console.log("📁 Input directory:", inputDir);

const accepted = [".gif", ".mp4", ".mov", ".avi", ".mkv", ".webm"];
const files = fs.readdirSync(inputDir);

files.forEach((file) => {
  const ext = path.extname(file).toLowerCase();
  const base = path.basename(file, ext);
  if (!accepted.includes(ext)) return;

  const inputPath = path.join(inputDir, file);
  const outputPath = path.join(inputDir, `${base}.webm`);

  // Skip existing .webm unless forced
  if (ext === ".webm" && !forceReencode) {
    console.log(`⏭️  Skipping already-webm: ${file}`);
    return;
  }

  // Avoid overwriting if output exists (unless force)
  if (fs.existsSync(outputPath) && !forceReencode) {
    console.log(`⏭️  Output exists, skipping: ${path.basename(outputPath)}`);
    return;
  }

  // Build ffmpeg command
  const audioFlag = hasAudioStream(inputPath) ? `-c:a libopus -b:a 96k` : `-an`;

  // Notes:
  // -crf 28 is a good default (lower = better quality, larger file). Try 23–30 range.
  // -cpu-used 4 balances speed/quality; higher is faster/worse. Use 0–5.
  // -row-mt 1 enables row-based multi-threading for libvpx-vp9.
  // Scale ensures even dimensions (libvpx requirement).
  const cmd = [
    `ffmpeg -y -i "${inputPath}"`,
    `-c:v libvpx-vp9 -b:v 0 -crf 28 -row-mt 1 -threads ${Math.max(
      1,
      require("os").cpus().length - 1
    )}`,
    `-pix_fmt yuv420p -deadline good -cpu-used 4`,
    `-vf "scale=ceil(iw/2)*2:ceil(ih/2)*2"`,
    audioFlag,
    `"${outputPath}"`,
  ].join(" ");

  try {
    execSync(cmd, { stdio: "inherit" });
    console.log(`✅ Converted: ${file} → ${path.basename(outputPath)}`);

    if (deleteOriginals) {
      fs.unlinkSync(inputPath);
      console.log(`🗑 Deleted original: ${file}`);
    }
  } catch (err) {
    console.error(`❌ Failed to convert ${file}:`, err?.message || err);
  }
});

console.log("✅ All videos processed.");
