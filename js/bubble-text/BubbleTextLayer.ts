import VectorLayer, {Options} from "ol/layer/Vector";
import Style from "ol/style/Style";
import RenderEvent from "ol/render/Event";
import Feature from "ol/Feature";
import Icon from "ol/style/Icon";
import EventType from "ol/render/EventType";
import {EventsKey} from "ol/events";
import GeometryType from "ol/geom/GeometryType";

/**
 * @param {string} fontStyle  - 字体样式，例如："bold 14px 微软雅黑"
 */
interface BubbleTextOption extends Options {
    fontStyle?: string;
}

export default class BubbleTextLayer extends VectorLayer {
    private _textStyleMap: Map<string, Style>;
    private fontStyle: string;
    private fontSize: number;
    private listenComposeKey: EventsKey;
    private listenRenderKey: EventsKey;

    constructor(opt: BubbleTextOption) {
        super(opt);

        this.fontStyle = opt.fontStyle ? opt.fontStyle : "bold 14px 微软雅黑";
        let fontStyleArr = this.fontStyle && this.fontStyle.split(" ");
        this.fontSize = parseInt(fontStyleArr[1].replace("px", ""));
        this._textStyleMap = new Map();

        this.listenRenderKey = this.on(EventType.RENDER, (e) => {
            this._renderHandler(e);
        });

        //tips: for performance
        this.setRenderOrder(null);
    }

    _renderHandler(renderEvent: RenderEvent) {
        let frameState = renderEvent.frameState;
        let features = this.getSource().getFeaturesInExtent(frameState.extent);
        let points = features.filter(feature => {
            return feature.getGeometry().getType() === GeometryType.POINT;
        });
        this._renderText(renderEvent, points);
    }

    /**
     * 渲染文本
     * @param renderEvent
     * @param features
     * @private
     */
    _renderText(renderEvent: RenderEvent, features: Feature[]) {
        let vectorContext = renderEvent.vectorContext;
        for (let i = 0; i < features.length; i++) {
            let feature = features[i];
            let textWithColor = feature.get("textWithColor");
            let enableTextBackground = feature.get("enableTextBackground");
            if (textWithColor && enableTextBackground) {
                let style = this._textStyleMap.get(textWithColor);
                if (!style) {
                    style = this._composeTextStyle(textWithColor);
                    this._textStyleMap.set(textWithColor, style);
                }
                vectorContext.setStyle(style);
                vectorContext.drawGeometry(feature.getGeometry());
            }
        }
    }

    _composeTextStyle(textContent: string) {
        let canvas = document.createElement('canvas');
        let context = canvas.getContext("2d");
        context.font = "bold 14px 微软雅黑";

        let textAndColors = textContent.split(";");
        let textTotalLength = textAndColors.map(textAndColor => {
            return textAndColor.split("$")[0];
        }).reduce((sum, text) => {
            sum += context.measureText(text).width;
            return sum;
        }, 0);
        let textLengthWithBuffer = textTotalLength + 20;

        let radio = 1;
        canvas.width = radio * textLengthWithBuffer;
        canvas.height = radio * (this.fontSize + 55);
        canvas.style.width = canvas.width + "px";
        canvas.style.height = canvas.height + "px";
        context.setTransform(radio, 0, 0, radio, 0, 0);

        context.strokeStyle = "#373665e8";
        context.fillStyle = "#373665e8";
        let rect = new Rect(0, 0, textLengthWithBuffer, 24);
        this._drawRoundedRectWithTriangle(rect, 10, context);

        let textOffsetX = 10;
        context.font = this.fontStyle;
        context.fillStyle = "white";
        context.textAlign = "start";
        context.textBaseline = "top";
        for (let i = 0; i < textAndColors.length; i++) {
            let textAndColor = textAndColors[i].split("$");
            let textOnly = textAndColor[0];
            let colorOnly = textAndColor[1];
            context.fillStyle = colorOnly;
            context.fillText(textOnly, textOffsetX, 5);
            textOffsetX += context.measureText(textOnly).width;
        }

        return new Style({
            image: new Icon({
                img: canvas,
                imgSize: [canvas.width, canvas.height]
            })
        });
    }

    /**
     * 绘制带三角的圆角矩形
     * @param rect
     * @param r
     * @param context
     * @private
     */
    _drawRoundedRectWithTriangle(rect: Rect, r: number, context: CanvasRenderingContext2D) {
        let ptA = new Point(rect.x + r, rect.y);
        let ptB = new Point(rect.x + rect.width, rect.y);
        let ptC = new Point(rect.x + rect.width, rect.y + rect.height);
        let ptD = new Point(rect.x, rect.y + rect.height);
        let ptE = new Point(rect.x, rect.y);

        context.beginPath();

        context.moveTo(ptA.x, ptA.y);
        context.arcTo(ptB.x, ptB.y, ptC.x, ptC.y, r);
        context.arcTo(ptC.x, ptC.y, ptD.x, ptD.y, r);
        context.arcTo(ptD.x, ptD.y, ptE.x, ptE.y, r);
        context.arcTo(ptE.x, ptE.y, ptA.x, ptA.y, r);

        let y = ptC.y;
        let x = (ptC.x + ptD.x) / 2 - 5;
        context.moveTo(x, y);
        context.lineTo(x + 5, y + 5);
        context.lineTo(x + 10, y);
        // context.stroke();
        context.fill();
    }

    /**
     * 绘制圆角矩形
     * @param rect
     * @param r
     * @param context
     * @private
     */
    _drawRoundedRect(rect: Rect, r: number, context: CanvasRenderingContext2D) {
        let ptA = new Point(rect.x + r, rect.y);
        let ptB = new Point(rect.x + rect.width, rect.y);
        let ptC = new Point(rect.x + rect.width, rect.y + rect.height);
        let ptD = new Point(rect.x, rect.y + rect.height);
        let ptE = new Point(rect.x, rect.y);

        context.beginPath();

        context.moveTo(ptA.x, ptA.y);
        context.arcTo(ptB.x, ptB.y, ptC.x, ptC.y, r);
        context.arcTo(ptC.x, ptC.y, ptD.x, ptD.y, r);
        context.arcTo(ptD.x, ptD.y, ptE.x, ptE.y, r);
        context.arcTo(ptE.x, ptE.y, ptA.x, ptA.y, r);

        // context.stroke();
        context.fill();
    }
}

class Point {
    public x: number;
    public y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

class Rect {
    public x: number;
    public y: number;
    public width: number;
    public height: number;

    constructor(x: number, y: number, w: number, h: number) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
    }
}
