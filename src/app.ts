import * as ControlRouter from "../src/control-router";

const assets: { [key: string]: ImageBitmap } = {};

const chartEvents: Array<{
  element: HTMLElement,
  listener: string,
  fn: (e: Event) => void,
}> = [];

let cnv: HTMLCanvasElement;
let cnvRect: DOMRect;
let cnvWorker: Worker;
let cr: ControlRouter.API;

let x = 0;
let y = 0;
let z = 1;
let v = 25;

let running: boolean = false;

const markers: Array<number[]> = [

];

(async () => {
  await loadAssets();
  initCanvas();
  await initMarkers();
  initControls();
  chart_activate();
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

function initMarkers(): Promise<void> {

  return new Promise((res, rej) => {

    if (!markers.length) res();

    let mIndex = 0;

    const mInit = (e) => {
      if (e.data.msg == "marker") {
        markers[mIndex][2] = e.data.box;
        mIndex++;
        if (mIndex == markers.length) {
          cnvWorker.removeEventListener("message", mInit);
          res();
        }
      }
    }

    cnvWorker.addEventListener("message", mInit);

    for (let marker of markers) {
      cnvWorker.postMessage({
        msg: "marker",
        text: "Label",
      });
    }

  });

}

function initControls(): void {

  let dragging = false;
  let marking = false;
  let marker = false;

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

  chartEvents.push({
    element: cnv,
    listener: "mousedown",
    fn: (e: Event): void => {
      dragging = true;
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
        const mIndex = chart_markerHit(relCoords[0], relCoords[1]);
        if (mIndex > -1) {
          marker = true;
          cnv.style.cursor = "pointer";
        } else {
          marker = false;
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
    }
  });

  chartEvents.push({
    element: document.body,
    listener: "mouseleave",
    fn: (e: Event): void => {
      dragging = false;
    }
  });

  chartEvents.push({
    element: cnv,
    listener: "click",
    fn: (e: Event): void => {
      const relCoords = chart_getRelativeCoords((<MouseEvent>e).clientX, (<MouseEvent>e).clientY);
      if (marking) {
        markers.push(relCoords);
        console.log(`[${relCoords[0]}, ${relCoords[1]}],`);
        cnvWorker.postMessage({
          msg: "marker",
          text: "Label",
        });
      } else {
        if (marker) {
          console.log("marker");
        }
      }
    }
  });

  cnvWorker.onmessage = (e) => {
    if (e.data.msg == "marker") {
      markers[markers.length - 1][2] = e.data.box;
    }
  }

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
    if (z == .1) return;
    z = z - .1 < .3 ? .3 : z - .1;
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
  // TODO: some vertical weirdness here
  for (let m = 0; m < markers.length; m++) {
    const marker = markers[m];
    if (relX < marker[0] + marker[2][0]) continue;
    if (relX > marker[0] + (marker[2][0] + marker[2][2] / z)) continue;
    if (relY < marker[1] + (marker[2][1] / z)) continue;
    if (relY > marker[1] + marker[2][1] + marker[2][3]) continue;
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