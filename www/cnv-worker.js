const chSize = 20;
const fontSize = 28;

const labelXoffset = 20;
const labelYoffset = -20;

let ctx, ctxW, ctxH, centerX, centerY;
let assets;

function init(data) {

  ctx = data.offscreenCnv.getContext("2d");
  ctx.lineWidth = 3;
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textBaseline = "top";

  resize(data.offscreenCnv.width, data.offscreenCnv.height);

  assets = data.assets;

}

function resize(w, h) {

  ctxW = w;
  ctxH = h;
  centerX = ctxW / 2;
  centerY = ctxH / 2;

}

function draw(data) {

  // clear
  ctx.fillStyle = "#eee";
  ctx.fillRect(0, 0, ctxW, ctxH);

  // map
  ctx.drawImage(assets.map, 
    data.x, data.y,
    ctxW / data.z, ctxH / data.z, 
    0, 0, 
    ctxW, ctxH);

  for (let pin of data.pins) {

    const x = (pin.pos[0] - data.x) * data.z;
    const y = (pin.pos[1] - data.y) * data.z;

    if (pin.label == "") {

      // pin
      ctx.drawImage(assets.pinuser, x - (assets.pinuser.width / 2), y - assets.pinuser.height);

    } else {

      // pin
      ctx.globalAlpha = pin.opacity;
      ctx.drawImage(assets.pin, x - (assets.pin.width / 2), y - assets.pin.height);
      ctx.globalAlpha = 1;
  
      // label
      ctx.strokeStyle = "black";
      ctx.strokeText(pin.label, 
        x + labelXoffset, 
        y + labelYoffset);
        
      ctx.fillStyle = "white";
      ctx.fillText(pin.label, 
        x + labelXoffset, 
        y + labelYoffset);

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
    case "resize": resize(evt.data.w, evt.data.h); break;
    case "init": init(evt.data); break;
  }
};