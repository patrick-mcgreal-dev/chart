const chSize = 20;
const fontSize = 28;

const labelXoffset = 30;
const labelYoffset = -15;

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

  for (let marker of data.markers) {

    const x = (marker.pos[0] - data.x) * data.z;
    const y = (marker.pos[1] - data.y) * data.z;

    // if (x < data.x * data.z) {
    //   console.log("skip");
    //   continue;
    // }
    // if (x < data.y) continue;

    if (marker.label == "") {

      // point
      ctx.fillStyle = "lightgreen";
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();

    } else {

      // pin
      ctx.drawImage(assets.pin, x - (assets.pin.width / 2), y - (assets.pin.height / 2));
  
      // label
      ctx.strokeStyle = "black";
      ctx.strokeText(marker.label, 
        x + labelXoffset, 
        y + labelYoffset);
        
      ctx.fillStyle = "white";
      ctx.fillText(marker.label, 
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