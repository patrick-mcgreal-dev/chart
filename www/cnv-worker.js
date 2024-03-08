const chSize = 20;
const fontSize = 28;

const labelXoffset = 12;
const labelYoffset = -(fontSize + 40);

let ctx, ctxW, ctxH, centerX, centerY;
let assets;

function init(data) {

  ctx = data.offscreenCnv.getContext("2d");
  ctx.lineWidth = 3;
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textBaseline = "top";

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

    if (marker.label == "") {

      // point
      ctx.fillStyle = "lightgreen";
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();

    } else {

      // point
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();
  
      // label
      ctx.strokeStyle = "black";
      ctx.strokeText(marker.label, 
        x + labelXoffset, 
        y + (labelYoffset / 2));
        
      ctx.fillStyle = "white";
      ctx.fillText(marker.label, 
        x + labelXoffset, 
        y + (labelYoffset / 2));

    }

  }

  // crosshairs
  ctx.strokeStyle = "red";

  ctx.beginPath();
  ctx.moveTo(centerX - chSize, centerY);
  ctx.lineTo(centerX + chSize, centerY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX, centerY - chSize);
  ctx.lineTo(centerX, centerY + chSize);
  ctx.stroke();

}

onmessage = (evt) => {
  switch (evt.data.msg) {
    case "draw": draw(evt.data); break;
    case "marker": marker(evt.data); break;
    case "init": init(evt.data); break;
  }
};