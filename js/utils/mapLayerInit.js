import { MapUtil } from './utils';
import $ from 'jquery';
import OpenlayersExt from './OpenlayersExt';
import {UrlConfig} from '../utils/utils'

/**
 * 地图显示初始化类
 */
class MapInit{
    constructor(center){
        this.currentFloor = 1;
        this.baseResolutions = [];
        this.floorResolutions=[];

        this.serviceUrl = UrlConfig.mapServerUrl;
        this.mapUrl = this.serviceUrl+"/iserver/services/map-qdjdgjjc_out/rest/maps/2DMap";
        this.terminalF1MapUrl = this.serviceUrl+"/iserver/services/map-ugcv5-TerminalF1/rest/maps/Terminal_F1";
        this.terminalF2MapUrl = this.serviceUrl+"/iserver/services/map-ugcv5-TerminalF2/rest/maps/Terminal_F2";
        this.terminalF3MapUrl = this.serviceUrl+"/iserver/services/map-ugcv5-TerminalF3/rest/maps/Terminal_F3";
        this.terminalF4MapUrl = this.serviceUrl+"/iserver/services/map-ugcv5-TerminalF4/rest/maps/Terminal_F4";

        this.center = center?center:[120.088, 36.363];
        this.terminalMapUrls = [this.terminalF1MapUrl,this.terminalF2MapUrl,this.terminalF3MapUrl,this.terminalF4MapUrl];

        //自定义坐标系，以适应超图数据
        proj4.defs("EPSG:32651","+proj=utm +zone=51 +datum=WGS84 +units=m +no_defs");

        /**
         * 机场底图的比例尺数组。
         * 因为机场底图与航站楼楼层图层数据的比例尺不同，导致使用默认tileGrid加载图层时，
         * 图层模糊。所以需要明确设置各图层的tileGrid参数，重点是original和resolution。
         */
        const dpi = 96;const mapUnit = 'DEGREE';
        const floorScales = [1/6000,1/3000,1/1500,1/500,1/200,1/100];
        const baseScales = [1/500000,1/250000,1/100000,1/50000,1/25000,1/10000,1/6000,1/3000,1/1500,1/500,1/200,1/100];
        for (let i = 0; i < baseScales.length; i++) {
            let resolution = MapUtil.scaleToResolution(baseScales[i],dpi,mapUnit);
            this.baseResolutions.push(resolution)
        }
        for(let i = 0;i<floorScales.length;i++){
            let resolution = MapUtil.scaleToResolution(floorScales[i],dpi,mapUnit);
            this.floorResolutions.push(resolution);
        }
    }

    getCurrentFloor(){
        return this.currentFloor;
    }

    /**
     * 获得openlayers map对象
     * @returns {ol.Map|Map}
     */
    getMap(){
        return this.map;
    }

    initMap(){
        this.map = new ol.Map({
            target: 'map',
            controls:[new ol.control.MousePosition({
                coordinateFormat: ol.coordinate.createStringXY(4),
                projection: 'EPSG:4326',
                target: document.getElementById('mouse-position'),
                undefinedHTML: '&position;'
            })],
            view: new ol.View({
                //center: ol.proj.fromLonLat([120.08 ,36.36],'EPSG:3857'),
                center: this.center,
                zoom: 5,
                resolutions: this.baseResolutions,
                projection:'EPSG:4326',
            }),
            interactions: ol.interaction.defaults().extend([new OpenlayersExt.Drag()])
        });
        this.mapLayer = new ol.layer.Tile({
            // source: new ol.source.TileSuperMapRest({
            //     url: this.mapUrl,
            //     wrapX: false,
            //     format: 'png',
            //     tileGrid: new ol.tilegrid.TileGrid({
            //         //extent: [120.04, 36.31, 120.14, 36.41],
            //         resolutions: this.baseResolutions,
            //         origin: [120.04, 36.41]
            //     })
            // }),
            source:new ol.source.OSM(),
            projection: 'EPSG:4326'
        });
        this.map.addLayer(this.mapLayer);
        this.airportMapLayer = new ol.layer.Tile({
            source: new ol.source.TileSuperMapRest({
                url: this.terminalMapUrls[0],
                wrapX: false,
                transparent:true,
                format: 'png',
                tileGrid: new ol.tilegrid.TileGrid({
                    //extent: [120.08031547156963, 36.350991559216766, 120.09900733764493, 36.36778762724163],
                    resolutions:this.floorResolutions,
                    origin: [120.08031547156963, 36.36778762724163]
                })
            }),
            projection: 'EPSG:4326'
        });
        // this.map.addLayer(this.airportMapLayer);
    }

    registerBtnListener(){
        $("#floorBtnPanel").on('click','li',(e)=>{
            this.currentFloor = parseInt(e.currentTarget.dataset.floor);
            // this.currentFloor = parseInt($(e.currentTarget).attr("data"));
            console.log(this.currentFloor);
            this.map.removeLayer(this.airportMapLayer);

            let btnIndex = $(e.currentTarget).index();
            this.airportMapLayer = new ol.layer.Tile({
                zIndex:0,
                source: new ol.source.TileSuperMapRest({
                    url: this.terminalMapUrls[this.currentFloor-1],
                    wrapX:false,
                    transparent: true,
                    format: 'png',
                    tileGrid: new ol.tilegrid.TileGrid({
                        extent: [120.08031547156963, 36.350991559216766, 120.09900733764493, 36.36778762724163],
                        resolutions: this.floorResolutions,
                        origin: [120.08031547156963, 36.36778762724163]
                    })
                })
            });
            this.map.getLayers().insertAt(1,this.airportMapLayer);
            // this.map.addLayer(this.airportMapLayer);

            $(".floorBtn").each((index,element)=>{
                if($(element).hasClass("floorBtnSelected")){
                    $(element).removeClass("floorBtnSelected");
                }
            });
            $(e.currentTarget).addClass("floorBtnSelected");
        })
    }

    getUserLocation(){
        if(!this.locationMarker){
            console.warn("no user location.")
            return;
        }

        return this.locationMarker.getGeometry().getFirstCoordinate();
    }

    /**
     * 显示一个可拖拽的定位标识
     */
    showLocation(coordinate){
        let location = coordinate ? coordinate : this.map.getView().getCenter();
        this.locationMarker = new ol.Feature({
            name:'locationMarker',
            draggable:true,
            geometry: new ol.geom.Point(location)
        });
        let vectorLayer = new ol.layer.Vector({
            zIndex: 1,
            source: new ol.source.Vector({
                features: [this.locationMarker]
            }),
            style: new ol.style.Style({
                image: new ol.style.Icon({
                    anchor: [0.4, 0.7],
                    scale:0.4,
                    src: 'images/cur_location.png'
                })
            })
        });
        this.map.addLayer(vectorLayer)
    }
}

export default MapInit
