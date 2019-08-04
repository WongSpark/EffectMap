import BubbleTextLayer from "./BubbleTextLayer";
import VectorSource from "ol/source/Vector";
import {XYZ} from "ol/source";
import {Tile} from "ol/layer";
import {Feature, Map, View} from "ol";
import {Point} from "ol/geom";

import "ol/ol.css";

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
let vector = new BubbleTextLayer({
    renderMode: 'image',
    source: source,
});
map.addLayer(vector);

function addRandomFeature() {
    let x = (Math.random() / 100) + 120.08;
    let y = (Math.random() / 100) + 36.35;
    let geom = new Point([x, y]);
    let feature = new Feature({
        geometry: geom,
        enableTextBackground: true,
        textWithColor: `我要测试$#fb0505;我就是我$#ffffff;`,
    });
    source.addFeature(feature);
}

for (let i = 0; i < 200; i++) {
    addRandomFeature();
}
