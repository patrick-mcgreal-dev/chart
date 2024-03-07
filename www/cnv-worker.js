const chSize = 20;
const fontSize = 30;

const labelPadding = 6;
const labelXoffset = 6;
const labelYoffset = -(fontSize + labelPadding);

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

  // clear
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, ctxW, ctxH);

  // map
  ctx.drawImage(assets.map, 
    data.x, data.y,
    ctxW / data.z, ctxH / data.z, 
    0, 0, 
    ctxW, ctxH);

  for (let marker of data.markers) {

    const x = (marker.pos[0] - data.x) * data.z;
    const y = (marker.pos[1] - data.y) * data.z;

    ctx.fillStyle = "red";

    // point
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = "blue";

    // label background
    ctx.fillRect(
      x + marker.pos[2][0], 
      y + marker.pos[2][1], 
      marker.pos[2][2],
      marker.pos[2][3]);

    // label
    ctx.fillStyle = "white";
    ctx.fillText(marker.label, 
      x + labelXoffset + labelPadding, 
      y + (labelYoffset / 2) - labelPadding);

  }

  // crosshairs
  ctx.beginPath();
  ctx.moveTo(centerX - chSize, centerY);
  ctx.lineTo(centerX + chSize, centerY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX, centerY - chSize);
  ctx.lineTo(centerX, centerY + chSize);
  ctx.stroke();

}

function marker(data) {
  postMessage({
    msg: "marker",
    box: [
      labelXoffset,
      labelYoffset - (labelPadding * 2),
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