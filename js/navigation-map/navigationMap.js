import $ from 'jquery'
import BigNumber from 'bignumber.js';
import {UrlConfig} from "@/js/utils/utils";

class NavigationMap {
    constructor(map) {
        this.map = map;
        this.isMapClickRegister = false;
        this.searchResults = null;
        this.serviceUrl = UrlConfig.navigationServerUrl;
        // this.serviceUrl = "";
    }

    registerMapEvent() {
        if (!this.isMapClickRegister) {
            this.map.on("click", function (e) {
                this.map.forEachFeatureAtPixel(e.pixel, (feature, layer) => {
                    console.log(feature);
                    let poi = feature.get("data");
                    if (poi) {
                        $("#poiAttributePanel").show();
                        $("#poiAttributeName").text(`${poi.shopName}(${poi.shopLocation})`);
                        $("#poiAttributeDesc").text(poi.goodsOnSale);
                    }
                });
            }, this);
            this.isMapClickRegister = true;
        }
    }

    registerEvent() {
        $("#searchEntry").on('click', () => {
            $("#searchLocation").fadeIn(200);
        });

        $("#searchReturn").on('click', () => {
            $("#searchLocation").fadeOut(200);
        });

        $("#poiAttributePanel").on('click', 'p', (e) => {
            window.open("target.html");
        });

        $("#searchInput").on('input', (event) => {
            let resultPanel = $("#resultPanel");
            let value = event.target.value;
            if (value && value.length > 0) {
                let locationListHtml = "";
                //调用后台查询接口，将返回的结果刷新到面板上
                let url = this.serviceUrl + `/shop/list-shops?shopName=${value}`;
                fetch(url, {
                    method: "get",
                    credentials: 'include'
                }).then(response => {
                    return response.json();
                }).then(shops => {
                    console.log(shops);
                    this.searchResults = shops;
                    if (shops && shops.length > 0) {
                        shops.forEach(shop => {
                            locationListHtml +=
                                `<li class="resultItem" data-id=${shop.id}>${shop.shopName}(${shop.shopLocation})</li>`;
                        });
                        resultPanel.empty().html(locationListHtml);
                        resultPanel.show();
                    } else {
                        return new Promise.reject("查询结果为空");
                    }
                }).catch(error => {
                    console.error(`查询商铺结果：${error}`);
                    locationListHtml += `<li class="resultItem">未查询到地点</li>`;
                    resultPanel.empty().html(locationListHtml);
                    resultPanel.show();
                });
            } else {
                resultPanel.hide();
            }
        });

        $("#defaultPanel").on('click', (e) => {
            let testArr = [
                {id: 2, shopName: "卫生间", shopLocation:"T1一层",shopCode: "test_code_1", longitude: 120.086, latitude: 36.3621},
                {id: 6, shopName: "电梯", shopLocation:"T1一层",shopCode: "T1002", longitude: 120.0869, latitude: 36.3623},
                {id: 7, shopName: "安检", shopLocation:"T1一层",shopCode: "T1001", longitude: 120.0868, latitude: 36.3624},
                {id: 10, shopName: "购物", shopLocation:"T1一层",shopCode: "T1009", longitude: 120.0866, latitude: 36.3626},
                {id: 11, shopName: "出入口", shopLocation:"T1一层",shopCode: "T1008", longitude: 120.0865, latitude: 36.3627},
                {id: 12, shopName: "卫生间", shopLocation:"T1二层",shopCode: "T1033", longitude: 120.0864, latitude: 36.3627}
            ];

            let poiCollection = [];
            testArr.forEach(poi=>{
                poiCollection.push(new ol.Feature({
                    name: `poi-${poi.shopName}`,
                    data: poi,
                    geometry: new ol.geom.Point([poi.longitude, poi.latitude])
                }));
            });

            let layer = this.getLayerByName("roomLayer");
            if (layer) {
                layer.setSource(new ol.source.Vector({
                    features: poiCollection
                }));
            } else {
                let vectorLayer = new ol.layer.Vector({
                    name: "roomLayer",
                    zIndex: 1,
                    source: new ol.source.Vector({
                        features: poiCollection
                    }),
                    style: new ol.style.Style({
                        image: new ol.style.Icon({
                            anchor: [0.4, 0.7],
                            scale: 1,
                            src: 'images/highLight.png'
                        })
                    })
                });
                this.map.addLayer(vectorLayer);
            };
            $("#searchLocation").hide();
        });

        $("#searchBtn").on('click', () => {
            $("#searchLocation").hide();
            let layer = this.getLayerByName("poiLayer");

            let poiCollections = [];
            this.searchResults.forEach(poi => {
                if (poi.longitude && poi.latitude) {
                    let poiMarker = new ol.Feature({
                        name: `poi-${poi.shopName}`,
                        data: poi,
                        geometry: new ol.geom.Point([poi.longitude, poi.latitude])
                    });
                    poiCollections.push(poiMarker);
                }
            });

            if (!layer) {
                let vectorLayer = new ol.layer.Vector({
                    name: "poiLayer",
                    zIndex: 1,
                    source: new ol.source.Vector({
                        features: poiCollections
                    }),
                    style: new ol.style.Style({
                        image: new ol.style.Icon({
                            anchor: [0.4, 0.7],
                            scale: 1,
                            src: 'images/highLight.png'
                        })
                    })
                });
                this.map.addLayer(vectorLayer);
            } else {
                layer.setSource(new ol.source.Vector({
                    features: poiCollections
                }));
            }
        });

        $("#goBtn").on('click', () => {
            const routeArr = [
                [120.0865, 36.362], [120.089, 36.3627], [120.0889, 36.3629], [120.090, 36.364]
            ];
            this.clearNavigation();

            this.routeNavigation(routeArr);
        });

        $("#resultPanel").on('click', (e) => {
            let dom = e.target;
            let id = dom.dataset.id;
            console.log(id);

            let poi = this.getPoiById(id);
            let poiMarker = new ol.Feature({
                name: `poi-${poi.shopName}`,
                data: poi,
                geometry: new ol.geom.Point([poi.longitude, poi.latitude])
            });

            let layer = this.getLayerByName("poiLayer");
            if (layer) {
                layer.setSource(new ol.source.Vector({
                    features: [poiMarker]
                }));
            } else {
                let vectorLayer = new ol.layer.Vector({
                    name: "poiLayer",
                    zIndex: 1,
                    source: new ol.source.Vector({
                        features: [poiMarker]
                    }),
                    style: new ol.style.Style({
                        image: new ol.style.Icon({
                            anchor: [0.4, 0.7],
                            scale: 1,
                            src: 'images/highLight.png'
                        })
                    })
                });
                this.map.addLayer(vectorLayer);
            }

            $("#searchLocation").hide();
        })
    }

