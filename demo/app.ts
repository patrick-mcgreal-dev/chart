import * as ControlRouter from "../src/control-router";

const assets: { [key: string]: ImageBitmap } = {};

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

  const offscreen = cnv.transferControlToOffscreen();

  const worker = new Worker("cnv-worker.js");
  worker.postMessage({
    msg: "init"
  }, [ offscreen ]);

}

function initControlRouter(): void {

  const cr = ControlRouter.get();

  const metaControls = {

    "Escape": () => {
      console.log("menu");
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