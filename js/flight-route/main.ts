import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import {Vector, XYZ} from "ol/source";

import FlightRouteLayer from './flightRouteLayer'

main().catch(e=>console.error(e));

async function main(){
    let lineCoordinates = await getData();
    let flightRouteLayer = new FlightRouteLayer({
        source:new Vector()
    });
    flightRouteLayer.startAnimation(lineCoordinates);


    let view = new View({
        zoom: 7,
        projection:'EPSG:4326',
        center: [120.08031547156963, 36.36778762724163]
    });

    let map = new Map({
        target: 'map',
        maxTilesLoading:96,
        loadTilesWhileAnimating:true,
        loadTilesWhileInteracting:true,
        layers: [
            new TileLayer({
                source: new XYZ({
                    url: 'http://www.google.cn/maps/vt?pb=!1m5!1m4!1i{z}!2i{x}!3i{y}!4i256!2m3!1e0!2sm!3i342009817!3m9!2szh-CN!3sCN!5e18!12m1!1e47!12m3!1e37!2m1!1ssmartmaps!4e0&token=32965'
                })
            })
        ],
        view: view
    });

    map.addLayer(flightRouteLayer);
}

async function getData(){
    let res = await fetch('/data/route.json',{
        method:"get"
    });
    return res.json();
}
