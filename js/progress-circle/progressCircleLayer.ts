import {Vector} from "ol/layer";
import {Extent} from "ol/extent";
import {OrderFunction} from "ol/render";
import VectorRenderType from "ol/layer/VectorRenderType";
import VectorSource from "ol/source/Vector";
import PluggableMap from "ol/PluggableMap";
import Style, {StyleLike} from "ol/style/Style";
import RenderEvent from "ol/render/Event";
import GeometryType from "ol/geom/GeometryType";
import Point from "ol/geom/Point";
import Icon from "ol/style/Icon";
import VectorContext from "ol/render/VectorContext";

export default class ProgressCircleLayer extends Vector {
    canvasWidth: number;
    canvasHeight: number;
    outCircleRadius: number;
    innerCircleRadius: number;
    outCircleColor: string;
    innerCircleColor: string;
    styleCache: Map<number, Style> = new Map();
    canvas = document.createElement('canvas');

    constructor(opt: Options) {
        super(opt);
        this.outCircleRadius = opt.outCircleRadius ? opt.outCircleRadius : 10;
        this.innerCircleRadius = opt.innerCircleRadius ? opt.innerCircleRadius : 10;
        this.canvasWidth = this.outCircleRadius * 2 + 10;
        this.canvasHeight = this.outCircleRadius * 2 + 10;
        this.outCircleColor = opt.outCircleColor ? opt.outCircleColor : "rgb(209, 211, 214)";
        this.innerCircleColor = opt.innerCircleColor ? opt.innerCircleColor : "#e8a915";

        this.on("postcompose", (event) => {
            this.drawCircle(event);
        });

        this.getSource().on("addfeature", (event) => {
            console.log(event);
            let feature = event.feature;
            let featureId = feature.get("id");
            let featureProgress = feature.get("progress");
            let style = this._composeProgressCircle(featureProgress);
            this.styleCache.set(featureId, style);
        });
        this.getSource().on("removefeature", (event) => {
            console.log(event);
            let feature = event.feature;

        });
        this.getSource().on("changefeature", (event) => {
            console.log(event);
            let feature = event.feature;
        });
    }

    drawCircle(event: RenderEvent) {
        let vectorContext = event.vectorContext;
        let points = this.getSource().getFeatures().filter(feature => {
            return feature.getGeometry().getType() === GeometryType.POINT;
        });
        this._composeBackgroundCircle(vectorContext);
        points.forEach(pointFeature => {
            let point = <Point>pointFeature.getGeometry();
            vectorContext.drawGeometry(point.clone());
        });
        points.forEach(pointFeature => {
            let point = pointFeature.getGeometry();
            let featureId = pointFeature.get("id");
            let style = this.styleCache.get(featureId);
            vectorContext.setStyle(style);
            vectorContext.drawGeometry(point.clone())
        })
    }

    _composeBackgroundCircle(vectorContext: VectorContext) {
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        let context = this.canvas.getContext("2d");
        context.beginPath();
        context.arc(this.canvasWidth / 2, this.canvasHeight / 2, this.outCircleRadius, 0, Math.PI * 2);
        context.lineWidth = 4;
        context.strokeStyle = this.outCircleColor;
        context.stroke();

        let canvasStyle = new Style({
            image: new Icon({
                img: this.canvas,
                imgSize: [this.canvas.width, this.canvas.height]
            })
        });
        vectorContext.setStyle(canvasStyle);
    };

    _composeProgressCircle(progress: number): Style {
        let canvas = document.createElement('canvas');
        canvas.width = this.canvasWidth;
        canvas.height = this.canvasHeight;
        let context = canvas.getContext("2d");
        context.beginPath();
        context.arc(this.canvasWidth / 2, this.canvasHeight / 2, this.innerCircleRadius, 0, Math.PI * 2 * progress);
        context.lineWidth = 4;
        context.strokeStyle = this.innerCircleColor;
        context.stroke();

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

export interface Options {
    outCircleRadius?: number;
    innerCircleRadius?: number;
    outCircleColor?: string;
    innerCircleColor?: string;
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
