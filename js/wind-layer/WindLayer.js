import {Map} from 'ol';
import {Image as ImageLayer} from 'ol/layer';
import {ImageCanvas} from 'ol/source';
import {transformExtent} from 'ol/proj';
import Windy from './Windy';
import {createCanvas, getDirection, getSpeed} from './helper';

class windLayer extends ImageLayer {
    constructor(data, options = {}) {
        super(options);
        this._canvas = null;
        this._data = data;
        this._windy = null;
        this._isClear = false;
        this.options = options;

        this.setSource(new ImageCanvas({
            state: options.state,
            resolutions: options.resolutions,
            canvasFunction: this.canvasFunction.bind(this),
            ratio: (options.hasOwnProperty('ratio') ? options.ratio : 1)
        }));

        this.on("postcompose", () => {
            this.changed();
        });
        this.on('render', this.redraw, this);
    }

    /**
     * get layer data
     * @returns {*}
     */
    getData() {
        return this._data;
    }

    /**
     * set layer data
     * @param data
     * @returns {windLayer}
     */
    setData(data) {
        const _map = this.getMap();
        if (!_map) return this;
        this._data = data;
        this._isClear = false;
        if (!this._windy && this._canvas) {
            this.render(this._canvas);
            _map.renderSync();
        } else if (this._windy && this._canvas) {
            if (this._cloneLayer) {
                _map.addLayer(this._cloneLayer);
                delete this._cloneLayer;
            }
            const extent = this._getExtent();
            this._windy.update(this.getData(), extent[0], extent[1], extent[2], extent[3]);
        } else {
            console.warn('please create new instance');
        }
        return this;
    }

    /**
     * render windy layer
     * @returns {windLayer}
     */
    render(canvas) {
        const extent = this._getExtent();
        if (this._isClear || !this.getData() || !extent) return this;
        if (canvas && !this._windy) {
            const {
                minVelocity,
                maxVelocity,
                velocityScale,
                particleAge,
                lineWidth,
                particleMultiplier,
                colorScale
            } = this.options;
            this._windy = new Windy({
                canvas: canvas,
                projection: this._getProjectionCode(),
                data: this.getData(),
                minVelocity,
                maxVelocity,
                velocityScale,
                particleAge,
                lineWidth,
                particleMultiplier,
                colorScale
            });
            this._windy.start(extent[0], extent[1], extent[2], extent[3]);
        } else if (canvas && this._windy) {
            const extent = this._getExtent();
            this._windy.start(extent[0], extent[1], extent[2], extent[3]);
        }
        return this
    }

    /**
     * re-draw
     */
    redraw() {
        if (this._isClear) return;
        const _extent = this.options.extent || this._getMapExtent();
        this.setExtent(_extent);
    }

    /**
     * canvas constructor
     * @param extent
     * @param resolution
     * @param pixelRatio
     * @param size
     * @param projection
     * @returns {*}
     */
    canvasFunction(extent, resolution, pixelRatio, size, projection) {
        if (!this._canvas) {
            this._canvas = createCanvas(size[0], size[1]);
        } else {
            this._canvas.width = size[0];
            this._canvas.height = size[1];
        }
        if (resolution <= this.get('maxResolution')) {
            this.render(this._canvas);
        } else {
            // console.warn('超出所设置最大分辨率！')
        }
        return this._canvas;
    }

    /**
     * bounds, width, height, extent
     * @returns {*}
     * @private
     */
    _getExtent() {
        const size = this._getMapSize();
        const _extent = this._getMapExtent();
        if (size && _extent) {
            const _projection = this._getProjectionCode();
            const extent = transformExtent(_extent, _projection, 'EPSG:4326');
            return [[[0, 0], [size[0], size[1]]], size[0], size[1], [[extent[0], extent[1]], [extent[2], extent[3]]]];
        } else {
            return false;
        }
    }

    /**
     * get map current extent
     * @returns {View|*|Array<number>}
     * @private
     */
    _getMapExtent() {
        if (!this.getMap()) return;
        const size = this._getMapSize();
        const _view = this.getMap().getView();
        return _view && _view.calculateExtent(size);
    }

    /**
     * get size
     * @returns {Size|*}
     * @private
     */
    _getMapSize() {
        if (!this.getMap()) return;
        return this.getMap().getSize();
    }

    /**
     * append layer to map
     * @param map
     */
    appendTo(map) {
        if (map && map instanceof Map) {
            this.set('originMap', map);
            map.addLayer(this);
        } else {
            throw new Error('not map object');
        }
    }

    /**
     * get mouse point data
     * @param coordinates
     * @returns {null|{speed: (*|number), direction}}
     */
    getPointData(coordinates) {
        if (!this._windy) return null;
        const gridValue = this._windy.interpolatePoint(coordinates[0], coordinates[1]);
        if (gridValue && !isNaN(gridValue[0]) && !isNaN(gridValue[1]) && gridValue[2]) {
            return {
                direction: getDirection(gridValue[0], gridValue[1], this.options.angleConvention || 'bearingCCW'),
                speed: getSpeed(gridValue[0], gridValue[1], this.options.speedUnit)
            }
        }
    }

    /**
     * clearWind method will retain the instance
     * @private
     */
    clearWind() {
        const _map = this.getMap();
        if (!_map) return;
        if (this._windy) this._windy.stop();
        this._isClear = true;
        this._cloneLayer = this;
        _map.removeLayer(this);
        this.changed();
        this.getMap().renderSync();
    }

    /**
     * remove layer this instance will be destroyed after remove
     */
    removeLayer() {
        const _map = this.getMap();
        if (!_map) return;
        if (this._windy) this._windy.stop();
        this.un('render', this.redraw, this);
        _map.removeLayer(this);
        delete this._canvas;
        delete this._windy;
        delete this._cloneLayer;
    }

    /**
     * set map
     * @param map
     */
    setMap(map) {
        this.set('originMap', map);
    }

    /**
     * get map
     */
    getMap() {
        return this.get('originMap');
    }

    _getProjectionCode() {
        let code = '';
        const map = this.getMap();
        if (map) {
            code = map.getView() && map.getView().getProjection().getCode();
        } else {
            code = 'EPSG:3857';
        }
        return code;
    }

    /**
     * update windy config
     * @param params
     * @returns {windLayer}
     */
    updateParams(params) {
        this.options = Object.assign(this.options, params);
        if (this._windy) {
            const {
                minVelocity, // 粒子强度最小的速度 (m/s)
                maxVelocity, // 粒子强度最大的速度 (m/s)
                velocityScale, // 风速的比例
                particleAge, // 重绘之前生成的离子数量的最大帧数
                lineWidth, // 绘制粒子的线宽
                particleMultiplier, // 离子数量
                colorScale
            } = this.options;
            if (this._windy) {
                this._windy.updateParams({
                    minVelocity,
                    maxVelocity,
                    velocityScale,
                    particleAge,
                    lineWidth,
                    particleMultiplier,
                    colorScale
                });
                if (this.getMap() && this._canvas && this._data) {
                    this.render(this._canvas);
                }
            }
        }
        return this;
    }

    /**
     * get windy config
     * @returns {null|*|Windy.params|{velocityScale, minVelocity, maxVelocity, colorScale, particleAge, lineWidth, particleMultiplier}}
     */
    getParams() {
        return this._windy && this._windy.getParams();
    }
}

export default windLayer;
