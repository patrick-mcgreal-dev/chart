import * as ControlRouter from "../src/control-router";

const CANVAS = {
  w: 200, h: 200, scale: 2,
};

const PLAYER = {
  x: 0, y: 0, v: 5 * window.devicePixelRatio,
};

console.log(PLAYER.x);

const assets: { [key: string]: ImageBitmap } = {};
let cnvWorker: Worker;

let gameRunning: boolean = false;

(async () => {
  await loadAssets();
  initCanvas();
  initControlRouter();
})();

async function loadAssets(): Promise<void> {

  const assetPaths = [
    "player",
  ];

  for (let path of assetPaths) {
    const res = await fetch(`assets/${path}.png`);
    assets[path] = await createImageBitmap(await res.blob());
  }

  PLAYER.x = (CANVAS.w * window.devicePixelRatio) / 2 - (assets.player.width / 2);
  PLAYER.y = (CANVAS.h * window.devicePixelRatio) - (assets.player.height * 3);

}

function initCanvas(): void {

  const cnv = document.querySelector("canvas")!;
  cnv.width = CANVAS.w * window.devicePixelRatio;
  cnv.height = CANVAS.h * window.devicePixelRatio;
  cnv.style.width = `${CANVAS.w * CANVAS.scale}px`;
  cnv.style.height = `${CANVAS.h * CANVAS.scale}px`;

  const offscreenCnv = cnv.transferControlToOffscreen();

  cnvWorker = new Worker("cnv-worker.js");
  cnvWorker.postMessage({
    msg: "init",
    offscreenCnv: offscreenCnv,
    assets: assets,
  }, [ offscreenCnv ]);

}

function initControlRouter(): void {

  const cr = ControlRouter.get();

  const metaControls = {

    "Escape": () => {
      gameRunning = !gameRunning;
      if (gameRunning) {
        window.requestAnimationFrame(drawFrame);
      }
    },

  };

  const gameControls = {

    "ArrowUp": () => {
      PLAYER.y -= PLAYER.v;
    },
    "ArrowDown": () => {
      PLAYER.y += PLAYER.v;
    },
    "ArrowLeft": () => {
      PLAYER.x -= PLAYER.v;
    },
    "ArrowRight": () => {
      PLAYER.x += PLAYER.v;
    },

  };

  cr.addControlMap("game", {
    ...metaControls,
    ...gameControls,
  });

  cr.setControlMap("game");

}

function drawFrame(): void {

  cnvWorker.postMessage({ 
    msg: "draw",
    p: PLAYER,
  });

  if (gameRunning) {
    window.requestAnimationFrame(drawFrame); 
  }

}