import * as ControlRouter from "../src/control-router";
import PinData from "./data.json";

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

const pinRadius = 15;

let pins: Array<{ 
  default: boolean,
  label: string, 
  pos: [number, number], 
  hitPos: [number, number],
  opacity: number,
}>;

let pinDetails: Array<{ detail: string, img: string }>;

(async () => {
  await assets_load();
  detail_init();
  chart_init();
  chart_activate();
})();

async function assets_load(): Promise<void> {

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

function detail_init(): void {

  detail = <HTMLDivElement>document.getElementById("chart-detail")!;
  detail.querySelector(".x")!.addEventListener("click", detail_hide);

}

function chart_init(): void {

  // canvas

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

  // pins

  pins = PinData.map(d => ({ 
    default: true,
    label: d.label, 
    pos: [ d.pos[0], d.pos[1] ],
    hitPos: [ d.pos[0], d.pos[1] - (assets.pin.height / z / 2) ],
    opacity: 1,
  }));
  
  pinDetails = PinData.map(d => ({
    detail: d.detail,
    img: d.img,
  }));

  // controls

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
      if (marking) {
        for (let pin of pins) {
          pin.opacity = .6;
        }
        const relCoords = chart_getRelativeCoords((<MouseEvent>e).clientX, (<MouseEvent>e).clientY);
        pins.push({ 
          default: false,
          label: `Location ${pins.filter(p => !p.default).length + 1}`, 
          pos: relCoords, 
          hitPos: [relCoords[0], relCoords[1] - (assets.pin.height / z / 2)],
          opacity: 1,
        });
        pinDetails.push({
          detail: "",
          img: "",
        });
        detail_show(pins.length - 1);
      } else {
        if (pinIndex > -1) {
          for (let pin of pins) {
            pin.opacity = .6;
          }
          pins[pinIndex].opacity = 1;
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

  let pinFallDistance = 100;

  for (let pin of pins) {
    pin.pos[1] -= pinFallDistance;
    pin.opacity = 0;
  }

  const pinFallInterval = window.setInterval(() => {
    for (let pin of pins) {
      pin.pos[1] += 2;
      pin.opacity += .02;
    }
    pinFallDistance -= 2;
    if (pinFallDistance == 0) {
      window.clearInterval(pinFallInterval);
    }
  }, 1);

  chart_move(0, 0);
  window.requestAnimationFrame(chart_drawFrame);

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
  for (let pin of pins) {
    pin.hitPos[1] = pin.pos[1] - (assets.pin.height / z / 2);
  }
  chart_move(0, 0);
}

function chart_getRelativeCoords(windX: number, windY: number): [number, number] {
  return [
    Math.round(((windX - cnvRect.left) * window.devicePixelRatio + (x * z)) / z),
    Math.round(((windY - cnvRect.top) * window.devicePixelRatio + (y * z)) / z),
  ]
}

function chart_pinHit(relX: number, relY: number): number {
  // console.log("mouse: ", relX, relY);
  // console.log(pins[0].hitPos);
  for (let p = 0; p < pins.length; p++) {
    if (Math.abs(pins[p].hitPos[0] - relX) > pinRadius) continue;
    if (Math.abs(pins[p].hitPos[1] - relY) > pinRadius) continue;
    return p;
  }
  return -1;
}

function chart_drawFrame(): void {

  cnvWorker.postMessage({
    msg: "draw",
    x: x, y: y, z: z,
    pins: pins,
  });

  window.requestAnimationFrame(chart_drawFrame);

}

function detail_show(index: number): void {

  if (pins[index].default) {

    (<HTMLImageElement>detail.querySelector(".image")!).src = `assets/${pinDetails[index].img}.png`;

    detail.querySelector("h1")!.innerText = pins[index].label;
    detail.querySelector("p")!.innerText = pinDetails[index].detail;

  } else {

    (<HTMLImageElement>detail.querySelector(".image")!).src = `assets/map.png`;

    // show editors

    detail.querySelector("h1")!.innerText = pins[index].label;
    detail.querySelector("p")!.innerText = pinDetails[index].detail;

  }

  detail.style.display = "block";

}

function detail_hide(): void {

  detail.style.display = "none";

  for (let pin of pins) {
    pin.opacity = 1;
  }

}