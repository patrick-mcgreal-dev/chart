let ctx;
let assets;

function init(data) {
  ctx = data.offscreenCnv.getContext("2d");
  assets = data.assets;
}

function draw(data) {
  ctx.drawImage(assets.map, data.x, data.y, assets.map.width, assets.map.height);
}

onmessage = (evt) => {
  switch (evt.data.msg) {
    case "draw": draw(evt.data); break;
    case "init": init(evt.data); break;
  }
};