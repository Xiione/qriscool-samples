import fs from "fs";
import path from "path";

import {createCanvas, loadImage} from "canvas";
import jsQR from "jsqr-es6";
import {initWASM} from "jsqr-es6/decoder/reedsolomon"

await initWASM();

async function generateMetadata() {
  const imagesDir = path.join(__dirname, '.', 'samples');
  const files = fs.readdirSync(imagesDir);
  const metadata = {};

  for (const file of files) {
    if (!file.match(/\.(jpg|png|jpeg|gif)$/i)) continue;

    const filePath = path.join(imagesDir, file);
    const buffer = fs.readFileSync(filePath);

    // Load the image from the Buffer
    const image = await loadImage(buffer);

    // Create a canvas matching the image size
    const metadata: any = {};
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d', { alpha: false });

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0);

    const imageData = ctx.getImageData(0, 0, image.width, image.height);
    const res = jsQR(imageData.data, image.width, image.height);
    if (!res) throw new Error(`File ${filePath} failed to scan`);

    const basename = path.basename(file, ".png");
    metadata[basename] = res.ecLevel;
    console.log(`${basename.padEnd(15, " ")} ${res.ecLevel}`);
  }

  const outputPath = path.join(__dirname, '.', 'ecLevels.json');
  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
  console.log(`Finished generating ${files.length} images' data`);
}

generateMetadata().catch(err => {
  console.error(err);
  process.exit(1);
});

