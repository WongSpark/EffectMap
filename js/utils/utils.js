export class CanvasUtil {
    /**
     * 创建高分辨率画布
     * @param w     画布宽
     * @param h     画布高
     * @param ratio 屏幕分辨率
     */
    static createHiDPICanvas(w, h, ratio) {

        const PIXEL_RATIO = (function () {
            const c = document.createElement("canvas"),
                ctx = c.getContext("2d"),
                dpr = window.devicePixelRatio || 1,
                bsr = ctx['webkitBackingStorePixelRatio'] ||
                    ctx['mozBackingStorePixelRatio'] ||
                    ctx['msBackingStorePixelRatio'] ||
                    ctx['oBackingStorePixelRatio'] ||
                    ctx['backingStorePixelRatio'] || 1;

            return dpr / bsr;
        })();

        if (!ratio) {
            ratio = PIXEL_RATIO;
        }
        const can = document.createElement("canvas");
        can.width = w * ratio;
        can.height = h * ratio;
        can.style.width = w + "px";
        can.style.height = h + "px";
        can.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
        return can;
    }
}

/**
 *
 */
export class UrlUtil{
    /**
     * 获取url中携带的参数
     * @param variable
     * @returns {*} 返回参数值，不存在就返回null
     */
    static getQueryVariable(variable) {
        let query = window.location.search.substring(1);
        let vars = query.split("&");
        for (let i=0;i<vars.length;i++) {
            let pair = vars[i].split("=");
            if(pair[0] === variable){
                return pair[1];
            }
        }
        return null;
    }
}

/**
 * 底图工具集合类
 */
export class MapUtil{
    /**
     * 比例尺转分辨率
     * @param scale
     * @param dpi
     * @param mapUnit
     * @returns {number}
     */
    static scaleToResolution(scale, dpi, mapUnit) {
        let inchPerMeter = 1 / 0.0254;
        let meterPerMapUnitValue = MapUtil.getMeterPerMapUnit(mapUnit);
        let resolution = scale * dpi * inchPerMeter * meterPerMapUnitValue;
        resolution = 1 / resolution;
        return resolution;
    }

    /**
     * 返回指定单位代表多少米
     * @param mapUnit
     * @returns {number}
     */
    static getMeterPerMapUnit(mapUnit) {
        let eachRadiusInMeters = 6378137;// 6371000;
        let meterPerMapUnit;
        if (mapUnit == "METER") {
            meterPerMapUnit = 1;
        } else if (mapUnit == "DEGREE") {
            // 每度表示多少米。
            meterPerMapUnit = Math.PI * 2 * eachRadiusInMeters / 360;
        } else if (mapUnit == "KILOMETER") {
            meterPerMapUnit = 1.0E-3;
        } else if (mapUnit == "INCH") {
            meterPerMapUnit = 1 / 2.5399999918E-2;
        } else if (mapUnit == "FOOT") {
            meterPerMapUnit = 0.3048;
        }
        return meterPerMapUnit;
    }
}


