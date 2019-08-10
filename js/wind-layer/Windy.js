/* eslint-disable */

/*  Global class for simulating the movement of particle through a 1km wind grid
 credit: All the credit for this work goes to: https://github.com/cambecc for creating the repo:
 https://github.com/cambecc/earth. The majority of this code is directly take nfrom there, since its awesome.
 This class takes a canvas element and an array of data (1km GFS from http://www.emc.ncep.noaa.gov/index.php?branch=GFS)
 and then uses a mercator (forward/reverse) projection to correctly map wind vectors in "map space".
 The "start" method takes the bounds of the map at its current extent and starts the whole gridding,
 interpolation and animation process.
 */

const Windy = function (params = {}) {
    this.params = params;
    const that = this;

    that.canvas = params.canvas;

    let defaultColorScale = [
        "rgba(36,104, 180,0.5)",
        "rgba(60,157, 194,0.5)",
        "rgba(128,205,193 ,0.5)",
        "rgba(151,218,168 ,0.5)",
        "rgba(198,231,181,0.5)",
        "rgba(238,247,217,0.5)"
    ];

    let buildParams = function (params) {
        if (!params.projection) params.projection = 'EPSG:4326';
        that.MIN_VELOCITY_INTENSITY = params.minVelocity || 0;                      // velocity at which particle intensity is minimum (m/s)
        that.MAX_VELOCITY_INTENSITY = params.maxVelocity || 10;                     // velocity at which particle intensity is maximum (m/s)
        that.VELOCITY_SCALE = (params.velocityScale || 0.005) * (Math.pow(window.devicePixelRatio, 1 / 3) || 1); // scale for wind velocity (completely arbitrary--this value looks nice)
        that.MAX_PARTICLE_AGE = params.particleAge || 90;                         	 // max number of frames a particle is drawn before regeneration
        that.PARTICLE_LINE_WIDTH = params.lineWidth || 1;                           // line width of a drawn particle
        that.PARTICLE_MULTIPLIER = params.particleMultiplier || 1 / 300;            // particle count scalar (completely arbitrary--this values looks nice)
        that.PARTICLE_REDUCTION = (Math.pow(window.devicePixelRatio, 1 / 3) || 1.6);   // multiply particle count for mobiles by this amount
        that.FRAME_RATE = params.frameRate || 16;
        that.COLOR_SCALE = params.colorScale || defaultColorScale;
    };

    buildParams(params);

    window.FRAME_TIME = 1000 / that.FRAME_RATE;   // desired frames per second

    let NULL_WIND_VECTOR = [NaN, NaN, null];  // singleton for no wind in the form: [u, v, magnitude]

    let builder;
    let grid;
    let gridData = that.params.data;
    let date;
    let λ0, φ0, Δλ, Δφ, ni, nj;

    let setData = function (data) {
        gridData = data;
    };

    // interpolation for vectors like wind (u,v,m)
    let bilinearInterpolateVector = function (x, y, g00, g10, g01, g11) {
        let rx = (1 - x);
        let ry = (1 - y);
        let a = rx * ry, b = x * ry, c = rx * y, d = x * y;
        let u = g00[0] * a + g10[0] * b + g01[0] * c + g11[0] * d;
        let v = g00[1] * a + g10[1] * b + g01[1] * c + g11[1] * d;
        return [u, v, Math.sqrt(u * u + v * v)];
    };


    let createWindBuilder = function (uComp, vComp) {
        let uData = uComp.data, vData = vComp.data;
        return {
            header: uComp.header,
            //recipe: recipeFor("wind-" + uComp.header.surface1Value),
            data: function (i) {
                return [uData[i], vData[i]];
            },
            interpolate: bilinearInterpolateVector
        }
    };

    let createBuilder = function (data) {
        let uComp = null, vComp = null, scalar = null;

        data.forEach(function (record) {
            switch (record.header.parameterCategory + "," + record.header.parameterNumber) {
                case "1,2":
                case "2,2":
                    uComp = record;
                    break;
                case "1,3":
                case "2,3":
                    vComp = record;
                    break;
                default:
                    scalar = record;
            }
        });

        return createWindBuilder(uComp, vComp);
    };

    let buildGrid = function (data, callback) {

        builder = createBuilder(data);
        let header = builder.header;

        λ0 = header.lo1;
        φ0 = Math.max(header.la2, header.la1);  // the grid's origin (e.g., 0.0E, 90.0N)

        Δλ = header.dx;
        Δφ = header.dy;    // distance between grid points (e.g., 2.5 deg lon, 2.5 deg lat)

        ni = header.nx;
        nj = header.ny;    // number of grid points W-E and N-S (e.g., 144 x 73)

        date = new Date(header.refTime);
        date.setHours(date.getHours() + header.forecastTime);

        // Scan mode 0 assumed. Longitude increases from λ0, and latitude decreases from φ0.
        // http://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_table3-4.shtml
        grid = [];
        let p = 0;
        let isContinuous = Math.floor(ni * Δλ) >= 360;

        for (let j = 0; j < nj; j++) {
            let row = [];
            for (let i = 0; i < ni; i++, p++) {
                row[i] = builder.data(p);
            }
            if (isContinuous) {
                // For wrapped grids, duplicate first column as last column to simplify interpolation logic
                row.push(row[0]);
            }
            grid[j] = row;
        }

        callback({
            date: date,
            interpolate: interpolate
        });
    };

    /**
     * Get interpolated grid value from Lon/Lat position
     * @param λ {Float} Longitude
     * @param φ {Float} Latitude
     * @returns {Object}
     */
    let interpolate = function (λ, φ) {

        if (!grid) return null;

        let i = floorMod(λ - λ0, 360) / Δλ;  // calculate longitude index in wrapped range [0, 360)
        let j = (φ0 - φ) / Δφ;                 // calculate latitude index in direction +90 to -90

        let fi = Math.floor(i), ci = fi + 1;
        let fj = Math.floor(j), cj = fj + 1;

        let row;
        if ((row = grid[fj])) {
            let g00 = row[fi];
            let g10 = row[ci];
            if (isValue(g00) && isValue(g10) && (row = grid[cj])) {
                let g01 = row[fi];
                let g11 = row[ci];
                if (isValue(g01) && isValue(g11)) {
                    // All four points found, so interpolate the value.
                    return builder.interpolate(i - fi, j - fj, g00, g10, g01, g11);
                }
            }
        }
        return null;
    };

    /**
     * @returns {Boolean} true if the specified value is not null and not undefined.
     */
    let isValue = function (x) {
        return x !== null && x !== undefined;
    };

    /**
     * @returns {Number} returns remainder of floored division, i.e., floor(a / n). Useful for consistent modulo
     *          of negative numbers. See http://en.wikipedia.org/wiki/Modulo_operation.
     */
    let floorMod = function (a, n) {
        return a - n * Math.floor(a / n);
    };

    /**
     * @returns {Number} the value x clamped to the range [low, high].
     */
    let clamp = function (x, range) {
        return Math.max(range[0], Math.min(x, range[1]));
    };

    /**
     * @returns {Boolean} true if agent is probably a mobile device. Don't really care if this is accurate.
     */
    let isMobile = function () {
        return (/android|blackberry|iemobile|ipad|iphone|ipod|opera mini|webos/i).test(navigator.userAgent);
    };

    /**
     * Calculate distortion of the wind vector caused by the shape of the projection at point (x, y). The wind
     * vector is modified in place and returned by this function.
     */
    let distort = function (projection, λ, φ, x, y, scale, wind, windy) {
        let u = wind[0] * scale;
        let v = wind[1] * scale;
        let d = distortion(projection, λ, φ, x, y, windy);

        // Scale distortion vectors by u and v, then add.
        wind[0] = d[0] * u + d[2] * v;
        wind[1] = d[1] * u + d[3] * v;
        return wind;
    };

    let distortion = function (projection, λ, φ, x, y, windy) {
        let τ = 2 * Math.PI;
        // let H = Math.pow(10, -5.2);
        let H = that.params.projection === 'EPSG:4326' ? 5 : Math.pow(10, -5.2);
        let hλ = λ < 0 ? H : -H;
        let hφ = φ < 0 ? H : -H;

        let pλ = project(φ, λ + hλ, windy);
        let pφ = project(φ + hφ, λ, windy);

        // Meridian scale factor (see Snyder, equation 4-3), where R = 1. This handles issue where length of 1º λ
        // changes depending on φ. Without this, there is a pinching effect at the poles.
        let k = Math.cos(φ / 360 * τ);
        return [
            (pλ[0] - x) / hλ / k,
            (pλ[1] - y) / hλ / k,
            (pφ[0] - x) / hφ,
            (pφ[1] - y) / hφ
        ];
    };

    let createField = function (columns, bounds, callback) {

        /**
         * @returns {Array} wind vector [u, v, magnitude] at the point (x, y), or [NaN, NaN, null] if wind
         *          is undefined at that point.
         */
        function field(x, y) {
            let column = columns[Math.round(x)];
            return column && column[Math.round(y)] || NULL_WIND_VECTOR;
        }

        // Frees the massive "columns" array for GC. Without this, the array is leaked (in Chrome) each time a new
        // field is interpolated because the field closure's context is leaked, for reasons that defy explanation.
        field.release = function () {
            columns = [];
        };

        field.randomize = function (o) {  // UNDONE: this method is terrible
            let x, y;
            let safetyNet = 0;
            do {
                x = Math.round(Math.floor(Math.random() * bounds.width) + bounds.x);
                y = Math.round(Math.floor(Math.random() * bounds.height) + bounds.y)
            } while (field(x, y)[2] === null && safetyNet++ < 30);
            o.x = x;
            o.y = y;
            return o;
        };

        callback(bounds, field);
    };

    let buildBounds = function (bounds, width, height) {
        let upperLeft = bounds[0];
        let lowerRight = bounds[1];
        let x = Math.round(upperLeft[0]); //Math.max(Math.floor(upperLeft[0], 0), 0);
        let y = Math.max(Math.floor(upperLeft[1], 0), 0);
        let xMax = Math.min(Math.ceil(lowerRight[0], width), width - 1);
        let yMax = Math.min(Math.ceil(lowerRight[1], height), height - 1);
        return {x: x, y: y, xMax: width, yMax: yMax, width: width, height: height};
    };

    let deg2rad = function (deg) {
        return (deg / 180) * Math.PI;
    };

    let rad2deg = function (ang) {
        return ang / (Math.PI / 180.0);
    };

    let invert

    if (that.params.projection === 'EPSG:4326') {
        invert = function (x, y, windy) {
            let mapLonDelta = windy.east - windy.west;
            let mapLatDelta = windy.south - windy.north;
            let lat = rad2deg(windy.north) + y / windy.height * rad2deg(mapLatDelta);
            let lon = rad2deg(windy.west) + x / windy.width * rad2deg(mapLonDelta);
            return [lon, lat];
        };
    } else {
        invert = function (x, y, windy) {
            let mapLonDelta = windy.east - windy.west;
            let worldMapRadius = windy.width / rad2deg(mapLonDelta) * 360 / (2 * Math.PI);
            let mapOffsetY = (worldMapRadius / 2 * Math.log((1 + Math.sin(windy.south)) / (1 - Math.sin(windy.south))));
            let equatorY = windy.height + mapOffsetY;
            let a = (equatorY - y) / worldMapRadius;
            let lat = 180 / Math.PI * (2 * Math.atan(Math.exp(a)) - Math.PI / 2);
            let lon = rad2deg(windy.west) + x / windy.width * rad2deg(mapLonDelta);
            return [lon, lat];
        };
    }

    let mercY = function (lat) {
        return Math.log(Math.tan(lat / 2 + Math.PI / 4));
    };


    let project = function (lat, lon, windy) { // both in radians, use deg2rad if neccessary
        let ymin = mercY(windy.south);
        let ymax = mercY(windy.north);
        let xFactor = windy.width / (windy.east - windy.west);
        let yFactor = windy.height / (ymax - ymin);

        let y = mercY(deg2rad(lat));
        let x = (deg2rad(lon) - windy.west) * xFactor;
        y = (ymax - y) * yFactor; // y points south
        return [x, y];
    };

    let interpolateField = function (grid, bounds, extent, callback) {

        let projection = {};
        let mapArea = ((extent.south - extent.north) * (extent.west - extent.east));
        let velocityScale = that.VELOCITY_SCALE * Math.pow(mapArea, 0.4);

        let columns = [];
        let x = bounds.x;

        function interpolateColumn(x) {
            let column = [];
            for (let y = bounds.y; y <= bounds.yMax; y += 2) {
                let coord = invert(x, y, extent);
                if (coord) {
                    let λ = coord[0], φ = coord[1];
                    if (isFinite(λ)) {
                        let wind = grid.interpolate(λ, φ);
                        if (wind) {
                            wind = distort(projection, λ, φ, x, y, velocityScale, wind, extent);
                            column[y + 1] = column[y] = wind;

                        }
                    }
                }
            }
            columns[x + 1] = columns[x] = column;
        }

        (function batchInterpolate() {
            let start = Date.now();
            while (x < bounds.width) {
                interpolateColumn(x);
                x += 2;
                if ((Date.now() - start) > 1000) { //MAX_TASK_TIME) {
                    setTimeout(batchInterpolate, 25);
                    return;
                }
            }
            createField(columns, bounds, callback);
        })();
    };

    let animationLoop;
    let animate = function (bounds, field) {

        function windIntensityColorScale(min, max) {

            that.COLOR_SCALE.indexFor = function (m) {  // map velocity speed to a style
                return Math.max(0, Math.min((that.COLOR_SCALE.length - 1),
                    Math.round((m - min) / (max - min) * (that.COLOR_SCALE.length - 1))));

            };

            return that.COLOR_SCALE;
        }

        let colorStyles = windIntensityColorScale(that.MIN_VELOCITY_INTENSITY, that.MAX_VELOCITY_INTENSITY);
        let buckets = colorStyles.map(function () {
            return [];
        });

        let particleCount = Math.round(bounds.width * bounds.height * that.PARTICLE_MULTIPLIER);
        if (isMobile()) {
            particleCount *= that.PARTICLE_REDUCTION;
        }

        let fadeFillStyle = "rgba(0, 0, 0, 0.97)";

        let particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(field.randomize({age: Math.floor(Math.random() * that.MAX_PARTICLE_AGE) + 0}));
        }

        function evolve() {
            buckets.forEach(function (bucket) {
                bucket.length = 0;
            });
            particles.forEach(function (particle) {
                if (particle.age > that.MAX_PARTICLE_AGE) {
                    field.randomize(particle).age = 0;
                }
                let x = particle.x;
                let y = particle.y;
                let v = field(x, y);  // vector at current position
                let m = v[2];
                if (m === null) {
                    particle.age = that.MAX_PARTICLE_AGE;  // particle has escaped the grid, never to return...
                } else {
                    let xt = x + v[0];
                    let yt = y + v[1];
                    if (field(xt, yt)[2] !== null) {
                        // Path from (x,y) to (xt,yt) is visible, so add this particle to the appropriate draw bucket.
                        particle.xt = xt;
                        particle.yt = yt;
                        buckets[colorStyles.indexFor(m)].push(particle);
                    } else {
                        // Particle isn't visible, but it still moves through the field.
                        particle.x = xt;
                        particle.y = yt;
                    }
                }
                particle.age += 1;
            });
        }

        let g = that.canvas.getContext("2d");
        g.lineWidth = that.PARTICLE_LINE_WIDTH;
        g.fillStyle = fadeFillStyle;
        g.globalAlpha = 0.6;

        function draw() {
            // Fade existing particle trails.
            let prev = "lighter";
            g.globalCompositeOperation = "destination-in";
            g.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
            g.globalCompositeOperation = prev;
            g.globalAlpha = 0.9;

            // Draw new particle trails.
            buckets.forEach(function (bucket, i) {
                if (bucket.length > 0) {
                    g.beginPath();
                    g.strokeStyle = colorStyles[i];
                    bucket.forEach(function (particle) {
                        g.moveTo(particle.x, particle.y);
                        g.lineTo(particle.xt, particle.yt);
                        particle.x = particle.xt;
                        particle.y = particle.yt;
                    });
                    g.stroke();
                }
            });
        }

        let then = Date.now();
        (function frame() {
            animationLoop = requestAnimationFrame(frame);
            let now = Date.now();
            let delta = now - then;
            if (delta > FRAME_TIME) {
                then = now - (delta % FRAME_TIME);
                evolve();
                draw();
                params.onDraw && params.onDraw();
            }
        })();
    };

    let updateData = function (data, bounds, width, height, extent) {
        delete that.params.data;
        that.params.data = data;
        if (extent)
            start(bounds, width, height, extent);
    };

    let start = function (bounds, width, height, extent) {
        let mapBounds = {
            south: deg2rad(extent[0][1]),
            north: deg2rad(extent[1][1]),
            east: deg2rad(extent[1][0]),
            west: deg2rad(extent[0][0]),
            width: width,
            height: height
        };

        stop();

        // build grid
        buildGrid(gridData, function (grid) {
            // interpolateField
            interpolateField(grid, buildBounds(bounds, width, height), mapBounds, function (bounds, field) {
                // animate the canvas with random points
                windy.field = field;
                animate(bounds, field);
            });

        });
    };

    let stop = function () {
        if (windy.field) windy.field.release();
        if (animationLoop) cancelAnimationFrame(animationLoop);
    };

    let shift = function (dx, dy) {
        let canvas = that.canvas, w = canvas.width, h = canvas.height, ctx = canvas.getContext("2d");
        if (w > dx && h > dy) {
            let clamp = function (high, value) {
                return Math.max(0, Math.min(high, value));
            };
            let imageData = ctx.getImageData(clamp(w, -dx), clamp(h, -dy), clamp(w, w - dx), clamp(h, h - dy));
            ctx.clearRect(0, 0, w, h);
            ctx.putImageData(imageData, clamp(w, dx), clamp(h, dy));
            for (let i = 0, pLength = particles.length; i < pLength; i++) {
                particles[i].x += dx;
                particles[i].y += dy;
            }
        }
    };

    let updateParams = function (params) {
        that.params = params;
        buildParams(that.params);
    };

    let getParams = function () {
        return that.params;
    };

    let windy = {
        params: that.params,
        start: start,
        stop: stop,
        update: updateData,
        shift: shift,
        createField: createField,
        interpolatePoint: interpolate,
        setData: setData,
        updateParams: updateParams,
        getParams: getParams,
        buildParams: buildParams,
    };

    return windy;
};

// polyfill
window.requestAnimationFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            return window.setTimeout(callback, 1000 / window.FRAME_RATE);
        };
})();

if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function (id) {
        clearTimeout(id);
    };
}

export default Windy
