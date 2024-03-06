import * as ControlRouter from "../src/control-router";

const assets: { [key: string]: ImageBitmap } = {};
let cnvWorker: Worker;

let gameRunning: boolean = false;

let px = 0;
let py = 0;
let v = 5 * window.devicePixelRatio;

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

}

function initCanvas(): void {

  const W = 200;
  const H = 200;
  const SCALE = 2;

  const cnv = document.querySelector("canvas")!;
  cnv.width = W * window.devicePixelRatio;
  cnv.height = H * window.devicePixelRatio;
  cnv.style.width = `${W * SCALE}px`;
  cnv.style.height = `${H * SCALE}px`;

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
      py -= v;
    },
    "ArrowDown": () => {
      py += v;
    },
    "ArrowLeft": () => {
      px -= v;
    },
    "ArrowRight": () => {
      px += v;
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
    px: px, py: py, 
  });

  if (gameRunning) {
    window.requestAnimationFrame(drawFrame); 
  }

}