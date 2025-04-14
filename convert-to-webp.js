// convert-to-webp.js
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve full input directory path relative to this script
const inputDir = path.resolve(__dirname, process.argv[2] || "./images");
const deleteOriginals = process.argv.includes("--delete");

console.log("🔄 Starting WebP conversion");
console.log("📁 Input directory:", inputDir);

fs.readdir(inputDir, async (err, files) => {
  if (err) {
    console.error("❌ Failed to read input directory:", err);
    return;
  }

  const supportedExtensions = [".png", ".jpg", ".jpeg"];

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const base = path.basename(file, ext);

    if (!supportedExtensions.includes(ext)) continue;

    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(inputDir, `${base}.webp`);

    try {
      await sharp(inputPath).webp({ quality: 80 }).toFile(outputPath);
      console.log(`✅ Converted: ${file} → ${base}.webp`);

      if (deleteOriginals) {
        fs.unlinkSync(inputPath);
        console.log(`🗑 Deleted original: ${file}`);
      }
    } catch (err) {
      console.error(`❌ Failed to convert ${file}:`, err.message);
    }
  }

  console.log("✅ Done.");
});
