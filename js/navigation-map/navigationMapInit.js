import MapInit from '../utils/MapLayerInit'
import NavigationMap from './navigationMap'
import NavigationLayer from './NavigationLayer'

import '@/css/navigationMap.scss'
import {UrlUtil} from "@/js/utils/utils";


let lon = UrlUtil.getQueryVariable("lon");
let lat = UrlUtil.getQueryVariable("lat");
let destinationPosition = [lon,lat];
let userPosition = [120.0856,36.36];

const mapInit = new MapInit();
mapInit.initMap();
mapInit.showLocation(userPosition);
mapInit.registerBtnListener();

let routeArr = [userPosition,destinationPosition];
routeArr = [
    userPosition, [120.0861,36.3607], [120.0865,36.3619], [120.0866,36.3622],
    [120.0875,36.3624],[120.0882,36.3627],[120.0897,36.3638],[120.0898,36.3637],
    [120.0886,36.3627],[120.0891,36.3622],[120.0900,36.3617],[120.0905,36.3616]
];

let map = mapInit.getMap();
let routePath = new ol.Feature({
    geometry: new ol.geom.LineString(routeArr)
});
window.routeLayer = new NavigationLayer({
    name: "routePathLayer",
    infinitePlay:false,
    source: new ol.source.Vector({
        features: [routePath]
    })
});
map.addLayer(routeLayer);
routeLayer.startNavigation();

const navigationMap = new NavigationMap(mapInit.getMap());
navigationMap.registerEvent();
navigationMap.registerMapEvent();
// navigationMap.triggerNavigation();
