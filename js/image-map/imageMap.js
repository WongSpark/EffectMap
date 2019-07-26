import Style from "ol/style/Style";
import Icon from "ol/style/Icon";
import {ImageStatic, Vector as VectorSource} from "ol/source";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import View from "ol/View";
import CanvasMap from "ol/Map";
import {Image, Vector as VectorLayer} from "ol/layer";
import {defaults} from "ol/control"
import {METERS_PER_UNIT} from "ol/proj/Units"

class Test{
    constructor(){
        this.extend = [120.05, 36.32, 120.13, 36.4];
    }

    // 初始化地图
    initMap() {
        // 车辆 飞行器 人员 图层
        this.layer = new VectorLayer({
            source: new VectorSource(),
            zIndex: 2,
        });
        this.map = new CanvasMap({
            target: 'map',
            controls: defaults({
                attribution: false,
                rotation: false,
            }),
            view: new View({
                center: [120.09, 36.36],
                zoom: 15,
                projection: 'EPSG:4326',
                // rotation: -(73 / 180) * Math.PI,
            }),
            layers: [this.layer,
                new Image({
                    source: new ImageStatic({
                        url: 'images/airport_map.png',
                        // url: 'images/map.svg',
                        imageExtent: this.extend,
                        // imageSize: this.getImageSize(extend),
                    }),
                    zIndex: 1,
                })
            ],
        });

        let geom = new Point([120.08, 36.36]);
        let feature = new Feature(geom);
        this.layer.getSource().addFeature(feature);

        let flightStyle = new Style({
            image: new Icon({
                src: "../images/flight.svg",
                scale: 0.1
            }),
        });
        for (let i = 0; i < 100; i++) {
            addRandomFeatureWithFlight(false, flightStyle);
        }


        function addRandomFeatureWithFlight(enableAnimation, style) {
            let x = (Math.random() / 100) + 120.08;
            let y = (Math.random() / 100) + 36.35;
            let geom = new Point([x, y]);
            let feature = new Feature({
                geometry: geom,
                animation: enableAnimation
            });
            // feature.setStyle(style);
            this.layer.getSource().addFeature(feature);
        }

        // 根据分辨率设置飞机图片的大小
        map.getView().on("change:resolution", (e) => {
            let resolution = map.getView().getResolution();
            let scaleRadio = 30 / (resolution * METERS_PER_UNIT.degrees) / 200;

            let style = new Style({
                image: new Icon({
                    src: "../images/flight.svg",
                    scale: scaleRadio
                }),
            });
            this.layer.getSource().getFeatures().forEach(feature => {
                feature.setStyle(style);
            })
        });
    }
}

let test = new Test();
test.initMap();
