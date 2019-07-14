import BigNumber from 'bignumber.js';

class MotionTrackLayer extends ol.layer.Vector{
    constructor(opt){
        super(opt);
        this.infinitePlay = opt.infinitePlay === undefined ? true : opt.infinitePlay;
        this.animationKey = null;
        this.animationFrame = null;

        this.allCompleted = {};
        this.stepIndexMap = {};
        this.pathSegmentMap = {};
        this.frameCoordinatesMap = {};
        this.locationMarkerMap = {};

        this.sourceChangeKey = ol.events.listen(
            this.getSource(), "addfeature", this._composeNavigation, this);

        this._composeNavigation(null,true);
    }

    startNavigation(){
        if(this.animationFrame){
            for(let key of Object.keys(this.stepIndexMap)){
                this.stepIndexMap[key] = 0;
                this.allCompleted[key] = false;
            }
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

    _composeNavigation(event,isInit){
        if(!isInit && !event) return;
        if(!isInit && event.feature.get("ignoreEvent")) return;

        let routeSource = this.getSource();
        if(!routeSource) return;

        let routeFeatures = routeSource.getFeatures();
        if(!routeFeatures || routeFeatures.length === 0) return;

        routeFeatures
            .filter(feature=>{
                return feature.getGeometry().getType() === "LineString";
            })
            .forEach(feature=>{
                let id = feature.ol_uid;
                this.stepIndexMap[id] = 0;
                this.allCompleted[id] = false;
                this._drawStartEnd(feature, routeSource);
                this._computeSegmentAngle(feature);
                this._computeFrameCoordinates(feature);

                let locationMarker = new ol.Feature({
                    name:"movingMarker",
                    ignoreEvent:true,
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
                this.locationMarkerMap[id] = locationMarker;
            });

        this.setStyle(this._setLineStyle.bind(this));


        this.animationFrame = ()=> {
            for(let key of Object.keys(this.stepIndexMap)){
                let frameCoordinates = this.frameCoordinatesMap[key];
                let pathSegment = this.pathSegmentMap[key];
                let locationMarker = this.locationMarkerMap[key];

                this.stepIndexMap[key]++;
                if (this.stepIndexMap[key] >= frameCoordinates.length) {
                    if(this.infinitePlay){
                        this.stepIndexMap[key] = 0;
                    }else{
                        this.allCompleted[key] = true;
                        if(this._checkIfAllCompleted()){
                            this.stopNavigation();
                            return;
                        }
                        continue;
                    }
                }

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
                    frameCoordinateCollection.push(frameCoor);
                }
                for (let j = 0; j < pathSegment.length; j++) {

                }


                let angle = 0;
                for (let j = 0; j < pathSegment.length; j++) {
                    if (MotionTrackLayer.lineContains(pathSegment[j].path, frameCoordinates[this.stepIndexMap[key]])) {
                        angle = pathSegment[j].angle;
                    }
                }
                locationMarker.set("angle", angle);
                locationMarker.setGeometry(new ol.geom.Point(frameCoordinates[this.stepIndexMap[key]]));
            }

            this.animationKey = requestAnimationFrame(this.animationFrame);
        };
    }

    _checkIfAllCompleted(){
        for(let key of Object.keys(this.allCompleted)){
            if(!this.allCompleted[key]){
                return false;
            }
        }
        return true;
    }

    /**
     * 计算动画帧位置
     * @param routeFeatures
     * @private
     */
    _computeFrameCoordinates(routeFeature) {
        let id = routeFeature.ol_uid;
        let frameCoordinateCollection = [];
        routeFeature.getGeometry().forEachSegment((start, end) => {
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
                frameCoordinateCollection.push(frameCoor);
            }
        });
        this.frameCoordinatesMap[id] = frameCoordinateCollection;
    }

    _computeSegmentAngle(routeFeature) {
        let id = routeFeature.ol_uid;
        let routeCoordinates = routeFeature.getGeometry().getCoordinates();
        let pathSegmentCollection = [];
        for (let i = 0; i < routeCoordinates.length - 1; i++) {
            let segment = new ol.geom.LineString([routeCoordinates[i], routeCoordinates[i + 1]]);
            let angle = MotionTrackLayer.computeXAngle(routeCoordinates[i], routeCoordinates[i + 1]);
            pathSegmentCollection.push({
                path: segment,
                angle: angle
            });
        }
        this.pathSegmentMap[id] = pathSegmentCollection;
    }

    _setLineStyle(feature, res) {
        if(feature.getGeometry().getType() !== "LineString") return;

        let id = feature.ol_uid;
        let pathSegment = this.pathSegmentMap[id];
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
            for (let j = 0; j < pathSegment.length; j++) {
                if (MotionTrackLayer.lineContains(pathSegment[j].path, arrowCoor)) {
                    angle = pathSegment[j].angle;
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
    }

    _drawStartEnd(routeFeature, routeSource) {
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
        let featureGeometry = routeFeature.getGeometry();
        let startMarker = new ol.Feature({
            name:"startMarker",
            ignoreEvent:true,
            geometry: new ol.geom.Point(featureGeometry.getFirstCoordinate()),
        });
        startMarker.setStyle(startMarkerStyle);
        let endMarker = new ol.Feature({
            name:"endMarker",
            ignoreEvent:true,
            geometry: new ol.geom.Point(featureGeometry.getLastCoordinate()),
        });
        endMarker.setStyle(endMarkerStyle);
        routeSource.addFeatures([startMarker, endMarker]);
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
export default MotionTrackLayer;
