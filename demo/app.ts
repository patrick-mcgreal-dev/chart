import * as ControlRouter from "../src/control-router";

(async () => {
  await loadAssets();
  initCanvas();
  initControlRouter();
})();

async function loadAssets(): Promise<void> {

  const assetPaths = [
    "player",
  ];

  const assets: { [key: string]: ImageBitmap } = {};

  for (let path of assetPaths) {
    const res = await fetch(`assets/${path}.png`);
    assets[path] = await createImageBitmap(await res.blob());
  }

  console.log(assets);

}

function initCanvas(): void {

  const cnv = document.querySelector("canvas");

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