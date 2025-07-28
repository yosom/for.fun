var Particle = {

        create: function (cfg) {
            var particle = Object.create(this);
            particle.x = cfg.x;
            particle.y = cfg.y;
            particle.color = cfg.color;
            particle.context = cfg.context;
            particle.finalX = cfg.finalX;
            particle.finalY = cfg.finalY;

            var divider = Math.max(1, parseInt(Math.random() * 40));
            particle.vx = (particle.finalX - particle.x) / divider;
            particle.vy = (particle.finalY - particle.y) / divider;
            return particle;
        },

        update: function () {
            if (Math.abs(this.x - this.finalX) < 1 && Math.abs(this.y - this.finalY) < 1) {
                this.x = this.finalX;
                this.y = this.finalY;
                return;
            }
            this.x += this.vx;
            this.y += this.vy;
        },

        draw: function () {
            this.context.fillStyle = this.color;
            this.context.fillRect(offsetX + this.x, offsetY + this.y, 1, 1);
        }
    };
    var PivotPoint = {

        baseOffset: 100,

        step: 3,

        angle: 0,

        kx: 200,

        ky: 200,

        init: function (cfg) {
            this.offset = this.baseOffset + cfg.offset;
            this.x = cfg.x;
            this.y = cfg.y;
        },

        getX: function () {
            return this.x;
        },

        getY: function () {
            return this.y;
        },

        update: function () {
            this.x = this.kx * Math.cos(this.angle);
            this.y = this.ky * Math.sin(this.angle);
            this.kx += this.step;

            if (this.x < this.kx / 2) {
                this.x = this.kx / 2;
            }
            if (this.y < -100) {
                this.y = -100;
            }
            this.angle++;
        }
    };
    var width = 538;
    var height = 190;
    var pixelsPerLine = width * 4;
    var canvas = document.querySelector("#c1");
    var context = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    var offsetX = (canvas.width - width) / 2;
    var offsetY = (canvas.height - height) / 2;

    var tmpCanvas = document.querySelector("#c2");
    var tmpContext = tmpCanvas.getContext('2d');
    var img = document.querySelector('img');
    tmpContext.drawImage(img, 0, 0, width, height);
    var data = tmpContext.getImageData(0, 0, width, height).data;
    var pixels = getPixels(data);

    pixels.sort(function (p0, p1) {
        return p0.x - p1.x;
    });

    PivotPoint.init({ x: 100, y: 80, offset: width });

    function getPixels (data) {
        var pixels = [];
        var x = 0, y = 0;
        for (var i = 0; i < data.length; i += 4) {
            x = parseInt(i / 4) % width;
            y = parseInt(i / pixelsPerLine);
            var opacity = data[i + 3] / 255;
            if (opacity == 0) {
                continue;
            }
            var r = data[i];
            var g = data[i + 1];
            var b = data[i + 2];
            pixels.push({x: x, y: y, color: 'rgba(' + r + ',' + g + ',' + b + ',' + opacity.toFixed(2) + ')'});
        }
        return pixels;
    }

    function generatePoints (index) {
        var offset = index * countPointsPerFrame;
        for (var i = 0; i < countPointsPerFrame; ++i) {
            var pixel = pixels[offset + i];
            if (!pixel) {
                return;
            }
            var p = Particle.create({
                x: PivotPoint.getX(),
                y: PivotPoint.getY(),
                finalX: pixel.x,
                finalY: pixel.y,
                color: pixel.color,
                context: context
            });
            points.push(p);
        }
    }

    var points = [];
    var countPointsPerFrame = 150;
    var index = 0;
    var endDate = +new Date();

    function update () {
        var dt = +new Date() - endDate;
        generatePoints(index);
        ++index;
        context.clearRect(0, 0, canvas.width, canvas.height);
        for (var i = 0, len = points.length; i < len; ++i) {
            var point = points[i];
            point.update();
            point.draw();
        }
        PivotPoint.update(dt);
        endDate = +new Date();
        requestAnimationFrame(update);
    }

    update();