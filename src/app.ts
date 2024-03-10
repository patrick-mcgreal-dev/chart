import * as ControlRouter from "../src/control-router";
import Data from "./data.json";

const assets: { [key: string]: ImageBitmap } = {};

const chartEvents: Array<{
  element: HTMLElement | Window,
  listener: string,
  fn: (e: Event) => void,
}> = [];

let cnv: HTMLCanvasElement;
let cnvRect: DOMRect;
let cnvWorker: Worker;
let cr: ControlRouter.API;

let detail: HTMLDivElement;

let x = 0;
let y = 0;
let v = 100;

const zMin = .3;
const zMax = 2.5;
let z = .6;

let running: boolean = false;

const pins: Array<{ label: string, pos: number[] }> = Data.map(d => ({ 
  label: d.label, 
  pos: d.pos 
}));

const pinDetails: Array<{ detail: string, img: string }> = Data.map(d => ({
  detail: d.detail,
  img: d.img,
}));

(async () => {
  await loadAssets();
  initCanvas();
  initDetail();
  initControls();
  chart_activate();
})();

async function loadAssets(): Promise<void> {

  const assetPaths = [
    "map",
    "pin",
    "pinuser",
  ];

  for (let path of assetPaths) {
    const res = await fetch(`assets/${path}.png`);
    assets[path] = await createImageBitmap(await res.blob());
  }

}

function initCanvas(): void {

  cnv = document.querySelector("canvas")!;
  const w = cnv.parentElement!.clientWidth;
  const h = cnv.parentElement!.clientHeight;

  cnvRect = cnv.getBoundingClientRect();

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
  }, [offscreenCnv]);

}

function initDetail(): void {

  detail = <HTMLDivElement>document.getElementById("chart-detail")!;
  detail.querySelector(".x")!.addEventListener("click", detail_hide);

}

function initControls(): void {

  let dragging = false;
  let marking = false;
  let pinIndex = -1;

  cr = ControlRouter.get();

  cr.addControlMap("chart", {

    "ArrowUp": () => { chart_move(0, -v); return true; },
    "ArrowDown": () => { chart_move(0, v); return true; },
    "ArrowLeft": () => { chart_move(-v, 0); return true; },
    "ArrowRight": () => { chart_move(v, 0); return true; },
    "*ShiftLeft ArrowUp": () => { chart_zoom(1) },
    "*ShiftLeft ArrowDown": () => { chart_zoom(-1) },
    "ShiftLeft": () => { marking = true },
    "-*ShiftLeft": () => { marking = false },
    
  });

  chartEvents.push({
    element: cnv,
    listener: "mousedown",
    fn: (e: Event): void => {
      dragging = true;
      cnv.style.cursor = "move";
    }
  });

  chartEvents.push({
    element: cnv,
    listener: "mousemove",
    fn: (e: Event): void => {
      if (dragging) {
        detail.style.opacity = ".4";
        chart_move(
          -(<MouseEvent>e).movementX * 1.5 / z,
          -(<MouseEvent>e).movementY * 1.5 / z
        );
      } else {
        const relCoords = chart_getRelativeCoords((<MouseEvent>e).clientX, (<MouseEvent>e).clientY);
        pinIndex = chart_pinHit(relCoords[0], relCoords[1]);
        if (pinIndex > -1) {
          cnv.style.cursor = "pointer";
        } else {
          cnv.style.cursor = "default";
        }
      }
    }
  });

  chartEvents.push({
    element: cnv,
    listener: "wheel",
    fn: (e: Event): void => {
      e.preventDefault();
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
    fn: (e: Event): void => {
      dragging = false;
      detail.style.opacity = "1";
      cnv.style.cursor = "default";
    }
  });

  chartEvents.push({
    element: document.body,
    listener: "mouseleave",
    fn: (e: Event): void => {
      dragging = false;
      detail.style.opacity = "1";
      marking = false;
      cnv.style.cursor = "default";
    }
  });

  chartEvents.push({
    element: cnv,
    listener: "click",
    fn: (e: Event): void => {
      const relCoords = chart_getRelativeCoords((<MouseEvent>e).clientX, (<MouseEvent>e).clientY);
      if (marking) {
        pins.push({ label: "", pos: relCoords });
      } else {
        if (pinIndex > -1) {
          detail_show(pinIndex);
        }
      }
    }
  });

}

function chart_activate(): void {

  (<HTMLDivElement>document.querySelector(".load")!).style.display = "none";
  cnv.style.display = "block";

  cr.setControlMap("chart");

  for (let event of chartEvents) {
    event.element.addEventListener(event.listener, event.fn);
  }

  running = true;

  chart_move(0, 0);
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
  if (x <= 0) {
    if (assets.map.width * z < cnv.width) {
      x = -(((cnv.width - (assets.map.width * z)) / 2) / z);
    } else {
      x = 0;
    }
  }
  else if (x > assets.map.width - (cnv.width / z)) {
    x = assets.map.width - (cnv.width / z);
  }
  y += yv;
  if (y < 0) {
    if (assets.map.height * z < cnv.height) {
      y = -(((cnv.height - (assets.map.height * z)) / 2) / z);
    } else {
      y = 0;
    }
  } else if (y > assets.map.height - (cnv.height / z)) {
    y = assets.map.height - (cnv.height / z);
  }
}

function chart_zoom(dir: number): void {
  let lastZ = z;
  if (dir > 0) {
    if (z == zMax) return;
    z = z + .1 > zMax ? zMax : z + .1;
  } else {
    if (z == zMin) return;
    z = z - .1 < zMin ? zMin : z - .1;
  }
  x += ((cnv.width - (cnv.width / z)) / 2) - ((cnv.width - (cnv.width / lastZ)) / 2);
  y += ((cnv.height - (cnv.height / z)) / 2) - ((cnv.height - (cnv.height / lastZ)) / 2);
  chart_move(0, 0);
}

function chart_getRelativeCoords(windX: number, windY: number): [number, number] {
  return [
    Math.round(((windX - cnvRect.left) * window.devicePixelRatio + (x * z)) / z),
    Math.round(((windY - cnvRect.top) * window.devicePixelRatio + (y * z)) / z),
  ]
}

function chart_pinHit(relX: number, relY: number): number {
  for (let m = 0; m < pins.length; m++) {
    if (Math.abs(pins[m].pos[0] - relX) * z > 15) continue;
    if (Math.abs(pins[m].pos[1] - relY) * z > 15) continue;
    return m;
  }
  return -1;
}

function chart_drawFrame(): void {

  cnvWorker.postMessage({
    msg: "draw",
    x: x, y: y, z: z,
    pins: pins,
  });

  if (running) {
    window.requestAnimationFrame(chart_drawFrame);
  }

}

function detail_show(index: number): void {

  (<HTMLImageElement>detail.querySelector(".image")!).src = `assets/${pinDetails[index].img}.png`;

  detail.querySelector("h1")!.innerText = pins[index].label;
  detail.querySelector("p")!.innerText = pinDetails[index].detail;

  detail.style.display = "block";

}

function detail_hide(): void {
  detail.style.display = "none";
}