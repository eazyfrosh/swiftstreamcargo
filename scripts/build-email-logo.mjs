// Rasterize the existing LogoMark geometry for email clients that cannot show SVG.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108" viewBox="0 0 36 36">
  <rect width="36" height="36" rx="12" fill="#ffffff"/>
  <svg x="8" y="8" width="20" height="20" viewBox="0 0 24 24">
    <path d="M4 7.25c2.1-2.1 5.2-3 8.3-2.2 2.1.5 3.8 1.7 5.1 3.1" stroke="#C24500" stroke-width="2.15" stroke-linecap="round" fill="none"/>
    <path d="M20 16.2c-2.2 2.3-5.6 3.2-8.9 2.2-2.2-.7-4-2-5.3-3.8" stroke="#C24500" stroke-width="2.15" stroke-linecap="round" fill="none"/>
    <path d="M5 11.8h12.2" stroke="#C24500" stroke-width="2.15" stroke-linecap="round" opacity=".72"/>
    <path d="m14.8 9.2 3 2.6-3 2.6" stroke="#C24500" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </svg>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(
  fileURLToPath(new URL('../public/images/email-logo.png', import.meta.url)),
);
