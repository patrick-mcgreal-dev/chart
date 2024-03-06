let ctx, ctxW, ctxH;
let assets;

function init(data) {
  ctx = data.offscreenCnv.getContext("2d");
  ctxW = data.offscreenCnv.width;
  ctxH = data.offscreenCnv.height;
  assets = data.assets;
}

function draw(data) {
  ctx.drawImage(assets.map, data.x, data.y, ctxW, ctxH, 0, 0, ctxW, ctxH);
}

onmessage = (evt) => {
  switch (evt.data.msg) {
    case "draw": draw(evt.data); break;
    case "init": init(evt.data); break;
  }
};