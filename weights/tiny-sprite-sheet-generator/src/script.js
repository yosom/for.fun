// Tiny Sprite Sheet Generator - Frank Force 2020 - MIT License

'use strict'
let seed, x, R, i, j, pass, s, X, Y;

seed = Date.now();    // seed for random generaton, can be replaced with hardcoded value
x = c.getContext`2d`; // 2d canvas context
x.lineWidth = 2;      // set 2 pixel wide line width to make the black outline
R = ()=> (Math.sin(++s + i*i) + 1)*1e9 % 256 | 0; // get a seeded random integer between 0-256

for(i = 32 * 16; i--;)                          // for each sprite (32 rows x 16 columns)
for(pass = 4; pass--;)                          // 4 passes, outline left/right and fill left/right
for(s = seed, j = R()/5 + 50|0; j--;)           // set seed, randomize max sprite pixels, 50-101
  X = j&7, Y = j>>3,                            // X & Y pixel index in sprite
  R() < 19 ?                                    // small chance of new color
    x.fillStyle = `rgb(${R()},${R()},${R()})` : // randomize color
    R()**2 / 2e3 > X*X + (Y-5)**2 &&            // distance from center vs random number
      x[pass&2 ? 'strokeRect' : 'fillRect'](    // stroke first for outline then fill with color
          7 + i%32*16 - pass%2*2*X + X,         // x pos, flipped if pass is even
          2 + (i>>5)*16 + Y,                    // y pos
          1, 1);                                // 1 pixel size