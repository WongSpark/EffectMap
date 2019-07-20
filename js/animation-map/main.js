import AnimationLayer from "@/js/animation-map/animationLayer";

let map = new ol.CanvasMap({
    target: 'map',
    view: new ol.View({
        center: [120.09, 36.36],
        zoom: 15,
        projection: 'EPSG:4326',
    }),
    layers: [
        new ol.layer.Tile({
            source: new ol.source.XYZ({
                url: 'http://www.google.cn/maps/vt?pb=!1m5!1m4!1i{z}!2i{x}!3i{y}!4i256!2m3!1e0!2sm!3i342009817!3m9!2szh-CN!3sCN!5e18!12m1!1e47!12m3!1e37!2m1!1ssmartmaps!4e0&token=32965'
            })
        })
    ]
});

let source = new ol.source.Vector({
    overlaps:false,
    wrapX: false
});
let vector = new AnimationLayer({
    renderMode:'image',
    source: source,
    transparent:true,
});
map.addLayer(vector);

let flightSource = new ol.source.Vector({
    overlaps:false,
    wrapX: false
});
let flightVector = new ol.layer.Vector({
    source: flightSource,
    renderMode:'image',
    transparent:true,
    style:new ol.style.Style({
        image: new ol.style.Icon({
            src: "../images/flight.svg",
            scale:0.1
        }),
    })
});
map.addLayer(flightVector);

function addRandomFeature(enableAnimation) {
    let x = (Math.random()/100) + 120.08;
    let y = (Math.random()/100) + 36.35;
    let geom = new ol.geom.Point([x, y]);
    let feature = new ol.Feature({
        geometry: geom,
        animation:enableAnimation
    });
    source.addFeature(feature);
}

function addRandomFeatureWithFlight(enableAnimation, style) {
    let x = (Math.random()/100) + 120.08;
    let y = (Math.random()/100) + 36.35;
    let geom = new ol.geom.Point([x, y]);
    let feature = new ol.Feature({
        geometry: geom,
        animation:enableAnimation
    });
    // feature.setStyle(style);
    flightSource.addFeature(feature);
}

for (let i = 0; i < 500; i++) {
    addRandomFeature(true);
}
let flightStyle = new ol.style.Style({
    image: new ol.style.Icon({
        src: "../images/flight.svg",
        scale: 0.1
    }),
});
for (let i = 0; i < 100; i++) {
    addRandomFeatureWithFlight(false,flightStyle);
}

//根据分辨率设置飞机图片的大小
map.getView().on("change:resolution", (e) => {
    let resolution = map.getView().getResolution();
    let scaleRadio = 30 / (resolution * ol.proj.METERS_PER_UNIT.degrees) / 200;

    let style = new ol.style.Style({
        image: new ol.style.Icon({
            src: "../images/flight.svg",
            scale: scaleRadio
        }),
    });
    flightSource.getFeatures().forEach(feature => {
        feature.setStyle(style);
    })
});

// setTimeout(()=>{
//     vector.disableAnimation();
//     // vector.getSource().clear();
//     // map.removeLayer(vector);
// },1000*5);
//
// setTimeout(()=>{
//     vector.enableAnimation();
// },1000*10);
