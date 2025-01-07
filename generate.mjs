import fs from "fs";
import path from "path";

import { createCanvas, loadImage } from "canvas";
import jsQR from "jsqr-es6";
import { initWASM } from "jsqr-es6/decoder/reedsolomon";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

await initWASM();

const greyScaleWeights = {
  red: 77,
  green: 150,
  blue: 29,
  useIntegerApproximation: true,
};

async function generateMetadata() {
  const imagesDir = path.join(__dirname, ".", "samples");
  const files = fs.readdirSync(imagesDir);
  const metadata = {};

  for (const file of files) {
    if (!file.match(/\.(jpg|png|jpeg|gif)$/i)) continue;

    const filePath = path.join(imagesDir, file);
    const buffer = fs.readFileSync(filePath);
    const basename = path.basename(file, ".png");

    // Load the image from the Buffer
    const image = await loadImage(buffer);

    // Create a canvas matching the image size
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d", { alpha: false });

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, image.width, image.height);
    const res = jsQR(imageData.data, image.width, image.height, {
      inversionAttempts: "attemptBoth",
      greyScaleWeights,
    });
    if (!res) {
      console.error(`File ${basename} failed to scan`);
      continue;
    }

    metadata[basename] = res.ecLevel;
    console.log(`${basename.padEnd(15, " ")} ${res.ecLevel}`);
  }

  const outputPath = path.join(__dirname, ".", "ecLevels.json");
  const data = JSON.stringify(metadata, null, 2);
  fs.writeFileSync(outputPath, data);
  console.log(`Finished generating ${files.length} images' data`);
}

generateMetadata().catch((err) => {
  console.error(err);
  process.exit(1);
});
