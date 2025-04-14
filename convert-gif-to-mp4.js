import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputDir = path.resolve(__dirname, process.argv[2] || "./images");
const deleteOriginals = process.argv.includes("--delete");

console.log("🎞️ Starting GIF → MP4 conversion");
console.log("📁 Input directory:", inputDir);

fs.readdirSync(inputDir).forEach((file) => {
  const ext = path.extname(file).toLowerCase();
  const base = path.basename(file, ext);

  if (ext !== ".gif") return;

  const inputPath = path.join(inputDir, file);
  const outputPath = path.join(inputDir, `${base}.mp4`);

  try {
    execSync(
      `ffmpeg -y -i "${inputPath}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${outputPath}"`,
      { stdio: "inherit" }
    );
    console.log(`✅ Converted: ${file} → ${base}.mp4`);

    if (deleteOriginals) {
      fs.unlinkSync(inputPath);
      console.log(`🗑 Deleted original: ${file}`);
    }
  } catch (err) {
    console.error(`❌ Failed to convert ${file}:`, err.message);
  }
});

console.log("✅ All GIFs processed.");
