

L.Canvas.Tile = L.Canvas.extend({

	initialize: function (map, tileCoord, tileSize, options) {
		L.Canvas.prototype.initialize.call(this, options);
		this._map = map;
		this._tileCoord = tileCoord;
		this._size = tileSize;

		this._initContainer();
		this._container.setAttribute('width', this._size.x);
		this._container.setAttribute('height', this._size.y);
		this._layers = {};
		this._drawnLayers = {};

		if (options.interactive) {
			// By default, Leaflet tiles do not have pointer events
		    this._container.style.pointerEvents = 'auto';
		}
	},

	getContainer: function() {
		return this._container;
	},

	getOffset: function() {
		return this._tileCoord.scaleBy(this._size).subtract(this._map.getPixelOrigin());
	},

	onAdd: L.Util.falseFn,

	_requestRedraw: L.Util.falseFn,

	_onClick: function (e) {
		var point = this._map.mouseEventToLayerPoint(e).subtract(this.getOffset()), layers = [], layer;

		for (var id in this._layers) {
			layer = this._layers[id];
			if (layer.options.interactive && layer._containsPoint(point) && !this._map._draggableMoved(layer)) {
				L.DomEvent._fakeStop(e);
				layers.push(layer);
			}
		}
		if (layers.length)  {
			this._fireEvent(layers, e);
		}
	},

	_onMouseMove: function (e) {
		if (!this._map || this._map.dragging.moving() || this._map._animatingZoom) { return; }

		var point = this._map.mouseEventToLayerPoint(e).subtract(this.getOffset());
		this._handleMouseOut(e, point);
		this._handleMouseHover(e, point);
	},

	/// TODO: Modify _initPath to include an extra parameter, a group name
	/// to order symbolizers by z-index

});


L.canvas.tile = function(map, tileCoord, tileSize, opts){
	return new L.Canvas.Tile(map, tileCoord, tileSize, opts);
}

