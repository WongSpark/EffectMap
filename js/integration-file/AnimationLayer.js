import {Vector} from "ol/layer";
import EventType from "ol/render/EventType";
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";
import GeometryType from "ol/geom/GeometryType";
import Feature from "ol/Feature";

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Rect {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
    }
}

/**
 * @typedef {object} HaloAnimationOption
 * @property {number} maxRadius 最大环半径
 * @property {number} minRadius 最小环半径
 * @property {number} lineWidth 光环线的宽度
 * @property {number} radiusIncrement 每一帧半径增量
 * @property {string} color 光环颜色
 *
 * @property outCircleRadius {number} 外环半径
 * @property outCircleColor {string} 外环颜色
 * @property outLineWidth {number} 外环线宽
 * @property innerCircleRadius {number} 内环半径
 * @property innerCircleColor {string} 内环颜色
 * @property innerLineWidth {number} 内环线宽
 */
/**
 * 动画图层，可设置炫光环特效。
 * @class HaloAnimationLayer
 * @extends Vector
 */
class HaloAnimationLayer extends Vector {
    /**
     * @param opt {HaloAnimationOption} - 同时支持Openlayers Vector图层的配置项
     */
    constructor(opt) {
        super(opt);

        //光环动画属性
        this.lineWidth = opt.lineWidth ? opt.lineWidth : 5;
        this.maxRadius = opt.maxRadius ? opt.maxRadius : 40;
        this.minRadius = opt.minRadius ? opt.minRadius : 15;
        this.radiusIncrement = opt.radiusIncrement ? opt.radiusIncrement : 0.5;
        this.color = opt.color ? opt.color : 'rgba(131, 45, 72,1)';

        /**
         * @type {number}
         * @private
         */
        this._canvasPadding = 10;
        this._tempRadius = 0;
        this._canvasHeight = this.maxRadius * 2;
        this._canvasWidth = this.maxRadius * 2;

        this._textCanvas = document.createElement('canvas');
        this._textCanvas.width = this._canvasWidth;
        this._textCanvas.height = this._canvasHeight;


        this._frontCanvas = document.createElement('canvas');
        this._frontCanvas.width = this._canvasWidth;
        this._frontCanvas.height = this._canvasHeight;

        this._backCanvas = document.createElement('canvas');
        this._backCanvas.width = this._canvasWidth;
        this._backCanvas.height = this._canvasHeight;
        this._backContext = this._backCanvas.getContext('2d');
        this._backContext.globalAlpha = 0.95;
        this._backContext.globalCompositeOperation = 'copy';

        this.listenComposeKey = this.on(EventType.POSTCOMPOSE, (e) => {
            this.getSource().changed();
        });

        this.listenRenderKey = this.on(EventType.RENDER, (e) => {
            this._renderHandler(e);
        });

        //文本特效属性
        this._textStyleMap = /**@type {Map.<string,Style>}*/new Map();

        //进度环特效属性
        this._styleCacheByProgress = /**@type {Map<number,Style>}*/new Map();
        this._internalIdRecord = 0;
        this._internalIdKey = "_progress_circle__inner_id";
        this.backgroundCircleRadius = opt.outCircleRadius ? opt.outCircleRadius : 10;
        this.frontCircleRadius = opt.innerCircleRadius ? opt.innerCircleRadius : 10;
        this.canvasWidth = this.backgroundCircleRadius * 2 + 10;
        this.canvasHeight = this.backgroundCircleRadius * 2 + 10;
        this.backgroundCircleColor = opt.outCircleColor ? opt.outCircleColor : "rgb(209, 211, 214)";
        this.frontCircleColor = opt.innerCircleColor ? opt.innerCircleColor : "#e8a915";
        this.backgroundLineWidth = opt.outLineWidth ? opt.outLineWidth : 4;
        this.frontLineWidth = opt.innerLineWidth ? opt.innerLineWidth : 4;

        this.getSource().on("addfeature", (event) => {
            let feature = event.feature;
            let featureId = this._internalIdRecord++;
            feature.set(this._internalIdKey, featureId);

            let featureProgress = feature.get("progress");
            let style = this._composeCircleStyle(featureProgress);
            this._styleCacheByProgress.set(featureProgress.toFixed(2), style);
        });

        this.getSource().on("changefeature", (event) => {
            let feature = event.feature;
            let progress = feature.get("progress");
            if (!this._styleCacheByProgress.get(progress.toFixed(2))) {
                let style = this._composeCircleStyle(progress);
                this._styleCacheByProgress.set(progress.toFixed(2), style);
                this.changed();
            }
        });

        this.setRenderOrder(null);
    }

