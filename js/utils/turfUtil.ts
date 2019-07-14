// @ts-ignore
import bearing from "@turf/rhumb-bearing";
// @ts-ignore
import destination from "@turf/rhumb-destination";
// @ts-ignore
import measureDistance from "@turf/rhumb-distance";
// @ts-ignore
import { Feature, LineString, point, Point, Units } from "@turf/helpers";
// @ts-ignore
import { getGeom } from "@turf/invariant";

class TurfUtil{
    /**
     * calculate point along the straight line,not great circle.
     * @param line
     * @param distance
     * @param options
     */
    static alongStraightLine(line:LineString,distance:number,options: {units?: Units} = {}) : Feature<Point>{
        const geom = getGeom(line);
        const coords = geom.coordinates;
        let travelled = 0;
        for (let i = 0; i < coords.length; i++) {
            if (distance >= travelled && i === coords.length - 1) {
                break;
            } else if (travelled >= distance) {
                const overshot = distance - travelled;
                if (!overshot) {
                    return point(coords[i]);
                } else {
                    const direction = bearing(coords[i-1], coords[i]);
                    const interpolated = destination(coords[i-1], distance, direction, options);
                    return interpolated;
                }
            } else {
                travelled += measureDistance(coords[i], coords[i + 1], options);
            }
        }
        return point(coords[coords.length - 1]);
    }
}

export default TurfUtil;
