let ctx;
let assets;

function init(data) {
  ctx = data.offscreenCnv.getContext("2d");
  assets = data.assets;
}

function draw() {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(assets.player, 0, 0, assets.player.width, assets.player.height);
}

onmessage = (evt) => {
  switch (evt.data.msg) {
    case "draw": draw(); break;
    case "init": init(evt.data); break;
  }
};