    /**
     * 关闭动画
     */
    disableAnimation() {
        Observable.unByKey(this.listenComposeKey);
        Observable.unByKey(this.listenRenderKey);
    }

    /**
     * 开启动画
     */
    enableAnimation() {
        this.listenComposeKey = this.on(EventType.POSTCOMPOSE, (e) => {
            this.getSource().changed();
        });
        this.listenRenderKey = this.on(EventType.RENDER, (e) => {
            this._renderHandler(e);
        });
        this.getSource().changed();
    }

    /**
     * 渲染处理器
     * @param renderEvent
     * @private
     */
    _renderHandler(renderEvent) {
        let frameState = renderEvent.frameState;
        let features = this.getSource().getFeaturesInExtent(frameState.extent);
        let points = features.filter(feature => {
            return feature.getGeometry().getType() === GeometryType.POINT;
        });
        if (points && points.length > 0) {
            this._renderHaloCircle(renderEvent, points);
            this._renderProgressCircle(renderEvent, points);
            this._renderText(renderEvent, points);
        }
    }

    /**
     * 渲染进度环
     * @param event
     * @param points
     * @private
     */
    _renderProgressCircle(event, points) {
        let vectorContext = event.vectorContext;
        points.forEach(pointFeature => {
            let progress = pointFeature.get("progress");
            if (progress) {
                let point = pointFeature.getGeometry();
                progress = progress.toFixed(2);
                let style = this._styleCacheByProgress.get(progress);
                vectorContext.setStyle(style);
                vectorContext.drawGeometry(point)
            }
        })
    }

    _composeCircleStyle(progress) {
        let canvas = document.createElement('canvas');
        canvas.width = this.canvasWidth;
        canvas.height = this.canvasHeight;
        let context = canvas.getContext("2d");
        context.beginPath();
        context.lineWidth = this.backgroundLineWidth;
        context.strokeStyle = this.backgroundCircleColor;
        context.arc(this.canvasWidth / 2, this.canvasHeight / 2, this.backgroundCircleRadius, 0, Math.PI * 2);
        context.stroke();
        context.closePath();

        context.beginPath();
        context.lineWidth = this.frontLineWidth;
        context.strokeStyle = this.frontCircleColor;
        context.arc(this.canvasWidth / 2, this.canvasHeight / 2, this.frontCircleRadius, 0, Math.PI * 2 * progress);
        context.stroke();
        context.closePath();

        return new Style({
            image: new Icon({
                img: canvas,
                imgSize: [canvas.width, canvas.height]
            })
        });
    };

    /**
     * 渲染文本
     * @param renderEvent
     * @param points
     * @private
     */
    _renderText(renderEvent, points) {
        let vectorContext = renderEvent.vectorContext;
        for (let i = 0; i < points.length; i++) {
            let feature = points[i];
            let textWithColor = feature.get("textWithColor");
            let enableTextBackground = feature.get("enableTextBackground");
            if (textWithColor && enableTextBackground) {
                let style = this._textStyleMap.get(textWithColor);
                if (!style) {
                    style = this._composeTextStyle(textWithColor);
                    this._textStyleMap.set(textWithColor, style);
                }
                vectorContext.setStyle(style);
                vectorContext.drawGeometry(feature.getGeometry());
            }
        }
    }

    _composeTextStyle(textContent) {
        let canvas = document.createElement('canvas');
        let context = canvas.getContext("2d");
        context.font = "bold 14px 微软雅黑";

        let textAndColors = textContent.split(";");
        let textTotalLength = textAndColors.map(textAndColor => {
            return textAndColor.split("$")[0];
        }).reduce((sum, text) => {
            sum += context.measureText(text).width;
            return sum;
        }, 0);
        let textLengthWithBuffer = textTotalLength + 20;

        canvas.width = textLengthWithBuffer;
        canvas.height = this._canvasHeight;

        context.strokeStyle = "#373665e8";
        context.fillStyle = "#373665e8";
        let rect = new Rect(0, 0, textLengthWithBuffer, 24);
        this._drawRoundedRectWithTriangle(rect, 10, context);

        let textOffsetX = 10;
        context.font = "bold 14px 微软雅黑";
        context.fillStyle = "white";
        context.textAlign = "start";
        context.textBaseline = "top";
        for (let i = 0; i < textAndColors.length; i++) {
            let textAndColor = textAndColors[i].split("$");
            let textOnly = textAndColor[0];
            let colorOnly = textAndColor[1];
            context.fillStyle = colorOnly;
            context.fillText(textOnly, textOffsetX, 5);
            textOffsetX += context.measureText(textOnly).width;
        }

        return new Style({
            image: new Icon({
                img: canvas,
                imgSize: [canvas.width, canvas.height]
            })
        });
    }

