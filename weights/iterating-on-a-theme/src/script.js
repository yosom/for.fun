/*
 * This is a part of a demonstration of some useful
 * functions for drawing grid-based generative
 * systems. To read more about this, take a look at
 * https://www.surface-detail.com/posts/some-useful-functions
 */
import { Turtleman } from "https://esm.sh/turtleman@1.0.7";
import { Pane } from "https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js";
import {
  lerp,
  getPointsForGridId,
  getEdgeIdsForGridId,
} from "https://codepen.io/shubniggurath/pen/OPyPdmm.js";

const CONFIG = {
  width: 1200,
  height: 600,
  gridW: 100,
  gridH: 50,
  splits: 2,
  randomSize: 0,
};
// --- PANE ---
const pane = new Pane();
const f1 = pane.addFolder({
  title: "Config",
  
});
f1.addBinding(CONFIG, "width");
f1.addBinding(CONFIG, "height");
f1.addBinding(CONFIG, "gridW", {
  step: 1,
  min: 1,
  max: 100,
});
f1.addBinding(CONFIG, "gridH", {
  step: 1,
  min: 1,
  max: 100,
});
f1.addBinding(CONFIG, "splits", {
  step: 1,
  min: 1,
  max: 20,
});
f1.addBinding(CONFIG, "randomSize", {
  step: 0.01,
  min: 0,
  max: 1,
});
f1.on("change", (ev) => {
  rebuild();
});

// --- MAIN ---
let toy;
const rebuild = () => {
  console.clear();
  if (toy) toy.element.remove();

  const { width, height, gridW, gridH, randomSize, splits } = CONFIG;
  const cellWidth = width / gridW;
  const cellHeight = height / gridH;

  toy = new Turtleman({
    width,
    height,
    strokeWidth: 2,
    angleType: "radians",
  });
  container.appendChild(toy.element);

  const cells = [...Array(gridW * gridH)].map((_, i) => {
    return {
      points: getPointsForGridId(i, gridW),
      edges: getEdgeIdsForGridId(i, gridW, gridH),
      direction: Math.random() > 0.5 ? 1 : -1,
    };
  });
  const gridEdges = (gridW * (gridH+1)) + (gridH * (gridW+1))
  const edges = [...Array(gridEdges)].map((_, i) => ({
    r: Math.random() * randomSize - randomSize / 2,
  }));

  cells.forEach((cell) => {
    let edgeDirection = cell.direction;
    let esplits = splits;
    
    if (ctx) {
      const px = ctx.getImageData(
        cell.points[0].x * cellWidth,
        cell.points[0].y * cellWidth,
        1, 1
      )
      if (px.data[0] >0) {
        edgeDirection = 1;
        esplits = 1;
      }
      // else edgeDirection=-1;
    }
    
    const topEdge = edges[cell.edges[0]];
    const bottomEdge = edges[cell.edges[2]];
    const leftEdge = edges[cell.edges[3]];
    const rightEdge = edges[cell.edges[1]];
    
    for(let i = 0; i < esplits; i++) {
      const e = i/esplits;
            
      const topEdgePoint = {
        x: lerp(cell.points[0].x, cell.points[1].x, e + topEdge.r),
        y: cell.points[0].y,
      };
      const bottomEdgePoint = {
        x: lerp(cell.points[3].x, cell.points[2].x, e + bottomEdge.r),
        y: cell.points[2].y,
      };
      const leftEdgePoint = {
        x: cell.points[0].x,
        y: lerp(cell.points[0].y, cell.points[3].y, e + leftEdge.r),
      };
      const rightEdgePoint = {
        x: cell.points[1].x,
        y: lerp(cell.points[1].y, cell.points[2].y, e + rightEdge.r),
      };

      let a,b,c,d;
      if (edgeDirection === 1) {
        const topEdgePoint = {
          x: lerp(cell.points[1].x, cell.points[0].x, e + topEdge.r),
          y: cell.points[0].y,
        };
        const bottomEdgePoint = {
          x: lerp(cell.points[2].x, cell.points[3].x, e + bottomEdge.r),
          y: cell.points[2].y,
        };
        // const leftEdgePoint = {
        //   x: cell.points[0].x,
        //   y: lerp(cell.points[3].y, cell.points[0].y, e + leftEdge.r),
        // };
        // const rightEdgePoint = {
        //   x: cell.points[1].x,
        //   y: lerp(cell.points[2].y, cell.points[1].y, e + rightEdge.r),
        // };
        a = topEdgePoint;
        b = rightEdgePoint;
        c = bottomEdgePoint;
        d = leftEdgePoint;
      } else {
        a = topEdgePoint;
        b = leftEdgePoint;
        c = bottomEdgePoint;
        d = rightEdgePoint;
      }

      toy.jump(a.x * cellWidth, a.y * cellHeight);
      toy.goto(b.x * cellWidth, b.y * cellHeight);
      toy.jump(c.x * cellWidth, c.y * cellHeight);
      toy.goto(d.x * cellWidth, d.y * cellHeight);
    }
  });

  toy.render();
};




const image = new Image();
image.crossOrigin="anonymous";
image.src="https://assets.codepen.io/982762/Iterating.png"
let ctx;
image.onload = () => {
  const canvas = document.createElement("canvas");
  canvas.width = CONFIG.width;
  canvas.height = CONFIG.height;
  ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, CONFIG.width, CONFIG.height);
  rebuild();
};