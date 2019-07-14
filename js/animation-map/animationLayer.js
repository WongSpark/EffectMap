/**
 * 动画图层，可设置炫光球特效。
 *
 */
class AnimationLayer extends ol.layer.Vector{
    constructor(opt){
        super(opt);
        this.tempRadius = 0;
        this.start = null;
        this.duration = 1000;
        this.speedRadio = 1/30;
        this.maxRadius = 40;
        this.maxOpacity = 1;
        this.minRadius = 20;
        this.minOpacity = 0;
        this.outerRadius = this.minRadius;
        this.innerRadius = this.maxRadius*0.5;
        this.opacity = this.maxOpacity;
        this.outerOpacity = this.maxOpacity;

        this.size = [document.body.clientWidth,document.body.clientHeight];

        this._canvasHeight = this.maxRadius*2;
        this._canvasWidth = this.maxRadius*2;

        this._canvas = document.createElement('canvas');
        this._canvas.width = this.maxRadius*2;
        this._canvas.height = this.maxRadius*2;

        this._backCanvas = document.createElement('canvas');
        this._backContext = this._backCanvas.getContext('2d');
        this._backCanvas.width = this.maxRadius*2;
        this._backCanvas.height = this.maxRadius*2;
        this._backContext.globalAlpha = 0.95;
        this._backContext.globalCompositeOperation = 'copy';

        this.listenComposeKey = ol.events.listen(this, 'postcompose', this._composeHandler, this);

    }

    /**
     * 关闭动画
     */
    disableAnimation(){
        ol.Observable.unByKey(this.listenComposeKey);
    }

    /**
     * 开启动画
     */
    enableAnimation(){
        this.listenComposeKey = ol.events.listen(this, 'postcompose', this._composeHandler, this);
        this.getSource().changed();
    }

    /**
     * 每一帧动画的组成函数
     * @param renderEvent
     * @private
     */
    _composeHandler(renderEvent){
        let frameState = renderEvent.frameState;
        let vectorContext = renderEvent.vectorContext;
        this._setFlashCircleInAnotherWay(vectorContext,frameState);
        // this._setStyleUseDuration(vectorContext,frameState);
        let features = this.getSource().getFeatures();
        let viewState = frameState.viewState;
        let viewExtent = ol.extent.getForViewAndSize(
            viewState.center, viewState.resolution, viewState.rotation, this.size);
        for(let i=0;i<features.length;i++){
            let feature = features[i];
            //绘制某个范围内的要素动画
            // let coor = feature.getGeometry().getFirstCoordinate();
            // if(feature.get("animation") && ol.extent.containsCoordinate(viewExtent,coor)){
            //     let flashGeom = feature.getGeometry().clone();
            //     vectorContext.drawGeometry(flashGeom);
            // }

            if(feature.get("animation")){
                let flashGeom = feature.getGeometry().clone();
                vectorContext.drawGeometry(flashGeom);
            }
        }

        this.getSource().changed();
    }

    _setStyleUseDuration(vectorContext,frameState){
        if(this.start === null){
            this.start = new Date().getTime();
        }

        let elapsed = frameState.time - this.start;
        let elapsedRatio = elapsed / this.duration;
        if(elapsedRatio>1) {
            elapsedRatio = 0;
            this.start = new Date().getTime();
        }
        // 半径5-30
        let radius = ol.easing.easeOut(elapsedRatio) * 25 + 5;
        // radius = Math.floor(radius);
        let style = new ol.style.Style({
            image: new ol.style.Circle({
                radius: radius,
                snapToPixel: false,
                stroke: new ol.style.Stroke({
                    color: 'rgba(255, 0, 0, ' + 1 + ')',
                    width: 0.25 + this.opacity
                })
            })
        });
        vectorContext.setStyle(style);
    }

