const path = require('path');
const sharp = require('sharp');
const crypto = require('crypto');
const fs = require('fs');

const repo = path.resolve(__dirname, '..');
const source = path.join(repo, 'assets/gordon-hinchen-card-portrait-v2.png');
const ogImage = path.join(repo, 'assets/gordon-hinchen-sharing-preview-v2.jpg');
const logo = path.join(repo, 'assets/drg-logo.png');

async function run() {
  // Use the exact approved source, with compositional crop/scale only.
  const hash = crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
  if (hash !== 'e15df059434e0798a7b066b17fa85bfdf33bb1494815d2beaef57a455a943697') {
    throw new Error('Portrait does not match the approved current source');
  }
  const portrait = await sharp(source)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const meta = await sharp(portrait).metadata();
  const cropHeight = Math.min(meta.height, 1800);

  const ogPortrait = await sharp(portrait)
    .extract({ left: 0, top: 0, width: meta.width, height: cropHeight })
    .resize({ height: 610, fit: 'inside', withoutEnlargement: false })
    .png()
    .toBuffer();

  const rawLogo = await sharp(logo).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } }).ensureAlpha().png().toBuffer();
  const logoMeta = await sharp(rawLogo).metadata();
  const { data: logoPixels, info: logoInfo } = await sharp(rawLogo).raw().toBuffer({ resolveWithObject: true });
  for (let offset = 0; offset < logoPixels.length; offset += logoInfo.channels) {
    logoPixels[offset] = 255;
    logoPixels[offset + 1] = 255;
    logoPixels[offset + 2] = 255;
  }
  const whiteLogo = await sharp(logoPixels, {
    raw: { width: logoMeta.width, height: logoMeta.height, channels: logoInfo.channels },
  }).resize({ width: 250, fit: 'inside' }).png().toBuffer();

  const background = Buffer.from(`
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#174c81"/>
          <stop offset="0.58" stop-color="#08264a"/>
          <stop offset="1" stop-color="#03162e"/>
        </linearGradient>
        <radialGradient id="glow" cx="0.22" cy="0.22" r="0.48">
          <stop offset="0" stop-color="#4279ad" stop-opacity="0.62"/>
          <stop offset="1" stop-color="#08264a" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
      <rect width="1200" height="630" fill="url(#glow)"/>
      <circle cx="285" cy="318" r="254" fill="none" stroke="#d8ad56" stroke-width="8"/>
      <circle cx="285" cy="318" r="274" fill="none" stroke="#f2d28a" stroke-width="2" opacity=".55"/>
      <!-- Sweeping strings stay below all text; large portrait circles are unchanged. -->
      <path d="M-30 548 C330 520 650 610 1260 540" fill="none" stroke="#d8ad56" stroke-width="9" opacity=".92"/>
      <path d="M-20 590 C350 560 720 640 1260 585" fill="none" stroke="#f2d28a" stroke-width="3" opacity=".56"/>
      <style>
        .name { font: 700 56px Arial, Helvetica, sans-serif; fill: #fff; }
        .role { font: 500 28px Arial, Helvetica, sans-serif; fill: #f2d28a; }
        .nmls { font: 400 22px Arial, Helvetica, sans-serif; fill: #dce8f5; }
      </style>
      <text x="650" y="405" class="name">Gordon Hinchen</text>
      <text x="652" y="451" class="role">Mortgage Loan Officer</text>
      <text x="652" y="490" class="nmls">NMLS #2751302</text>
    </svg>`);

  await sharp(background)
    .composite([
      { input: ogPortrait, left: 48, top: 18 },
      { input: whiteLogo, left: 900, top: 74 },
    ])
    .jpeg({ quality: 94, chromaSubsampling: '4:4:4', mozjpeg: true })
    .toFile(ogImage);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
