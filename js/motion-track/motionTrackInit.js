import MapInit from '../utils/MapLayerInit'
import MotionTrackLayer from './motionTrackLayer'
import '@/css/mapCommon.scss'

let mapInit = new MapInit();
mapInit.initMap();

let routeArr = [
    [[120.0861,36.3607], [120.0865,36.3619]],
    [ [120.0866,36.3622], [120.0875,36.3624]],
    [[120.0882,36.3627],[120.0897,36.3638]],
    [[120.0898,36.3637], [120.0886,36.3627]],
    [[120.0891,36.3622],[120.0900,36.3617],[120.0905,36.3616]],
    [[120.0893,36.3626],[120.0908,36.3612],[120.0905,36.3619]],
    // [[120.0893,36.3626],[123.9908,34.3612]],
]

let map = mapInit.getMap();
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




