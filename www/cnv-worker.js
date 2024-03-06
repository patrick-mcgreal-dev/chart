let ctx;
let assets;

function init(data) {
  ctx = data.offscreenCnv.getContext("2d");
  assets = data.assets;
}

function draw(data) {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(assets.player, data.px, data.py, assets.player.width, assets.player.height);
}

onmessage = (evt) => {
  switch (evt.data.msg) {
    case "draw": draw(evt.data); break;
    case "init": init(evt.data); break;
  }
};