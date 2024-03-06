import * as ControlRouter from "../src/control-router";

await loadAssets();
initCanvas();
initControlRouter();

async function loadAssets(): Promise<void> {

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