    /**
     * 根据名称查询图层，返回null或者Layer
     * @param name
     * @returns {T}
     */
    getLayerByName(name) {
        let layers = this.map.getLayers().getArray();
        for (let layer of layers) {
            if (layer.get("name") === name) return layer;
        }
        return null;
    }

    /**
     * 根据id查询poi数组，返回null或者poi数据结构
     * @param id
     * @returns {*}
     */
    getPoiById(id) {
        for (let poi of this.searchResults) {
            if (poi.id == id) return poi;
        }
        return null;
    }

    initUserLocation(location) {
        let userLocation = location ? location : [120.086, 36.362];
        let userMarker = new ol.Feature({
            name: `userLocation`,
            geometry: new ol.geom.Point([userLocation[0], userLocation[1]])
        });
        let vectorLayer = new ol.layer.Vector({
            name: "userLocationLayer",
            zIndex: 1,
            source: new ol.source.Vector({
                features: [userMarker]
            }),
            style: new ol.style.Style({
                image: new ol.style.Icon({
                    anchor: [0, 0],
                    scale: 0.4,
                    src: 'images/cur_location.png'
                })
            })
        });
        this.map.addLayer(vectorLayer);
    }

    loadMap() {
        let routeNetLayer = new ol.layer.Tile({
            source: new ol.source.TileSuperMapRest({
                url: "http://192.168.163.145:8080/iserver/services/map-LuJingCeShi/rest",
                wrapX: false,
                transparent:true
            }),
            projection: 'EPSG:4326'
        });
        this.map.addLayer(routeNetLayer);
    }

