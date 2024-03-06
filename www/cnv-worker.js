onmessage = (evt) => {
  switch (evt.data.msg) {
    case "draw": draw(); break;
    case "init": init(); break;
  }
};


function init() {
  console.log("init");
}

function draw() {
  console.log("draw");
}