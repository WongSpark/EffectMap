import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import {Vector, XYZ} from "ol/source";

import "ol/ol.css"
import ProgressCircleLayer from "./ProgressCircleLayer";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";

main();

function main() {
    let progressCircleLayer = new ProgressCircleLayer({
        renderMode: 'image',
        source: new Vector(),
        // outCircleColor: "red"
    });

    for (let i = 0; i < 2000; i++) {
        addRandomFeature(progressCircleLayer.getSource(), i);
    }

    let view = new View({
        zoom: 14,
        projection: 'EPSG:4326',
        center: [120.08031547156963, 36.36778762724163]
    });

    let map = new Map({
        target: 'map',
        // maxTilesLoading:96,
        // loadTilesWhileAnimating:true,
        // loadTilesWhileInteracting:true,
        layers: [
            new TileLayer({
                source: new XYZ({
                    url: 'http://www.google.cn/maps/vt?pb=!1m5!1m4!1i{z}!2i{x}!3i{y}!4i256!2m3!1e0!2sm!3i342009817!3m9!2szh-CN!3sCN!5e18!12m1!1e47!12m3!1e37!2m1!1ssmartmaps!4e0&token=32965'
                })
            })
        ],
        view: view
    });

    map.addLayer(progressCircleLayer);

    setTimeout(() => {
        //progressCircleLayer.getSource().removeFeature(progressCircleLayer.getSource().getFeatures()[0]);
        // progressCircleLayer.getSource().getFeatures()[0].set("progress", 100);
    }, 3000)
}


function addRandomFeature(source: Vector, index: number) {
    let x = (Math.random() / 100) + 120.08;
    let y = (Math.random() / 100) + 36.35;
    let geom = new Point([x, y]);
    let feature = new Feature({
        geometry: geom,
        progress: Math.random(),
    });
    source.addFeature(feature);
}
