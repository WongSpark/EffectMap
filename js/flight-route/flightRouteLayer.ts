import VectorLayer, {Options} from 'ol/layer/Vector';
import LineString from "ol/geom/LineString";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";

// @ts-ignore
import * as turf from '@turf/turf'

import TurfUtil from "../utils/turfUtil";
import Style from "ol/style/Style";
import {Icon} from "ol/style";

class FlightRouteLayer extends VectorLayer{
    positions:number[][];
    point:Feature;
    key:number;
    speed:number = 2.190;
    frameCount:number = 0;
    frameSpeed:number = this.speed/60;
    frameIndex:number = 1;

    constructor(opt_options?: Options){
        super(opt_options);
    }

    startAnimation(lineCoordinates:number[][]){
        this.positions = lineCoordinates;
        let olLine = new Feature(new LineString(this.positions));
        this.getSource().addFeature(olLine);
        this.point = new Feature(new Point(this.positions[0]));
        this.point.setStyle((feature,res)=> {
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
        let point = turf.along(turfLine,stepLength);
        // let point = TurfUtil.alongStraightLine(turfLine,stepLength);
        let moveTo = point.geometry.coordinates.map((value:number) => parseFloat(value.toFixed(6)));;
        this.point.setGeometry(new Point(moveTo));
        this.point.set("direction",TurfUtil.getPointDirection(turfLine,stepLength));
        requestAnimationFrame(this.animation.bind(this))
    }
}

export default FlightRouteLayer;
