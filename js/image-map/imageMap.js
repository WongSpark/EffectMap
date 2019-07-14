class Test{
    constructor(){
        this.extend = [120.05, 36.32, 120.13, 36.4];

    }

    // 初始化地图
    initMap() {
        // 车辆 飞行器 人员 图层
        this.layer = new ol.layer.Vector({
            source: new ol.source.Vector(),
            zIndex: 2,
        });
        this.map = new ol.Map({
            target: 'map',
            controls: ol.control.defaults({
                attribution: false,
                rotation: false,
            }),
            view: new ol.View({
                center: [120.09, 36.36],
                zoom: 15,
                projection: 'EPSG:4326',
                // rotation: -(73 / 180) * Math.PI,
            }),
            layers: [this.layer,
                new ol.layer.Image({
                    source: new ol.source.ImageStatic({
                        // url: 'images/airport_map.png',
                        url: 'images/map.svg',
                        imageExtent: this.extend,
                        // imageSize: this.getImageSize(extend),
                    }),
                    zIndex: 1,
                })
            ],
        });

        let geom = new ol.geom.Point([120.08, 36.36]);
        let feature = new ol.Feature(geom);
        this.layer.getSource().addFeature(feature);
    }
}

let test = new Test();
test.initMap();
