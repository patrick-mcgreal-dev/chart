import * as ControlRouter from "../src/control-router";

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