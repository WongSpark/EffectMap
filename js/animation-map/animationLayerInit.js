let map = new ol.CanvasMap({
    // layers: [
    //     new ol.layer.Tile({
    //         source: new ol.source.OSM({
    //             wrapX: false
    //         })
    //     })
    // ],
    controls: ol.control.defaults({
        attributionOptions: {
            collapsible: false
        }
    }),
    target: 'map',
    view: new ol.View({
        center: [120.09, 36.36],
        zoom: 15,
        projection: 'EPSG:4326',
    })
});

map.getView().on("change:resolution",(e)=>{
    let resolution = map.getView().getResolution();
    let scaleRadio = 30/(resolution*ol.proj.METERS_PER_UNIT.degrees)/200;

    let style = new ol.style.Style({
        image: new ol.style.Icon({
            src: "../images/flight.svg",
            scale: scaleRadio
        }),
    });
    flightSource.getFeatures().forEach(feature=>{
        feature.setStyle(style);
    })
});

const extent = [120.05, 36.32, 120.13, 36.4];
let imageLayer = new ol.layer.Image({
    source: new ol.source.ImageStatic({
        url: 'images/airport_map.png',
        imageExtent: extent,
        // imageSize: this.getImageSize(extend),
    })
});
map.addLayer(imageLayer);

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

function addRandomFeatureWithFlight(enableAnimation,style) {
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

for(let i = 0;i<300;i++){
    addRandomFeature(true);
    // if(i%2===0){
    //     addRandomFeature(true);
    // }else{
    //     addRandomFeature(false);
    // }
}
let flightStyle = new ol.style.Style({
    image: new ol.style.Icon({
        src: "../images/flight.svg",
        scale: 0.1
    }),
})
for(let i = 0;i<500;i++){
    addRandomFeatureWithFlight(false,flightStyle);
}

// setTimeout(()=>{
//     vector.disableAnimation();
//     // vector.getSource().clear();
//     // map.removeLayer(vector);
// },1000*5);
//
// setTimeout(()=>{
//     vector.enableAnimation();
// },1000*10);
