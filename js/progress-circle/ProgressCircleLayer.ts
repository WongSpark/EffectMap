import {Vector} from "ol/layer";
import {Extent} from "ol/extent";
import {OrderFunction} from "ol/render";
import VectorRenderType from "ol/layer/VectorRenderType";
import VectorSource from "ol/source/Vector";
import PluggableMap from "ol/PluggableMap";
import Style, {StyleLike} from "ol/style/Style";
import RenderEvent from "ol/render/Event";
import GeometryType from "ol/geom/GeometryType";
import Icon from "ol/style/Icon";
import VectorContext from "ol/render/VectorContext";
import EventType from "ol/render/EventType";

export default class ProgressCircleLayer extends Vector {
    canvasWidth: number;
    canvasHeight: number;
    backgroundCircleRadius: number;
    backgroundCircleColor: string;
    backgroundLineWidth: number;
    frontCircleRadius: number;
    frontCircleColor: string;
    frontLineWidth: number;

    private _internalIdRecord: number = 0;
    private _internalIdKey: string = "_progress_circle__inner_id";
    private _styleCache: Map<number, Style> = new Map();

    constructor(opt: Options) {
        super(opt);
        this.backgroundCircleRadius = opt.outCircleRadius ? opt.outCircleRadius : 10;
        this.frontCircleRadius = opt.innerCircleRadius ? opt.innerCircleRadius : 10;
        this.canvasWidth = this.backgroundCircleRadius * 2 + 10;
        this.canvasHeight = this.backgroundCircleRadius * 2 + 10;
        this.backgroundCircleColor = opt.outCircleColor ? opt.outCircleColor : "rgb(209, 211, 214)";
        this.frontCircleColor = opt.innerCircleColor ? opt.innerCircleColor : "#e8a915";
        this.backgroundLineWidth = opt.outLineWidth ? opt.outLineWidth : 4;
        this.frontLineWidth = opt.innerLineWidth ? opt.innerLineWidth : 4;

        //tip:for performance,render event will not impact interaction.
        this.on(EventType.RENDER, (event) => {
            this.drawCircle(event);
        });

        this.getSource().on("addfeature", (event) => {
            let feature = event.feature;
            let featureId = this._internalIdRecord++;
            feature.set(this._internalIdKey, featureId);

            let featureProgress = feature.get("progress");
            let style = this._composeCircleStyle(featureProgress);

            this._styleCache.set(featureId, style);
        });
        this.getSource().on("removefeature", (event) => {
            let feature = event.feature;
            let featureId = feature.get(this._internalIdKey);
            this._styleCache.delete(featureId);
        });
        this.getSource().on("changefeature", (event) => {
            let feature = event.feature;
            let featureId = feature.get(this._internalIdKey);
            let progress = feature.get("progress");
            let style = this._composeCircleStyle(progress);
            this._styleCache.set(featureId, style);
            this.changed();
        });

        //tips: for performance
        this.setRenderOrder(null);
    }

    drawCircle(event: RenderEvent) {
        let vectorContext = event.vectorContext;
        let points = this.getSource().getFeatures().filter(feature => {
            return feature.getGeometry().getType() === GeometryType.POINT;
        });
        points.forEach(pointFeature => {
            let point = pointFeature.getGeometry();
            let featureId = pointFeature.get(this._internalIdKey);
            let style = this._styleCache.get(featureId);
            vectorContext.setStyle(style);
            vectorContext.drawGeometry(point)
        })
    }

    _composeCircleStyle(progress: number): Style {
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
     * 设置不规则几何图形特效样式
     * @param vectorContext
     * @private
     */
    _setArrowStyle(vectorContext: VectorContext) {
        let canvas = document.createElement('canvas');
        canvas.width = 20;
        canvas.height = 20;
        let context = canvas.getContext("2d");
        context.strokeStyle = "red";
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(20, 10);
        context.lineTo(0, 20);
        context.lineTo(10, 10);
        context.lineTo(0, 0);
        context.stroke();

        // 把绘制了的canvas设置到style里面
        let canvasStyle = new Style({
            image: new Icon({
                img: canvas,
                imgSize: [canvas.width, canvas.height],
                rotation: 90 * Math.PI / 180
            })
        });
        vectorContext.setStyle(canvasStyle);
    }
}

/**
 * @property outCircleRadius {number}
 * @property outCircleColor {string}
 * @property outLineWidth {number}
 * @property innerCircleRadius {number}
 * @property innerCircleColor {string}
 * @property innerLineWidth {number}
 */
export interface Options {
    outCircleRadius?: number;
    innerCircleRadius?: number;
    outCircleColor?: string;
    innerCircleColor?: string;
    outLineWidth?: number;
    innerLineWidth?: number;
    opacity?: number;
    visible?: boolean;
    extent?: Extent;
    zIndex?: number;
    minResolution?: number;
    maxResolution?: number;
    renderOrder?: OrderFunction;
    renderBuffer?: number;
    renderMode?: VectorRenderType | string;
    source?: VectorSource;
    map?: PluggableMap;
    declutter?: boolean;
    style?: StyleLike;
    updateWhileAnimating?: boolean;
    updateWhileInteracting?: boolean;
}
