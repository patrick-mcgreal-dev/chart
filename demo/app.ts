import * as ControlRouter from "../src/control-router";

const assets: { [key: string]: ImageBitmap } = {};

let cnv: HTMLCanvasElement;
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

  cnv = document.querySelector("canvas")!;
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

    "Enter": () => {
      running = true;
      window.requestAnimationFrame(drawFrame);
      cr.setControlMap("chart");
    },
    "Escape": () => {
      running = false;
      cr.setControlMap("menu");
    },

  };

  const chartControls = {

    "ArrowUp": () => { move(0, v) },
    "ArrowDown": () => { move(0, -v) },
    "ArrowLeft": () => { move(v, 0) },
    "ArrowRight": () => { move(-v, 0) },
    "*Space ArrowUp": () => { move(0, v*4) },
    "*Space ArrowDown": () => { move(0, v*-4) },
    "*Space ArrowLeft": () => { move(v*4, 0) },
    "*Space ArrowRight": () => { move(v*-4, 0) },

  };

  function move(xv, yv) {
    x += xv;
    if (x > 0) {
      x = 0;
    } else if (Math.abs(x) > assets.map.width - cnv.width) {
      x = -(assets.map.width - cnv.width);
    }
    y += yv;
    if (y > 0) {
      y = 0;
    } else if (Math.abs(y) > assets.map.height - cnv.height) {
      y = -(assets.map.height - cnv.height);
    }
  }

  cr.addControlMap("menu", {
    ...metaControls,
  });

  cr.addControlMap("chart", {
    ...metaControls,
    ...chartControls,
  });

  cr.setControlMap("menu");

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