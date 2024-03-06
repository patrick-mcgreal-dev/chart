import * as ControlRouter from "../src/control-router";

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

}

function initCanvas(): void {

  const W = 500;
  const H = 300;

  const cnv = document.querySelector("canvas")!;
  cnv.width = W * window.devicePixelRatio;
  cnv.height = H * window.devicePixelRatio;
  cnv.style.width = `${W}px`;
  cnv.style.height = `${H}px`;

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
      console.log("up");
    },
    "ArrowDown": () => {
      console.log("down");
    },
    "ArrowLeft": () => {
      console.log("left");
    },
    "ArrowRight": () => {
      console.log("right");
    },

  };

  cr.addControlMap("game", {
    ...metaControls,
    ...gameControls,
  });

  cr.setControlMap("game");

}

function drawFrame(): void {

  cnvWorker.postMessage({ msg: "draw" });

  if (gameRunning) {
    window.requestAnimationFrame(drawFrame); 
  }

}