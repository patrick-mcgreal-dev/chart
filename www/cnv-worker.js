const chSize = 20;
const fontSize = 30;

const labelX = 6;
const labelY = -(fontSize + 8);

let ctx, ctxW, ctxH, centerX, centerY;
let assets;

function init(data) {

  ctx = data.offscreenCnv.getContext("2d");
  ctx.strokeStyle = "red";
  ctx.lineWidth = 3;
  ctx.font = `bold ${fontSize}px monospace`;

  ctxW = data.offscreenCnv.width;
  ctxH = data.offscreenCnv.height;
  centerX = ctxW / 2;
  centerY = ctxH / 2;

  assets = data.assets;

}

function draw(data) {

  ctx.drawImage(assets.map, 
    data.x, data.y,
    ctxW / data.z, ctxH / data.z, 
    0, 0, 
    ctxW, ctxH);

  ctx.beginPath();
  ctx.moveTo(centerX - chSize, centerY);
  ctx.lineTo(centerX + chSize, centerY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX, centerY - chSize);
  ctx.lineTo(centerX, centerY + chSize);
  ctx.stroke();

  for (let marker of data.markers) {
    const x = (marker[0] - data.x) * data.z;
    const y = (marker[1] - data.y) * data.z;
    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillRect(x + labelX, y + labelY, ctx.measureText("Label").width + 4, fontSize);
    ctx.fillStyle = "white";
    ctx.fillText("Label", x + labelX + 2, y + (labelY / 2) + 6);
  }

}

onmessage = (evt) => {
  switch (evt.data.msg) {
    case "draw": draw(evt.data); break;
    case "init": init(evt.data); break;
  }
};