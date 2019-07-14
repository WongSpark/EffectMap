/**
 * openlayers扩展
 */
let OpenlayersExt = {};


/**
 * 定义自定义拖拽类
 * @constructor
 * @extends {ol.interaction.Pointer}
 */
OpenlayersExt.Drag = function() {

    ol.interaction.Pointer.call(this, {
        handleDownEvent: OpenlayersExt.Drag.prototype.handleDownEvent,
        handleDragEvent: OpenlayersExt.Drag.prototype.handleDragEvent,
        handleMoveEvent: OpenlayersExt.Drag.prototype.handleMoveEvent,
        handleUpEvent: OpenlayersExt.Drag.prototype.handleUpEvent
    });

    /**
     * @type {ol.Pixel}
     * @private
     */
    this.coordinate_ = null;

    /**
     * @type {string|undefined}
     * @private
     */
    this.cursor_ = 'pointer';

    /**
     * @type {ol.Feature}
     * @private
     */
    this.feature_ = null;

    /**
     * @type {string|undefined}
     * @private
     */
    this.previousCursor_ = undefined;

};
ol.inherits(OpenlayersExt.Drag, ol.interaction.Pointer);


/**
 * @param {ol.MapBrowserEvent} evt Map browser event.
 * @return {boolean} `true` to start the drag sequence.
 */
OpenlayersExt.Drag.prototype.handleDownEvent = function(evt) {
    var map = evt.map;

    var feature = map.forEachFeatureAtPixel(evt.pixel, function(feature) {
        return feature;
    });

    if (feature) {
        this.coordinate_ = evt.coordinate;
        this.feature_ = feature;
    }

    return !!feature && !!feature.get("draggable");
};


/**
 * @param {ol.MapBrowserEvent} evt Map browser event.
 */
OpenlayersExt.Drag.prototype.handleDragEvent = function(evt) {
    var deltaX = evt.coordinate[0] - this.coordinate_[0];
    var deltaY = evt.coordinate[1] - this.coordinate_[1];

    var geometry = this.feature_.getGeometry();
    geometry.translate(deltaX, deltaY);

    this.coordinate_[0] = evt.coordinate[0];
    this.coordinate_[1] = evt.coordinate[1];
};


/**
 * @param {ol.MapBrowserEvent} evt Event.
 */
OpenlayersExt.Drag.prototype.handleMoveEvent = function(evt) {
    if (this.cursor_) {
        var map = evt.map;
        var feature = map.forEachFeatureAtPixel(evt.pixel,
            function(feature) {
                return feature;
            });
        var element = evt.map.getTargetElement();
        if (feature) {
            if (element.style.cursor != this.cursor_) {
                this.previousCursor_ = element.style.cursor;
                element.style.cursor = this.cursor_;
            }
        } else if (this.previousCursor_ !== undefined) {
            element.style.cursor = this.previousCursor_;
            this.previousCursor_ = undefined;
        }
    }
};


/**
 * @return {boolean} `false` to stop the drag sequence.
 */
OpenlayersExt.Drag.prototype.handleUpEvent = function() {
    this.coordinate_ = null;
    this.feature_ = null;
    return false;
};

export default OpenlayersExt;