    /**
     * 绘制带三角的圆角矩形
     * @param rect
     * @param r
     * @param context
     * @private
     */
    _drawRoundedRectWithTriangle(rect, r, context) {
        let ptA = new Point(rect.x + r, rect.y);
        let ptB = new Point(rect.x + rect.width, rect.y);
        let ptC = new Point(rect.x + rect.width, rect.y + rect.height);
        let ptD = new Point(rect.x, rect.y + rect.height);
        let ptE = new Point(rect.x, rect.y);

        context.beginPath();

        context.moveTo(ptA.x, ptA.y);
        context.arcTo(ptB.x, ptB.y, ptC.x, ptC.y, r);
        context.arcTo(ptC.x, ptC.y, ptD.x, ptD.y, r);
        context.arcTo(ptD.x, ptD.y, ptE.x, ptE.y, r);
        context.arcTo(ptE.x, ptE.y, ptA.x, ptA.y, r);

        let y = ptC.y;
        let x = (ptC.x + ptD.x) / 2 - 5;
        context.moveTo(x, y);
        context.lineTo(x + 5, y + 5);
        context.lineTo(x + 10, y);
        // context.stroke();
        context.fill();
    }

    /**
     * 绘制圆角矩形
     * @param rect
     * @param r
     * @param context
     * @private
     */
    _drawRoundedRect(rect, r, context) {
        let ptA = new Point(rect.x + r, rect.y);
        let ptB = new Point(rect.x + rect.width, rect.y);
        let ptC = new Point(rect.x + rect.width, rect.y + rect.height);
        let ptD = new Point(rect.x, rect.y + rect.height);
        let ptE = new Point(rect.x, rect.y);

        context.beginPath();

        context.moveTo(ptA.x, ptA.y);
        context.arcTo(ptB.x, ptB.y, ptC.x, ptC.y, r);
        context.arcTo(ptC.x, ptC.y, ptD.x, ptD.y, r);
        context.arcTo(ptD.x, ptD.y, ptE.x, ptE.y, r);
        context.arcTo(ptE.x, ptE.y, ptA.x, ptA.y, r);

        // context.stroke();
        context.fill();
    }

    /**
     * 构成处理器
     * @param renderEvent
     * @param points
     * @private
     */
    _renderHaloCircle(renderEvent, points) {
        let vectorContext = renderEvent.vectorContext;
        this._setHaloCircle(vectorContext);

        for (let i = 0; i < points.length; i++) {
            let feature = points[i];
            if (feature.get("animation")) {
                vectorContext.drawGeometry(feature.getGeometry());
            }
        }

        this.getSource().changed();
    }

    _setHaloCircle(vectorContext) {
        let canvasStyle = new Style({
            image: new Icon({
                img: this._getStyleCanvas(),
                scale: 1,
                imgSize: [this._canvasWidth, this._canvasHeight],
            })
        });
        vectorContext.setStyle(canvasStyle);
    }

    _getStyleCanvas() {
        let context = this._frontCanvas.getContext("2d");
        this._backContext.drawImage(this._frontCanvas, 0, 0, this._canvasWidth, this._canvasHeight);
        context.clearRect(0, 0, this._canvasWidth, this._canvasHeight);
        this._drawCircle();
        context.drawImage(this._backCanvas, 0, 0, this._canvasWidth, this._canvasHeight);
        return this._frontCanvas;
    };

    _drawCircle() {
        let context = this._frontCanvas.getContext("2d");
        context.beginPath();
        context.arc(this.maxRadius, this.maxRadius, this._tempRadius, 0, Math.PI * 2);
        context.closePath();
        context.lineWidth = this.lineWidth;
        context.strokeStyle = this.color;
        context.stroke();
        this._tempRadius += this.radiusIncrement;

        if (this._tempRadius > this.maxRadius - this._canvasPadding) {
            this._tempRadius = this.minRadius;
        }
    };
}

/**
 * 兼容Feature所有属性，以下为自定义属性
 * @typedef AnimationFeatureOption
 * @property {boolean} animation - 是否开启光环动画
 * @property {boolean} enableTextBackground - 是否开启文本背景特效
 * @property {string} textWithColor - 文本与颜色合并的字符串(eg:`我要测试$#fb0505;我就是我$#ffffff;`)
 * @property {number} progress - 进度(0-1)
 */

class AnimationFeature extends Feature {
    /**
     * @param opt {AnimationFeatureOption}
     */
    constructor(opt) {
        super(opt);
    }
}

export {HaloAnimationLayer, AnimationFeature}


