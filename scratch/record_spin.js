import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function main() {
  const videoDir = '/home/alex/.gemini/antigravity-cli/brain/7a85f1f0-c4a8-44d3-ace7-3d1226ad30e6/videos';
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: videoDir,
      size: { width: 1280, height: 720 }
    },
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();
  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173');

  await page.waitForTimeout(500);

  console.log('Triggering Vampire Survivors Vertical Reel Spin...');
  await page.locator('#trigger-spin-area').click();

  // Wait for the full 4.5 seconds animation + reveal + return transition
  await page.waitForTimeout(5000);

  const videoPath = await page.video().path();
  console.log('Video saved to:', videoPath);

  await context.close();
  await browser.close();
  console.log('Done recording video!');
}

main().catch(err => {
  console.error('Error recording video:', err);
  process.exit(1);
});
