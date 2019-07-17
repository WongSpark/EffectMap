import VectorLayer from 'ol/layer/Vector';
import LineString from "ol/geom/LineString";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
// @ts-ignore
import * as turf from '@turf/turf'

import TurfUtil from "../utils/turfUtil";
import Style, {StyleLike} from "ol/style/Style";
import {Icon} from "ol/style";
import {Extent} from "ol/extent";
import {OrderFunction} from "ol/render";
import VectorRenderType from "ol/layer/VectorRenderType";
import VectorSource from "ol/source/Vector";
import PluggableMap from "ol/PluggableMap";

/**
 * 飞行路线轨迹动画图层。继承{@link VectorLayer},因此具有Layer的功能。
 * 不同之处是，从地图中移除该图层时，需要调用图层的{@link dispose}方法，释放闭包
 * 中的动画循环，否则会造成内存泄漏。
 */
export default class FlightRouteLayer extends VectorLayer {
    key:number;
    point: Feature;
    speed: number = 0;
    frameCount:number = 0;
    frameSpeed: number = 0;
    frameIndex:number = 1;
    positions: number[][];

    constructor(opt_options?: Options){
        super(opt_options);
        this.speed = opt_options.speed ? opt_options.speed : 3;
        this.frameSpeed = this.speed / 60;
    }

    /**
     * 开始播放动画
     * @param lineCoordinates
     */
    startAnimation(lineCoordinates:number[][]){
        this.positions = lineCoordinates;
        let olLine = new Feature(new LineString(this.positions));
        this.getSource().addFeature(olLine);
        this.point = new Feature(new Point(this.positions[0]));
        this.point.setStyle((feature, res)=> {
            return new Style({
                image: new Icon({
                    src: 'images/flight.svg',
                    scale:0.15,
                    rotateWithView: true,
                    rotation: (parseFloat(feature.get("direction"))/180) * Math.PI
                })
            });
        });
        this.getSource().addFeature(this.point);

        let turfLine = turf.lineString(this.positions);
        let length = turf.lineDistance(turfLine);
        this.frameCount = Math.floor(length*1000/this.frameSpeed);

        this.loop();
    }

    loop(){
        this.key = requestAnimationFrame(()=>{
            this.animation();
        })
    }

    animation(){
        if(this.frameIndex>this.frameCount) {
            cancelAnimationFrame(this.key);
        }

        this.frameIndex++;
        let turfLine = turf.lineString(this.positions);
        let stepLength:number = this.frameIndex * this.frameSpeed;
        let point = TurfUtil.alongStraightLine(turfLine, stepLength);
        let moveTo = point.geometry.coordinates
            .map((value: number) => parseFloat(value.toFixed(6)));
        ;
        this.point.setGeometry(new Point(moveTo));
        this.point.set("direction",TurfUtil.getPointDirection(turfLine,stepLength));
        this.key = requestAnimationFrame(this.animation.bind(this))
    }

    /**
     * 取消动画
     */
    stopAnimation() {
        if (this.key) {
            cancelAnimationFrame(this.key);
        }
    }

    protected disposeInternal(): void {
        cancelAnimationFrame(this.key);
    }
}

export interface Options {
    /**
     * 单位：千米/s
     */
    speed?: number;
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

