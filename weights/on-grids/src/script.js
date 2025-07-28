// This is a demonstration of the Turtleman class, made as a way to 
// Create the og image for the post about Grids.
// https://www.surface-detail.com/posts/on-grids

import { Turtleman } from "https://esm.sh/turtleman@1.0.5";
import { Pane } from "https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js";

console.clear();

const CONFIG = {
  width: 1200, // Canvas width
  height: 600, // Canvas height
  gridW: 200, // Number of grid columns
  gridH: 100, // Number of grid rows
  postitSize: 20,
  angleSize: 0.05,
  stroke: 2
};

const pane = new Pane();
// pane.addBinding(CONFIG, "width");
// pane.addBinding(CONFIG, "height");
pane.addBinding(CONFIG, "gridW", {
  step: 1,
  min: 1,
  max: 200,
});
pane.addBinding(CONFIG, "gridH", {
  step: 1,
  min: 1,
  max: 200,
});
pane.addBinding(CONFIG, "postitSize", {
  step: 1,
  min: -3,
  max: 20,
});
pane.addBinding(CONFIG, "angleSize", {
  min: 0,
  max: 2,
});
pane.addBinding(CONFIG, "stroke", {
  step: 1,
  min: 1,
  max: 5,
});
pane.on("change", (ev) => {
  rebuild();
});

let toy;
const rebuild = () => {
  if (toy) toy.element.remove();

const polys = []; // Store the polygons for each cell
const polygons = new Polygons();

  const { width, height, gridW, gridH } = CONFIG;
  const gridWFactor = width / gridW, // Width of a cell in pixels
    gridHFactor = height / gridH; // Height of a cell in pixels

  // Create the Turtleman
  toy = new Turtleman({
    width: width,
    height: height,
    angleType: "radians",
    strokeWidth: CONFIG.stroke,
  });
  container.appendChild(toy.element);

  /*
   * Some utility functions.
   */
  // Returns a random option from an array
  const randomOption = (options) =>
    options[Math.floor(Math.random() * options.length)];

  // A 1 dimensional array of grid cells. Each cell contains
  // the 4 points that make it up, the cell's bounds, and a
  const gridCells = [...Array(gridW * gridH)].map((_, i) => {
    const row = Math.floor(i / gridW);
    const col = i % gridW;

    // Each grid cell is defined by its top-left corner
    // The 4 points of the cell are: top-left, top-right, bottom-right, bottom-left
    const points = [
      { x: col, y: row }, // top left
      { x: col + 1, y: row }, // top right
      { x: col + 1, y: row + 1 }, // bottom right
      { x: col, y: row + 1 }, // bottom left
    ];
    // Bounds of the grid cell in pixels
    const bounds = {
      x: col * gridWFactor,
      y: row * gridHFactor,
      w: gridWFactor,
      h: gridHFactor,
    };
    return {
      points,
      bounds,
    };
  });

  /*
   * Some basic drawing functions
   */
  const rotatePoint = (p, c, a = 0) => {
    const r = [Math.cos(a), Math.sin(a)];
    const t = p.map((p, i) => p-c[i])
    const u = [
      t[0] * r[0] - t[1] * r[1],
      t[0] * r[1] + t[1] * r[0]
    ]
    return u.map((p,i) => p+c[i]);
  }
  // The square moves to the top-left of the square shape
  // as defined by the x, y and radius (width) of the square
  // Then it walks forward, and turns right (1.57 = 90 degrees)
  // repeating until the square is complete.
  const drawSquare = (r, x, y, a = 0) => {
    const tl = rotatePoint( [x-r, y-r], [x, y], a );
    toy.jump(...tl);
    toy.seth(a);
    for(let i=0;i<4;i++) 
      toy.forward(r * 2), toy.right(1.5708);
  };

  /*
   * Drawing
   */
  // Only draw if we have a canvas context
  if (ctx) {
    gridCells.forEach((grid) => {
      const { bounds, points } = grid;

      const px = ctx.getImageData(
        bounds.x + bounds.w / 2,
        bounds.y + bounds.h / 2,
        1,
        1
      );

      // Draw a squre representing each grid item
      if (px.data[0] === 0) {
        const rn = Math.random() * CONFIG.angleSize - CONFIG.angleSize/2;
        drawSquare(
          bounds.w / 2 + CONFIG.postitSize,
          bounds.x + bounds.w / 2,
          bounds.y + bounds.h / 2,
          rn
        );
      }
    });

    const groups = toy.lineGroups;

    toy.reset();

    for (let i = 0; i < groups.length; i++) {
      const p1 = polygons.create(),
        p2 = polygons.create();

      p1.addPoints(...groups[i].points.map((p) => [p.x, p.y]));

      p1.addOutline();

      polygons.draw(toy, p1);
    }
  }

  toy.render();
};




/*
 * Polygon Clipping utility code - Created by Reinder Nijhoff 2019
 */
