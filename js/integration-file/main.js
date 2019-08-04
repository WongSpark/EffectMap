import "ol/ol.css"

import Map from "ol/Map";
import {Vector as VectorSource, XYZ} from "ol/source";
import {Tile} from "ol/layer";
import View from "ol/View";
import Point from "ol/geom/Point";
import {AnimationFeature, HaloAnimationLayer} from "@/js/integration-file/AnimationLayer";

haloCircleExample();

function haloCircleExample() {
    let map = new Map({
        target: 'map',
        view: new View({
            center: [120.09, 36.36],
            zoom: 15,
            projection: 'EPSG:4326',
        }),
        layers: [
            new Tile({
                source: new XYZ({
                    url: 'http://www.google.cn/maps/vt?pb=!1m5!1m4!1i{z}!2i{x}!3i{y}!4i256!2m3!1e0!2sm!3i342009817!3m9!2szh-CN!3sCN!5e18!12m1!1e47!12m3!1e37!2m1!1ssmartmaps!4e0&token=32965'
                })
            })
        ]
    });

    let source = new VectorSource({
        overlaps: false,
        wrapX: false
    });
    let vector = new HaloAnimationLayer({
        color: 'rgba(131, 45, 72,1)',
        lineWidth: 2,
        maxRadius: 40,
        minRadius: 15,
        radiusIncrement: 0.5,
        renderMode: 'image',
        source: source,
        transparent: true,
    });
    map.addLayer(vector);

    function addRandomFeature(enableAnimation, index) {
        let x = (Math.random() / 100) + 120.08;
        let y = (Math.random() / 100) + 36.35;
        let geom = new Point([x, y]);
        let feature = null;
        if (index > 0) {
            feature = new AnimationFeature({
                geometry: geom,
                animation: true,
                enableTextBackground: true,
                textWithColor: `我要测试${index}$#fb0505;我就是我$#ffffff;`,
                progress: Math.random(),
            });
        } else {
            feature = new AnimationFeature({
                geometry: geom,
                animation: false,
                enableTextBackground: true,
                textWithColor: `我要测试${index}$#fb0505;我就是我$#ffffff;`,
                progress: Math.random(),
            });
        }

        source.addFeature(feature);
    }

    for (let i = 0; i < 200; i++) {
        addRandomFeature(true, i);
    }
}

