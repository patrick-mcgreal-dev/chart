let assets;

function init(data) {
  assets = data.assets;
}

function draw() {
  console.log("draw");
}

onmessage = (evt) => {
  switch (evt.data.msg) {
    case "draw": draw(); break;
    case "init": init(evt.data); break;
  }
};