    /**
     * 设置炫光圆特效样式
     * @param vectorContext
     * @private
     */
    _setFlashCircleStyle(vectorContext){
        let outerRadius = this.outerRadius;
        let innerRadius = this.innerRadius;
        let canvas =this._canvas;
        canvas.width = this.maxRadius*2;
        canvas.height = this.maxRadius*2;
        let ctx=canvas.getContext("2d");

        let gradient;
        if(this.outerRadius === this.maxRadius){
            gradient = ctx.createRadialGradient(this.maxRadius, this.maxRadius, innerRadius*0.3, this.maxRadius, this.maxRadius, innerRadius*0.9);
            gradient.addColorStop(0, 'rgba(131, 45, 72,0)');
            gradient.addColorStop(0.5, 'rgba(131, 45, 72,0.3)');
            gradient.addColorStop(1, 'rgba(131, 45, 72,0.8)');
            this.outerOpacity = (this.outerOpacity -0.02)<=0 ? this.minOpacity : (this.outerOpacity -=0.02);
            ctx.globalAlpha = this.outerOpacity;
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.maxRadius, this.maxRadius, outerRadius, 0, Math.PI * 2,false);
            ctx.fill();

            ctx.globalAlpha = 1;
            gradient = ctx.createRadialGradient(this.maxRadius, this.maxRadius, innerRadius*0.3, this.maxRadius, this.maxRadius, innerRadius*0.9);
            gradient.addColorStop(0, 'rgba(131, 45, 72,0)');
            gradient.addColorStop(0.5, 'rgba(131, 45, 72,0.3)');
            gradient.addColorStop(1, 'rgba(131, 45, 72,0.4)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.maxRadius, this.maxRadius, innerRadius, 0, Math.PI * 2,false);
            ctx.fill();
            this.innerRadius += (this.maxRadius-this.minRadius)*this.speedRadio*0.7;
        }else{
            gradient = ctx.createRadialGradient(this.maxRadius, this.maxRadius, outerRadius*0.3, this.maxRadius, this.maxRadius, outerRadius*0.9);
            gradient.addColorStop(0, 'rgba(131, 45, 72,0)');
            gradient.addColorStop(0.5, 'rgba(131, 45, 72,0.3)');
            gradient.addColorStop(1, 'rgba(131, 45, 72,0.4)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.maxRadius, this.maxRadius, outerRadius, 0, Math.PI * 2,false);
            ctx.fill();
        }


        this.outerRadius += (this.maxRadius-this.minRadius)*this.speedRadio;
        if(this.outerRadius>=this.maxRadius) {
            this.outerRadius = this.maxRadius;
        }
        if(this.innerRadius>=this.maxRadius*0.8){
            this.innerRadius = this.maxRadius*0.5;
            this.outerRadius = this.minRadius;
            this.outerOpacity = this.maxOpacity;
        }

        let canvasStyle = new ol.style.Style({
            image: new ol.style.Icon({
                img: canvas,
                scale:1,
                imgSize: [canvas.width, canvas.height],
            })
        });
        vectorContext.setStyle(canvasStyle);
    }

    /**
     * 设置不规则几何图形特效样式
     * @param vectorContext
     * @private
     */
    _setArrowStyle(vectorContext){
        let canvas =document.createElement('canvas');
        canvas.width = 20;
        canvas.height = 20;
        let context = canvas.getContext("2d");
        context.strokeStyle = "red";
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(20, 10);
        context.lineTo(0, 20);
        context.lineTo(10, 10);
        context.lineTo(0, 0);
        context.stroke();

        // 把绘制了的canvas设置到style里面
        let canvasStyle = new ol.style.Style({
            image: new ol.style.Icon({
                img: canvas,
                imgSize: [canvas.width, canvas.height],
                rotation: 90 * Math.PI / 180
            })
        });
        vectorContext.setStyle(canvasStyle);
    }

    /**
     * 设置放大圆特效样式
     * @param vectorContext
     * @private
     */
    _setScaleCircleStyle(vectorContext){
        if(this.outerRadius >= this.maxRadius) this.outerRadius = this.minRadius;
        if(this.opacity <= this.minOpacity) this.opacity = this.maxOpacity;
        this.outerRadius = this.outerRadius + (this.maxRadius-this.minRadius)*this.speedRadio;
        this.opacity = this.opacity - (this.maxOpacity-this.minOpacity)*this.speedRadio;

        let style = new ol.style.Style({
            image: new ol.style.Circle({
                radius: this.outerRadius,
                snapToPixel: false,
                stroke: new ol.style.Stroke({
                    color: 'rgba(255, 0, 0, ' + this.opacity + ')',
                    width: 0.25 + this.opacity
                })
            })
        });
        vectorContext.setStyle(style);
    }

    //画圆
    _drawCircle () {
        let context = this._canvas.getContext("2d");
        context.beginPath();
        context.arc(this.maxRadius, this.maxRadius, this.tempRadius, 0, Math.PI * 2);
        context.closePath();
        context.lineWidth = 2; //线条宽度
        context.strokeStyle = 'rgba(131, 45, 72,1)'; //颜色
        context.stroke();
        this.tempRadius += 0.5; //每一帧半径增加0.5

        //半径radius大于30时，重置为0
        if (this.tempRadius > 35) {
            this.tempRadius = 15;
        }
    };

    _getStyleCanvas() {
        let context = this._canvas.getContext("2d");

        //1.先将主canvas的图像缓存到临时canvas中
        this._backContext.drawImage(this._canvas, 0, 0, this._canvasWidth, this._canvasHeight);

        //2.清除主canvas上的图像
        context.clearRect(0, 0, this._canvasWidth, this._canvasHeight);

        //3.在主canvas上画新圆
        this._drawCircle();

        //4.等新圆画完后，再把临时canvas的图像绘制回主canvas中
        context.drawImage(this._backCanvas, 0, 0, this._canvasWidth, this._canvasHeight);

        return this._canvas;
    };

    _setFlashCircleInAnotherWay(vectorContext,frameState){
        let canvasStyle = new ol.style.Style({
            image: new ol.style.Icon({
                img: this._getStyleCanvas(),
                scale:1,
                imgSize: [this._canvasWidth, this._canvasHeight],
            })
        });
        vectorContext.setStyle(canvasStyle);
    }
}

