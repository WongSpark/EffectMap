import BigNumber from 'bignumber.js';

class NavigationLayer extends ol.layer.Vector{
    constructor(opt){
        super(opt);
        this.infinitePlay = opt.infinitePlay;
        this.animationKey = null;
        this.animationFrame = null;
        this.stepIndex = 0;
        this.pathSegment = [];
        this.frameCoordinates = [];

        this._composeNavigation();
    }

    startNavigation(){
        if(this.animationFrame){
            this.stepIndex = 0;
            this.animationFrame();
        }
    }

    stopNavigation(){
        if(this.animationKey){
            cancelAnimationFrame(this.animationKey);
            this.animationKey = null;
        }
    }

    setInfinitePlay(infinitePlay){
        this.infinitePlay = infinitePlay;
    }

    getInfinitePlay(){
        return this.infinitePlay;
    }

    _composeNavigation(){
        let routeSource = this.getSource();
        if(!routeSource) return;

        let routeFeatures = routeSource.getFeatures();
        if(!routeFeatures) return;

        this.drawStartEnd(routeFeatures, routeSource);

        this.setLineStyle();

        this._computeSegmentAngle(routeFeatures);

        this._computeFrameCoordinates(routeFeatures);

        let locationMarker = new ol.Feature({
            name:"movingMarker",
            geometry: new ol.geom.Point([0,0]),
        });
        locationMarker.setStyle((feature,res)=> {
            return new ol.style.Style({
                image: new ol.style.Icon({
                    src: 'images/moving.png',
                    rotateWithView: true,
                    rotation: Math.PI / 2 - feature.get("angle")
                })
            });
        });
        routeSource.addFeatures([locationMarker]);
        this.animationFrame = ()=> {
            this.stepIndex++;
            if (this.stepIndex >= this.frameCoordinates.length-1) {
                if(this.infinitePlay){
                    this.stepIndex = 0;
                }else{
                    this.stopNavigation();
                    return;
                }
            }


            let angle = NavigationLayer.computeXAngle(this.frameCoordinates[this.stepIndex], this.frameCoordinates[this.stepIndex+1]);
            locationMarker.set("angle", angle);
            locationMarker.setGeometry(new ol.geom.Point(this.frameCoordinates[this.stepIndex]));
            this.animationKey = requestAnimationFrame(this.animationFrame);
        };
    }

    /**
     * 计算动画帧位置
     * @param routeFeatures
     * @private
     */
    _computeFrameCoordinates(routeFeatures) {
        routeFeatures[0].getGeometry().forEachSegment((start, end) => {
            const step = 3;
            let pathInDegree = new ol.geom.LineString([start, end]);
            let pathInMeter = new ol.geom.LineString([
                ol.proj.fromLonLat(start),
                ol.proj.fromLonLat(end)
            ]);
            let length = ol.Sphere.getLength(pathInMeter);
            let frameCount = Math.ceil(length / step);
            let factor = step / length;
            for (let j = 0; j < frameCount; j++) {
                let frameCoor = pathInDegree.getCoordinateAt(j * factor);

                //处理js精度不够造成的计算数据不准确问题
                frameCoor[0] = parseFloat(frameCoor[0].toFixed(8));
                frameCoor[1] = parseFloat(frameCoor[1].toFixed(8));
                this.frameCoordinates.push(frameCoor);
            }
        });
    }

    _computeSegmentAngle(routeFeatures) {
        let routeCoordinates = routeFeatures[0].getGeometry().getCoordinates();
        for (let i = 0; i < routeCoordinates.length - 1; i++) {
            let segment = new ol.geom.LineString([routeCoordinates[i], routeCoordinates[i + 1]]);
            let angle = NavigationLayer.computeXAngle(routeCoordinates[i], routeCoordinates[i + 1]);
            this.pathSegment.push({
                path: segment,
                angle: angle
            })
        }
    }

