import MotionTrackLayer from './motionTrackLayer'
import '@/css/mapCommon.scss'
import View from "ol/View";
import Map from "ol/Map";
import TileLayer from "ol/layer/Tile";
import {XYZ} from "ol/source";


let routeArr = [
    [[120.0861,36.3607], [120.0865,36.3619]],
    [ [120.0866,36.3622], [120.0875,36.3624]],
    [[120.0882,36.3627],[120.0897,36.3638]],
    [[120.0898,36.3637], [120.0886,36.3627]],
    [[120.0891,36.3622],[120.0900,36.3617],[120.0905,36.3616]],
    [[120.0893,36.3626],[120.0908,36.3612],[120.0905,36.3619]],
    // [[120.0893,36.3626],[123.9908,34.3612]],
]

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
let source = new ol.source.Vector();
routeArr.forEach(routeData=>{
    let feature = new ol.Feature({
        geometry:new ol.geom.LineString(routeData)
    });

    source.addFeature(feature);
});
window.layer = new MotionTrackLayer({
    source:source,
    infinitePlay:false
});
map.addLayer(layer);




