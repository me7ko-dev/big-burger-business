import Phaser from 'phaser';
import '@fontsource/rubik/cyrillic-700.css';
import '@fontsource/rubik/cyrillic-900.css';
import '@fontsource/rubik/latin-700.css';
import '@fontsource/rubik/latin-900.css';
import { W, H } from './config/game';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { MapScene } from './scenes/MapScene';
import { GameScene } from './scenes/GameScene';
import { ResultScene } from './scenes/ResultScene';
import { PauseScene } from './scenes/PauseScene';
import { ShopScene } from './scenes/ShopScene';
import { TasksScene } from './scenes/TasksScene';
import { save } from './data/save';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  backgroundColor: '#ff8f00',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: true, roundPixels: false },
  input: { activePointers: 3 },
  scene: [BootScene, MenuScene, MapScene, GameScene, ResultScene, PauseScene, ShopScene, TasksScene],
});

// за тестове
(window as unknown as { __game: Phaser.Game }).__game = game;

// на телефон в браузъра: цял екран и хоризонтално при първото докосване
const isTouch = matchMedia('(pointer: coarse)').matches;
const standalone = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
if (isTouch && !standalone) {
  const goFull = () => {
    const el = document.documentElement;
    el.requestFullscreen?.({ navigationUI: 'hide' })
      .then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape'))
      .catch(() => undefined);
  };
  window.addEventListener('pointerup', goFull, { once: true });
}

window.addEventListener('beforeunload', () => save());
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  });
}