    setLineStyle() {
        this.setStyle((feature, res) => {
            if(!(feature.getGeometry().getType() === "LineString")) return;

            let styles = [
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        width: 12,
                        color: '#2E8B57',
                    })
                })
            ];
            let pathLine = feature.getGeometry();
            let length = pathLine.getLength();
            let signDistancePixel = 40;
            let signDistanceMeter = signDistancePixel * res;
            let signCount = Math.ceil(length / signDistanceMeter);

            for (let i = 1; i < signCount; i++) {
                let arrowCoor = pathLine.getCoordinateAt(i / signCount);

                let angle = 0;
                for (let j = 0; j < this.pathSegment.length; j++) {
                    if (NavigationLayer.lineContains(this.pathSegment[j].path, arrowCoor)) {
                        angle = this.pathSegment[j].angle;
                    }
                }
                styles.push(new ol.style.Style({
                    geometry: new ol.geom.Point(arrowCoor),
                    image: new ol.style.Icon({
                        src: 'images/arrow.png',
                        rotateWithView: true,
                        rotation: -angle
                    })
                }));
            }
            return styles;
        });
    }

    drawStartEnd(routeFeatures, routeSource) {
        let startMarkerStyle = new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.4, 0.7],
                scale: 1,
                src: 'images/start.png'
            })
        });
        let endMarkerStyle = new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.4, 0.7],
                scale: 1,
                src: 'images/end.png'
            })
        });
        routeFeatures.forEach(feature => {
            let featureGeometry = feature.getGeometry();
            let startMarker = new ol.Feature({
                name:"startMarker",
                geometry: new ol.geom.Point(featureGeometry.getFirstCoordinate()),
            });
            startMarker.setStyle(startMarkerStyle);
            let endMarker = new ol.Feature({
                name:"endMarker",
                geometry: new ol.geom.Point(featureGeometry.getLastCoordinate()),
            });
            endMarker.setStyle(endMarkerStyle);
            routeSource.addFeatures([startMarker, endMarker]);
        });
    }

    /**
     * 返回p1,p2构成的直线与x轴夹角的弧度
     * @param p1
     * @param p2
     * @returns {number}
     */
    static computeXAngle(p1,p2){
        if(p1[0]-p2[0] === 0) return Math.PI/2;
        if(p1[1]-p2[1] === 0) return 0;

        let angle = Math.atan2((p2[1]-p1[1]),(p2[0]-p1[0])) //弧度
        if((p2[1]-p1[1])<0) angle+=(Math.PI*2);
        //let theta = angle*(180/Math.PI); //角度

        return angle;
    }

    /**
     * 判断点是否再线上。先通过line的extent判断point是否在bound内，
     * 若在，则通过斜率判断点是否在线上。由于js浮点数计算的不确定性，引入BigNumber。
     * ps：貌似bigNumber也不靠谱，还是需要做toFix运算。
     * @param line
     * @param point
     */
    static lineContains(line, point) {
        let extent = line.getExtent();
        let linePoints = line.getCoordinates();
        let first = linePoints[0];
        let last = linePoints[1];
        if (extent[0] <= point[0] && point[0] <= extent[2]
            && extent[1] <= point[1] && point[1] <= extent[3]) {
            //进一步判断是否确实在线上
            if(point[0] === first[0] && point[1]===first[1]){
                return true;
            }
            if(point[0] === last[0] && point[1]===last[1]){
                return true;
            }

            let a = {
                x:new BigNumber(first[0]),
                y:new BigNumber(first[1])
            };
            let b = {
                x:new BigNumber(last[0]),
                y:new BigNumber(last[1])
            };
            let c = {
                x:new BigNumber(point[0]),
                y:new BigNumber(point[1])
            };
            let k1 = b.y.minus(a.y).dividedBy(b.x.minus(a.x)).toFixed(2);
            let k2 = c.y.minus(a.y).dividedBy(c.x.minus(a.x)).toFixed(2);
            return k2 === k1;
        }
        return false;
    }
}
export default NavigationLayer;
