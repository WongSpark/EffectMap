import "ol/ol.css"
import WindLayer from "./windLayer"
import {Map} from 'ol';
import Tile from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import View from "ol/View";
import * as dat from 'dat.gui';

let map = new Map({
    target: 'map',
    layers: [
        new Tile({
            layerName: 'baseLayer',
            preload: 4,
            source: new OSM({
                url: "http://{a-c}.sm.mapstack.stamen.com/(toner-lite,$fff[difference],$fff[@23],$fff[hsl-saturation@20])/{z}/{x}/{y}.png"
            })
        })
    ],
    view: new View({
        projection: 'EPSG:4326',
        center: [113.53450137499999, 34.44104525],
        zoom: 5
    })
});

fetch('data/sample.json', {
    method: "get"
}).then((response) => {
    return response.json();
}).then(function (data) {
    if (data) {
        let config = {
            minVelocity: 0, // 粒子强度最小的速度 (m/s)
            maxVelocity: 10, // 粒子强度最OlWindy大的速度 (m/s)
            velocityScale: 0.05, // 风速的比例
            particleAge: 60, // 重绘之前生成的离子数量的最大帧数
            lineWidth: 1, // 绘制粒子的线宽
            particleMultiplier: 0.01, // 离子数量
        };
        let wind = new WindLayer(data, config);
        wind.appendTo(map);

        const gui = new dat.GUI();
        gui.add(config, 'minVelocity', 0, 10).onChange(function (value) {
            wind.updateParams(config);
        });
        gui.add(config, 'maxVelocity', 1, 15).onChange(function (value) {
            wind.updateParams(config);
        });
        gui.add(config, 'velocityScale', 0.05, 0.1).step(0.01).onChange(function (value) {
            wind.updateParams(config);
        });
        gui.add(config, 'particleAge', 0, 180).onChange(function (value) {
            wind.updateParams(config);
        });
        gui.add(config, 'lineWidth', 1, 10).onChange(function (value) {
            wind.updateParams(config);
        });
        gui.add(config, 'particleMultiplier', 0.01, 0.05).step(0.01).onFinishChange(function (value) {
            wind.updateParams(config);
        });
    }
});
