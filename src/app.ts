import * as ControlRouter from "../src/control-router";

const assets: { [key: string]: ImageBitmap } = {};

const chartEvents: Array<{
  element: HTMLElement,
  listener: string,
  fn: (e: Event) => void,
}> = [];

let cnv: HTMLCanvasElement;
let cnvWorker: Worker;
let cr: ControlRouter.API;

let x = 0;
let y = 0;
let z = 1;
let v = 25;

let running: boolean = false;

(async () => {
  await loadAssets();
  initCanvas();
  initControls();
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

  cnvWorker.postMessage({
    msg: "draw",
    x: x, y: y, z: z,
  });

}

function initControls(): void {

  cr = ControlRouter.get();

  const metaControls = {

    "Enter": chart_activate,
    "Escape": chart_deactivate,

  };

  const chartControls = {

    "ArrowUp": () => { chart_move(0, -v) },
    "ArrowDown": () => { chart_move(0, v) },
    "ArrowLeft": () => { chart_move(-v, 0) },
    "ArrowRight": () => { chart_move(v, 0) },
    "*Space ArrowUp": () => { chart_move(0, v*-4) },
    "*Space ArrowDown": () => { chart_move(0, v*4) },
    "*Space ArrowLeft": () => { chart_move(v*-4, 0) },
    "*Space ArrowRight": () => { chart_move(v*4, 0) },
    "*MetaLeft ArrowUp": () => { chart_zoom(1) },
    "*MetaLeft ArrowDown": () => { chart_zoom(-1) },

  };

  cr.addControlMap("menu", {
    ...metaControls,
  });

  cr.addControlMap("chart", {
    ...metaControls,
    ...chartControls,
  });

  cr.setControlMap("menu");

  let drag = false;

  chartEvents.push({
    element: cnv,
    listener: "mousedown",
    fn: function (e: Event): void {
      drag = true;
    }
  });

  chartEvents.push({
    element: cnv,
    listener: "mousemove",
    fn: function (e: Event): void {
      if (!drag) return;
      chart_move(
        -(<MouseEvent>e).movementX * 2, 
        -(<MouseEvent>e).movementY * 2);
    }
  });

  chartEvents.push({
    element: cnv,
    listener: "wheel",
    fn: function (e: Event): void {
      if ((<WheelEvent>e).deltaY > 1) {
        chart_zoom(-1);
      } else {
        chart_zoom(1);
      }
    }
  });

  chartEvents.push({
    element: document.body,
    listener: "mouseup",
    fn: function (e: Event): void {
      drag = false;
    }
  });

}

function chart_activate(): void {

  cr.setControlMap("chart");

  for (let event of chartEvents) {
    event.element.addEventListener(event.listener, event.fn);
  }

  running = true;
  window.requestAnimationFrame(chart_drawFrame);

}

function chart_deactivate(): void {
  
  cr.setControlMap("menu");

  for (let event of chartEvents) {
    event.element.removeEventListener(event.listener, event.fn);
  }

  running = false;

}

function chart_move(xv: number, yv: number): void {
  x += xv;
  if (x < 0) {
    x = 0;
  } 
  else if (x > assets.map.width - (cnv.width / z)) {
    x = assets.map.width - (cnv.width / z);
  }
  y += yv;
  if (y < 0) {
    y = 0;
  } else if (y > assets.map.height - (cnv.height / z)) {
    y = assets.map.height - (cnv.height / z);
  }
}

function chart_zoom(mult: number): void {
  let lastZ = z;
  if (mult > 0) {
    if (z == 3) return;
    z++;
  } else {
    if (z == 1) return;
    z--;
  }
  x += ((cnv.width - (cnv.width / z)) / 2) - ((cnv.width - (cnv.width / lastZ)) / 2);
  y += ((cnv.height - (cnv.height / z)) / 2) - ((cnv.height - (cnv.height / lastZ)) / 2);
  chart_move(0, 0);
}

function chart_drawFrame(): void {

  cnvWorker.postMessage({ 
    msg: "draw",
    x: x, y: y, z: z,
  });

  if (running) {
    window.requestAnimationFrame(chart_drawFrame); 
  }

}