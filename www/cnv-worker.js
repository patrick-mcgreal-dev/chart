const chSize = 20;
const fontSize = 30;

const labelPadding = 6;
const labelX = 6;
const labelY = -(fontSize + labelPadding);

let ctx, ctxW, ctxH, centerX, centerY;
let assets;

function init(data) {

  ctx = data.offscreenCnv.getContext("2d");
  ctx.strokeStyle = "red";
  ctx.lineWidth = 3;
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textBaseline = "middle";

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
    // point
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();
    // label background
    ctx.fillRect(
      x + marker[2][0], 
      y + marker[2][1], 
      marker[2][2],
      marker[2][3]);
    // label
    ctx.fillStyle = "white";
    ctx.fillText("Label", 
      x + labelX + labelPadding, 
      y + (labelY / 2) - labelPadding);
  }

}

function marker(data) {
  postMessage({
    msg: "marker",
    box: [
      labelX,
      labelY - labelPadding * 2,
      Math.ceil(ctx.measureText(data.text).width + (labelPadding * 2)),
      fontSize + labelPadding * 2,
    ],
  });
}

onmessage = (evt) => {
  switch (evt.data.msg) {
    case "draw": draw(evt.data); break;
    case "marker": marker(evt.data); break;
    case "init": init(evt.data); break;
  }
};