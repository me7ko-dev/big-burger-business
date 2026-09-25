// Прави иконите на приложението от картинката на бургера в играта.
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto('http://localhost:4173/');
await page.waitForFunction(() => window.__game && window.__game.scene.isActive('Menu'), null, { timeout: 30000 });
for (const [size, name, pad] of [[512, 'icon-512.png', 0.16], [192, 'icon-192.png', 0.16], [512, 'icon-maskable.png', 0.26], [180, 'apple-touch-icon.png', 0.14], [64, 'favicon.png', 0.06], [256, '../desktop/icon.png', 0.1]]) {
  const data = await page.evaluate(([size, pad]) => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(size / 2, size * 0.45, size * 0.1, size / 2, size / 2, size * 0.75);
    g.addColorStop(0, '#ffc53a');
    g.addColorStop(1, '#ff6f00');
    x.fillStyle = g;
    x.fillRect(0, 0, size, size);
    // лъчи
    x.save();
    x.translate(size / 2, size / 2);
    x.fillStyle = 'rgba(255,255,255,0.14)';
    for (let i = 0; i < 12; i++) { x.rotate(Math.PI / 6); x.beginPath(); x.moveTo(0, 0); x.lineTo(size, -size * 0.13); x.lineTo(size, size * 0.13); x.fill(); }
    x.restore();
    const src = window.__game.textures.get('logo_burger').getSourceImage();
    const w = size * (1 - pad * 2), h = (w * src.height) / src.width;
    x.drawImage(src, (size - w) / 2, (size - h) / 2 + size * 0.02, w, h);
    return c.toDataURL('image/png');
  }, [size, pad]);
  fs.writeFileSync('public/' + name, Buffer.from(data.split(',')[1], 'base64'));
  console.log('wrote', name);
}
await browser.close();
