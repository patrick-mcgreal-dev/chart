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
let z = 1;
let v = 25;

let running: boolean = false;

const markers: Array<{ label: string, pos: number[] }> = Data.map(d => ({ 
  label: d.label, 
  pos: d.pos 
}));

const markerDetail: Array<{ detail: string, img: string }> = Data.map(d => ({
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

  detail.querySelector(".x")!.addEventListener("click", (e) => {
    detail.style.display = "none";
  });

}

function initControls(): void {

  let dragging = false;
  let marking = false;
  let markerIndex = -1;

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
    "*Space ArrowUp": () => { chart_move(0, v * -4) },
    "*Space ArrowDown": () => { chart_move(0, v * 4) },
    "*Space ArrowLeft": () => { chart_move(v * -4, 0) },
    "*Space ArrowRight": () => { chart_move(v * 4, 0) },
    "*MetaLeft ArrowUp": () => { chart_zoom(1) },
    "*MetaLeft ArrowDown": () => { chart_zoom(-1) },
    "MetaLeft": () => { marking = true },
    "-*MetaLeft": () => { marking = false },

  };

  cr.addControlMap("menu", {
    ...metaControls,
  });

  cr.addControlMap("chart", {
    ...metaControls,
    ...chartControls,
  });

  cr.setControlMap("menu");

  // chartEvents.push({
  //   element: window,
  //   listener: "resize",
  //   fn: (e: Event): void => {
  //     const w = cnv.parentElement!.clientWidth;
  //     const h = cnv.parentElement!.clientHeight;
  //     cnvRect = cnv.getBoundingClientRect();
  //     cnv.style.width = `${w}px`;
  //     cnv.style.height = `${h}px`;
  //     cnvWorker.postMessage({
  //       msg: "resize",
  //       w: w * window.devicePixelRatio, h: h * window.devicePixelRatio,
  //     })
  //   }
  // });

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
        chart_move(
          -(<MouseEvent>e).movementX * 1.5 / z,
          -(<MouseEvent>e).movementY * 1.5 / z
        );
      } else {
        const relCoords = chart_getRelativeCoords((<MouseEvent>e).clientX, (<MouseEvent>e).clientY);
        markerIndex = chart_markerHit(relCoords[0], relCoords[1]);
        if (markerIndex > -1) {
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
      cnv.style.cursor = "default";
    }
  });

  chartEvents.push({
    element: document.body,
    listener: "mouseleave",
    fn: (e: Event): void => {
      dragging = false;
      cnv.style.cursor = "default";
    }
  });

  chartEvents.push({
    element: cnv,
    listener: "click",
    fn: (e: Event): void => {
      const relCoords = chart_getRelativeCoords((<MouseEvent>e).clientX, (<MouseEvent>e).clientY);
      if (marking) {
        markers.push({ label: "", pos: relCoords });
        // console.log(`[${relCoords[0]}, ${relCoords[1]}],`);
      } else {
        if (markerIndex > -1) {
          detail_show(markerIndex);
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
    if (z == 3) return;
    z = z + .1 > 3 ? 3 : z + .1;
  } else {
    if (z == .8) return;
    z = z - .1 < .8 ? .8 : z - .1;
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

function chart_markerHit(relX: number, relY: number): number {
  // console.log(Math.abs(markers[0].pos[0] - relX) * z);
  for (let m = 0; m < markers.length; m++) {
    if (Math.abs(markers[m].pos[0] - relX) * z > 15) continue;
    if (Math.abs(markers[m].pos[1] - relY) * z > 15) continue;
    return m;
  }
  return -1;
}

function chart_drawFrame(): void {

  cnvWorker.postMessage({
    msg: "draw",
    x: x, y: y, z: z,
    markers,
  });

  if (running) {
    window.requestAnimationFrame(chart_drawFrame);
  }

}

function detail_show(index: number): void {

  (<HTMLImageElement>detail.querySelector(".image")!).src = `assets/${markerDetail[index].img}.png`;

  detail.querySelector("h1")!.innerText = markers[index].label;
  detail.querySelector("p")!.innerText = markerDetail[index].detail;

  detail.style.display = "block";

}