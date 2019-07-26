import "ol/ol.css"

import CanvasMap from "ol/Map"
import View from "ol/View";
import {Vector as VectorSource, XYZ as XYZSource} from "ol/source";
import {Tile as TileLayer, Vector as VectorLayer} from "ol/layer";
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";
import Point from "ol/geom/Point";
import Feature from "ol/Feature";
import HaloAnimationLayer from "./HaloAnimationLayer";

let map = new CanvasMap({
    target: 'map',
    view: new View({
        center: [120.09, 36.36],
        zoom: 15,
        projection: 'EPSG:4326',
    }),
    layers: [
        new TileLayer({
            source: new XYZSource({
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
    renderMode: 'image',
    source: source,
    transparent: true,
});
map.addLayer(vector);

let flightSource = new VectorSource({
    overlaps: false,
    wrapX: false
});
let flightVector = new VectorLayer({
    source: flightSource,
    renderMode: 'image',
    transparent: true,
    style: new Style({
        image: new Icon({
            src: "../images/flight.svg",
            scale: 0.1
        }),
    })
});
map.addLayer(flightVector);

function addRandomFeature(enableAnimation) {
    let x = (Math.random() / 100) + 120.08;
    let y = (Math.random() / 100) + 36.35;
    let geom = new Point([x, y]);
    let feature = new Feature({
        geometry: geom,
        animation: enableAnimation
    });
    source.addFeature(feature);
}

for (let i = 0; i < 500; i++) {
    addRandomFeature(true);
}