function Polygons() {
  const polygonList = [];
  const Polygon = class {
    constructor() {
      this.cp = []; // clip path: array of [x,y] pairs
      this.dp = []; // 2d lines [x0,y0],[x1,y1] to draw
      this.aabb = []; // AABB bounding box
    }
    addPoints(...points) {
      // add point to clip path and update bounding box
      let xmin = 1e5,
        xmax = -1e5,
        ymin = 1e5,
        ymax = -1e5;
      (this.cp = [...this.cp, ...points]).forEach((p) => {
        (xmin = Math.min(xmin, p[0])), (xmax = Math.max(xmax, p[0]));
        (ymin = Math.min(ymin, p[1])), (ymax = Math.max(ymax, p[1]));
      });
      this.aabb = [
        (xmin + xmax) / 2,
        (ymin + ymax) / 2,
        (xmax - xmin) / 2,
        (ymax - ymin) / 2,
      ];
    }
    addSegments(...points) {
      // add segments (each a pair of points)
      points.forEach((p) => this.dp.push(p));
    }
    addOutline() {
      for (let i = 0, l = this.cp.length; i < l; i++) {
        this.dp.push(this.cp[i], this.cp[(i + 1) % l]);
      }
    }
    draw(t) {
      for (let i = 0, l = this.dp.length; i < l; i += 2) {
        t.jump(...this.dp[i]), t.goto(...this.dp[i + 1]);
      }
    }
    addHatching(a, d) {
      const tp = new Polygon();
      tp.cp.push([-1e5, -1e5], [1e5, -1e5], [1e5, 1e5], [-1e5, 1e5]);
      const dx = Math.sin(a) * d,
        dy = Math.cos(a) * d;
      const cx = Math.sin(a) * 200,
        cy = Math.cos(a) * 200;
      for (let i = 0.5; i < 150 / d; i++) {
        tp.dp.push([dx * i + cy, dy * i - cx], [dx * i - cy, dy * i + cx]);
        tp.dp.push([-dx * i + cy, -dy * i - cx], [-dx * i - cy, -dy * i + cx]);
      }
      tp.boolean(this, false);
      this.dp = [...this.dp, ...tp.dp];
    }
    inside(p) {
      let int = 0; // find number of i ntersection points from p to far away
      for (let i = 0, l = this.cp.length; i < l; i++) {
        if (
          this.segment_intersect(
            p,
            [0.1, -1000],
            this.cp[i],
            this.cp[(i + 1) % l]
          )
        ) {
          int++;
        }
      }
      return int & 1; // if even your outside
    }
    boolean(p, diff = true) {
      // bouding box optimization by ge1doot.
      if (
        Math.abs(this.aabb[0] - p.aabb[0]) - (p.aabb[2] + this.aabb[2]) >= 0 &&
        Math.abs(this.aabb[1] - p.aabb[1]) - (p.aabb[3] + this.aabb[3]) >= 0
      )
        return this.dp.length > 0;

      // polygon diff algorithm (narrow phase)
      const ndp = [];
      for (let i = 0, l = this.dp.length; i < l; i += 2) {
        const ls0 = this.dp[i];
        const ls1 = this.dp[i + 1];
        // find all intersections with clip path
        const int = [];
        for (let j = 0, cl = p.cp.length; j < cl; j++) {
          const pint = this.segment_intersect(
            ls0,
            ls1,
            p.cp[j],
            p.cp[(j + 1) % cl]
          );
          if (pint !== false) {
            int.push(pint);
          }
        }
        if (int.length === 0) {
          // 0 intersections, inside or outside?
          if (diff === !p.inside(ls0)) {
            ndp.push(ls0, ls1);
          }
        } else {
          int.push(ls0, ls1);
          // order intersection points on line ls.p1 to ls.p2
          const cmpx = ls1[0] - ls0[0];
          const cmpy = ls1[1] - ls0[1];
          int.sort(
            (a, b) =>
              (a[0] - ls0[0]) * cmpx +
              (a[1] - ls0[1]) * cmpy -
              (b[0] - ls0[0]) * cmpx -
              (b[1] - ls0[1]) * cmpy
          );

          for (let j = 0; j < int.length - 1; j++) {
            if (
              (int[j][0] - int[j + 1][0]) ** 2 +
                (int[j][1] - int[j + 1][1]) ** 2 >=
              0.001
            ) {
              if (
                diff ===
                !p.inside([
                  (int[j][0] + int[j + 1][0]) / 2,
                  (int[j][1] + int[j + 1][1]) / 2,
                ])
              ) {
                ndp.push(int[j], int[j + 1]);
              }
            }
          }
        }
      }
      return (this.dp = ndp).length > 0;
    }
    //port of http://paulbourke.net/geometry/pointlineplane/Helpers.cs
    segment_intersect(l1p1, l1p2, l2p1, l2p2) {
      const d =
        (l2p2[1] - l2p1[1]) * (l1p2[0] - l1p1[0]) -
        (l2p2[0] - l2p1[0]) * (l1p2[1] - l1p1[1]);
      if (d === 0) return false;
      const n_a =
        (l2p2[0] - l2p1[0]) * (l1p1[1] - l2p1[1]) -
        (l2p2[1] - l2p1[1]) * (l1p1[0] - l2p1[0]);
      const n_b =
        (l1p2[0] - l1p1[0]) * (l1p1[1] - l2p1[1]) -
        (l1p2[1] - l1p1[1]) * (l1p1[0] - l2p1[0]);
      const ua = n_a / d;
      const ub = n_b / d;
      if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
        return [
          l1p1[0] + ua * (l1p2[0] - l1p1[0]),
          l1p1[1] + ua * (l1p2[1] - l1p1[1]),
        ];
      }
      return false;
    }
  };
  return {
    list: () => polygonList,
    create: () => new Polygon(),
    draw: (turtle, p, addToVisList = true) => {
      for (let j = 0; j < polygonList.length && p.boolean(polygonList[j]); j++);
      p.draw(turtle);
      if (addToVisList) polygonList.push(p);
    },
  };
}




const image = new Image();
let ctx;
image.src = "data:image/png;base64,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";
image.onload = () => {
  const canvas = document.createElement("canvas");
  canvas.width = CONFIG.width;
  canvas.height = CONFIG.height;
  ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, CONFIG.width, CONFIG.height);
  rebuild();
};