import * as ControlRouter from "../src/control-router";

const assets: { [key: string]: ImageBitmap } = {};
let cnvWorker: Worker;

let x = 0;
let y = 0;
let v = 25;

let running: boolean = false;

(async () => {
  await loadAssets();
  initCanvas();
  initControlRouter();
})();

async function loadAssets(): Promise<void> {

  const assetPaths = [
    "map",
  ];

  for (let path of assetPaths) {
    const res = await fetch(`assets/${path}.png`);
    assets[path] = await createImageBitmap(await res.blob());
  }

}

function initCanvas(): void {

  const cnv = document.querySelector("canvas")!;
  const w = cnv.parentElement?.clientWidth!;
  const h = cnv.parentElement?.clientHeight!;

  cnv.width = w * window.devicePixelRatio;
  cnv.height = h * window.devicePixelRatio;
  cnv.style.width = `${w}px`;
  cnv.style.height = `${h}px`;

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
      running = !running;
      if (running) {
        window.requestAnimationFrame(drawFrame);
      }
    },

  };

  const chartControls = {

    "ArrowUp": () => { y += v; },
    "ArrowDown": () => { y -= v; },
    "ArrowLeft": () => { x += v; },
    "ArrowRight": () => { x -= v; },
    "*Space ArrowUp": () => { y += v*4; },
    "*Space ArrowDown": () => { y -= v*4; },
    "*Space ArrowLeft": () => { x += v*4; },
    "*Space ArrowRight": () => { x -= v*4; },

  };

  cr.addControlMap("chart", {
    ...metaControls,
    ...chartControls,
  });

  cr.setControlMap("chart");

}

function drawFrame(): void {

  cnvWorker.postMessage({ 
    msg: "draw",
    x: x, y: y,
  });

  if (running) {
    window.requestAnimationFrame(drawFrame); 
  }

}