    triggerNavigation(){
        const map = this.map;

        const serviceUrl = "http://192.168.163.145:8080/iserver/services/transportationAnalyst-LuJingCeShi2/rest/networkanalyst/BuildNetwork_adjust_adjust@Floor4";
        let resultSetting = new SuperMap.TransportationAnalystResultSetting({
            returnEdgeFeatures: true,
            returnEdgeGeometry: true,
            returnEdgeIDs: true,
            returnNodeFeatures: true,
            returnNodeGeometry: true,
            returnNodeIDs: true,
            returnPathGuides: true,
            returnRoutes: true
        });
        let analystParameter = new SuperMap.TransportationAnalystParameter({
            resultSetting: resultSetting,
            weightFieldName: "smLength"
        });
        let findPathParameter = new SuperMap.FindPathParameters({
            isAnalyzeById: false,
            nodes: [
                new ol.geom.Point([120.088, 36.363]),
                new ol.geom.Point([120.087, 36.363])
            ],
            hasLeastEdgeCount: false,
            parameter: analystParameter
        });

        new ol.supermap.NetworkAnalystService(serviceUrl).findPath(findPathParameter, function (serviceResult) {
            let guideLayerStyle = new ol.style.Style({
                image: new ol.style.Icon(({
                    src: 'images/point.png',
                    size: [20, 20]
                }))
            });
            let routeLayerStyle = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(100, 100, 225, 10)',
                    width: 3
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(0, 0, 255, 0.1)'
                })
            });

            serviceResult.result.pathList.map(function (result) {
                console.log(result);
                //添加分析出的路线
                let routeSource = new ol.source.Vector({
                    features: (new ol.format.GeoJSON()).readFeatures(result.route)
                });
                let pathLayer = new ol.layer.Vector({
                    source: routeSource,
                    style: routeLayerStyle
                });
                map.addLayer(pathLayer);
                //添加分析出的引导点
                let guideSource = new ol.source.Vector({
                    features: (new ol.format.GeoJSON()).readFeatures(result.route)
                });
                let guideLayer = new ol.layer.Vector({
                    zIndex: 99,
                    source: guideSource,
                    style: guideLayerStyle
                });
                map.addLayer(guideLayer);

                let startMarker = new ol.Feature({
                    name: 'startMarker',
                    geometry: new ol.geom.Point([120.088, 36.363])
                });
                let endMarker = new ol.Feature({
                    name: 'endMarker',
                    geometry: new ol.geom.Point([120.087, 36.363])
                });
                let styles = {
                    'startMarker': new ol.style.Style({
                        image: new ol.style.Icon({
                            anchor: [0.4, 0.7],
                            scale: 1,
                            src: 'images/start.png'
                        })
                    }),
                    'endMarker': new ol.style.Style({
                        image: new ol.style.Icon({
                            anchor: [0.4, 0.7],
                            scale: 1,
                            src: 'images/end.png'
                        })
                    })
                };
                let vectorLayer = new ol.layer.Vector({
                    name: "demoLayer",
                    zIndex: 1,
                    source: new ol.source.Vector({
                        features: [startMarker, endMarker]
                    }),
                    style: function (feature) {
                        return styles[feature.get('name')];
                    }
                });
                map.addLayer(vectorLayer);
            });
        });
    }

    triggerNavigation1() {
        const map = this.map;
        const serviceUrl = "http://192.168.163.145:8080/iserver/services/transportationAnalyst-LuJingCeShi/rest/networkanalyst/BuildNetwork_adjust@Floor4";
        let resultSetting = new SuperMap.TransportationAnalystResultSetting({
            returnEdgeFeatures: true,
            returnEdgeGeometry: true,
            returnEdgeIDs: true,
            returnNodeFeatures: true,
            returnNodeGeometry: true,
            returnNodeIDs: true,
            returnPathGuides: true,
            returnRoutes: true
        });
        let analystParameter = new SuperMap.TransportationAnalystParameter({
            resultSetting: resultSetting,
            weightFieldName: "smLength"
        });
        let findPathParameter = new SuperMap.FindPathParameters({
            isAnalyzeById: false,
            //nodes: [new ol.geom.Point([4000, -3000]), new ol.geom.Point([5500, -2500]), new ol.geom.Point([6900, -4000])],
            nodes: [
                new ol.geom.Point(ol.proj.fromLonLat([120.088, 36.363], 'EPSG:32651')),
                new ol.geom.Point(ol.proj.fromLonLat([120.089, 36.3633], 'EPSG:32651'))
            ],
            hasLeastEdgeCount: false,
            parameter: analystParameter
        });

        //进行查找
        new ol.supermap.NetworkAnalystService(serviceUrl).findPath(findPathParameter, function (serviceResult) {
            let guideLayerStyle = new ol.style.Style({
                image: new ol.style.Icon(({
                    src: 'images/point.png',
                    size: [20, 20]
                }))
            });
            let routeLayerStyle = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'rgba(100, 100, 225, 10)',
                    width: 3
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(0, 0, 255, 0.1)'
                })
            });

            serviceResult.result.pathList.map(function (result) {
                console.log(result);
                let pathCoors = result.route.geometry.coordinates[0];
                for (let coor of pathCoors) {
                    let sourceCoor = [coor[0], coor[1]];
                    let destCoor = ol.proj.toLonLat(sourceCoor, 'EPSG:32651')
                    coor[0] = destCoor[0];
                    coor[1] = destCoor[1];
                }
                console.log(pathCoors);

                //添加分析出的路线
                let routeSource = new ol.source.Vector({
                    features: (new ol.format.GeoJSON()).readFeatures(result.route)
                });
                let pathLayer = new ol.layer.Vector({
                    source: routeSource,
                    style: routeLayerStyle
                });
                map.addLayer(pathLayer);
                //添加分析出的引导点
                let guideSource = new ol.source.Vector({
                    features: (new ol.format.GeoJSON()).readFeatures(result.route)
                });
                let guideLayer = new ol.layer.Vector({
                    zIndex: 99,
                    source: guideSource,
                    style: guideLayerStyle
                });
                map.addLayer(guideLayer);
            });
        });
    }

    clearNavigation() {
        let layer = this.getLayerByName("routeSymbolLayer");
        if (layer) this.map.removeLayer(layer);
        layer = this.getLayerByName("routePathLayer");
        if (layer) this.map.removeLayer(layer);
        layer = this.getLayerByName("routeAnimationLayer");
        if (layer) this.map.removeLayer(layer);
    }

    /**
     * 绘制导航路线及动画
     * @param routeArr - Array.<Array>
     */
    routeNavigation(routeArr) {
        const map = this.map;
        if (!routeArr || routeArr.length <= 0) return;

        let startMarker = new ol.Feature({
            name: 'startMarker',
            geometry: new ol.geom.Point(routeArr[0])
        });
        let endMarker = new ol.Feature({
            name: 'endMarker',
            geometry: new ol.geom.Point(routeArr[routeArr.length - 1])
        });
        let styles = {
            'startMarker': new ol.style.Style({
                image: new ol.style.Icon({
                    anchor: [0.4, 0.7],
                    scale: 1,
                    src: 'images/start.png'
                })
            }),
            'endMarker': new ol.style.Style({
                image: new ol.style.Icon({
                    anchor: [0.4, 0.7],
                    scale: 1,
                    src: 'images/end.png'
                })
            })
        };
        let vectorLayer = new ol.layer.Vector({
            name: "routeSymbolLayer",
            zIndex: 1,
            source: new ol.source.Vector({
                features: [startMarker, endMarker]
            }),
            style: function (feature) {
                return styles[feature.get('name')];
            }
        });
        map.addLayer(vectorLayer);

        let segmentAngle = [];
        for (let i = 0; i < routeArr.length - 1; i++) {
            let segment = new ol.geom.LineString([routeArr[i], routeArr[i + 1]]);
            segmentAngle.push({
                index:i,
                path: segment,
                angle: NavigationMap.computeXAngle(routeArr[i], routeArr[i + 1])
            })
        }
        let routePath = new ol.Feature({
            geometry: new ol.geom.LineString(routeArr)
        });
        let routeLayer = new ol.layer.Vector({
            name: "routePathLayer",
            source: new ol.source.Vector({
                features: [routePath]
            }),
            style: function (feature, res) {
                //轨迹线图形
                let trackLine = feature.getGeometry();

                let styles = [
                    new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: '#2E8B57',
                            width: 12
                        })
                    })
                ];
                //轨迹地理长度
                let length = trackLine.getLength();
                //像素间隔步长
                let stpes = 40;//像素步长间隔
                //将像素步长转实际地理距离步长
                let geoSteps = stpes * res;
                //箭头总数
                let arrowsNum = Math.ceil(length / geoSteps);
                for (let i = 1; i < arrowsNum; i++) {
                    let arrowCoor = trackLine.getCoordinateAt(i / arrowsNum);
                    let angle = 0;
                    for (let j = 0; j < segmentAngle.length; j++) {
                        if(NavigationMap.lineContains(segmentAngle[j].path, arrowCoor)){
                            angle = segmentAngle[j].angle;
                        }
                    }
                    styles.push(new ol.style.Style({
                        geometry: new ol.geom.Point(arrowCoor),
                        image: new ol.style.Icon({
                            src: 'images/arrow.png',
                            rotateWithView: true,
                            rotation: -angle
                        })
                    }));
                }
                return styles;
            }
        })
        map.addLayer(routeLayer)

        let locationMarker = new ol.Feature({
            name: 'locationMarker',
            geometry: new ol.geom.Point([120.089, 36.359])
        });

        let animationLayer = new ol.layer.Vector({
            name: "routeAnimationLayer",
            zIndex: 1,
            source: new ol.source.Vector({
                features: [locationMarker]
            }),
            style: function (feature) {
                return new ol.style.Style({
                    image: new ol.style.Icon({
                        //anchor: [0.4, 0.7],
                        //scale: 0.3,
                        src: 'images/moving.png',
                        rotateWithView: true,
                        rotation: Math.PI / 2 - feature.get("angle")
                    })
                });
            }
        });
        map.addLayer(animationLayer)

        //计算动画帧位置
        let frameCoorArr = [];
        let path = new ol.geom.LineString(routeArr);
        path.forEachSegment((start, end) => {
            const step = 3;
            let pathInDegree = new ol.geom.LineString([start, end]);
            let pathInMeter = new ol.geom.LineString([
                ol.proj.fromLonLat(start, 'EPSG:3857'),
                ol.proj.fromLonLat(end, 'EPSG:3857')
            ]);
            let length = ol.Sphere.getLength(pathInMeter);
            let frameCount = Math.ceil(length / step);
            let factor = step / length;
            for (let j = 0; j < frameCount; j++) {
                let frameCoor = pathInDegree.getCoordinateAt(j * factor);

                //处理js精度不够造成的计算数据不准确问题
                frameCoor[0] = parseFloat(frameCoor[0].toFixed(8));
                frameCoor[1] = parseFloat(frameCoor[1].toFixed(8));
                frameCoorArr.push(frameCoor);

                if (!NavigationMap.extentContains(pathInDegree.getExtent(), frameCoor)) {
                    console.warn(`帧动画坐标与路线匹配失败，帧坐标${frameCoor}，线段坐标${pathInDegree.getCoordinates()}，目标范围${pathInDegree.getExtent()}`);
                }
            }
        });

        let index = 0;
        (function animationFrame() {
            index++;
            if (index >= frameCoorArr.length) index = 0;

            let angle = 0;
            for (let j = 0; j < segmentAngle.length; j++) {
                if (NavigationMap.lineContains(segmentAngle[j].path, frameCoorArr[index])) {
                    angle = segmentAngle[j].angle;
                }
            }
            locationMarker.set("angle", angle);
            locationMarker.setGeometry(new ol.geom.Point(frameCoorArr[index]));
            requestAnimationFrame(animationFrame);
        })();
        console.log("end");
    }

    /**
     * 返回p1,p2构成的直线与x轴夹角的弧度
     * @param p1
     * @param p2
     * @returns {number}
     */
    static computeXAngle(p1, p2) {
        if (p1[0] - p2[0] === 0) return Math.PI / 2;
        if (p1[1] - p2[1] === 0) return 0;

        let angle = Math.atan2((p2[1] - p1[1]), (p2[0] - p1[0])) //弧度
        if ((p2[1] - p1[1]) < 0) angle += (Math.PI * 2);
        //let theta = angle*(180/Math.PI); //角度

        return angle;
    }

    static lineIntersect(line,point){
        if(line.intersectsCoordinate(point)){
            return true;
        }

        return false;
    }

    /**
     * 判断point是否在extent范围内
     * @param extent
     * @param point
     */
    static extentContains(extent, point) {
        if (extent[0] <= point[0] && point[0] <= extent[2]
            && extent[1] <= point[1] && point[1] <= extent[3]) {
            return true;
        }
        return false;
    }

    /**
     * 判断点是否再线上。先通过line的extent判断point是否在bound内，
     * 若在，则通过斜率判断点是否在线上。由于js浮点数计算的不确定性，引入BigNumber。
     * ps：貌似bigNumber也不靠谱，还是需要做toFix运算。
     * @param line
     * @param point
     */
    static lineContains(line, point) {
        let extent = line.getExtent();
        let linePoints = line.getCoordinates();
        let first = linePoints[0];
        let last = linePoints[1];
        if (extent[0] <= point[0] && point[0] <= extent[2]
            && extent[1] <= point[1] && point[1] <= extent[3]) {
            //进一步判断是否确实在线上
            if(point[0] === first[0] && point[1]===first[1]){
                return true;
            }
            if(point[0] === last[0] && point[1]===last[1]){
                return true;
            }

            let a = {
                x:new BigNumber(first[0]),
                y:new BigNumber(first[1])
            };
            let b = {
                x:new BigNumber(last[0]),
                y:new BigNumber(last[1])
            };
            let c = {
                x:new BigNumber(point[0]),
                y:new BigNumber(point[1])
            };
            let k1 = b.y.minus(a.y).dividedBy(b.x.minus(a.x)).toFixed(2);
            let k2 = c.y.minus(a.y).dividedBy(c.x.minus(a.x)).toFixed(2);
            return k2 === k1;
        }
        return false;
    }
}

export default NavigationMap
