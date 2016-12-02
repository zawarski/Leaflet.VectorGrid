import {} from './Leaflet.Renderer.SVG.Tile.js';

L.VectorGrid = L.GridLayer.extend({

	options: {
		rendererFactory: L.svg.tile,
		vectorTileLayerStyles: {},
		interactive: false
	},

	initialize: function(options) {
		L.setOptions(this, options);
		L.GridLayer.prototype.initialize.apply(this, arguments);
		if (this.options.getFeatureId) {
			this._vectorTiles = {};
			this.on('tileunload', function(e) {
				delete this._vectorTiles[this._tileCoordsToKey(e.coords)];
			}, this);
		}
	},

	createTile: function(coords, done) {
		var storeFeatures = this.options.getFeatureId;

		var tileSize = this.getTileSize();
		var renderer = this.options.rendererFactory(coords, tileSize, this.options);

		var vectorTilePromise = this._getVectorTilePromise(coords);

		if (storeFeatures) {
			this._vectorTiles[this._tileCoordsToKey(coords)] = renderer;
			renderer._features = {};
		}

		vectorTilePromise.then( function renderTile(vectorTile) {
			for (var layerName in vectorTile.layers) {
				var layer = vectorTile.layers[layerName];

				/// NOTE: THIS ASSUMES SQUARE TILES!!!!!1!
				var pxPerExtent = this.getTileSize().x / layer.extent;

				var layerStyle = this.options.vectorTileLayerStyles[ layerName ] ||
				L.Path.prototype.options;

				for (var i in layer.features) {
					var feat = layer.features[i];

					var styleOptions = (layerStyle instanceof Function) ?
					layerStyle(feat.properties, coords.z) :
					layerStyle;

					if (!(styleOptions instanceof Array)) {
						styleOptions = [styleOptions];
					}

					if (!styleOptions.length) {
						continue;
					}

					var featureLayer = this._createLayer(feat, pxPerExtent);

					for (var j in styleOptions) {
						var style = L.extend({}, L.Path.prototype.options, styleOptions[j]);
						featureLayer.render(renderer, style);
						renderer._addPath(featureLayer);
					}

					if (this.options.interactive) {
						featureLayer.makeInteractive();
					}

					if (storeFeatures) {
						var id = this.options.getFeatureId(feat);

						renderer._features[id] = {
							layerName: layerName,
							feature: featureLayer
						};
					}
				}

			}
			renderer.addTo(this._map);
			L.Util.requestAnimFrame(done.bind(coords, null, null));
		}.bind(this));

		return renderer.getContainer();
	},

	setFeatureStyle: function(id, layerStyle) {
		for (var tileKey in this._vectorTiles) {
			var tile = this._vectorTiles[tileKey];
			var features = tile._features;
			var data = features[id];
			if (data) {
				var feat = data.feature;
				var styleOptions = (layerStyle instanceof Function) ?
				layerStyle(feat.properties, tile.getCoord().z) :
				layerStyle;
				this._updateStyles(feat, tile, styleOptions);
			}
		}
	},

	resetFeatureStyle: function(id) {
		for (var tileKey in this._vectorTiles) {
			var tile = this._vectorTiles[tileKey];
			var features = tile._features;
			var data = features[id];
			if (data) {
				var feat = data.feature;
				var layerStyle = this.options.vectorTileLayerStyles[ data.layerName ] ||
				L.Path.prototype.options;
				var styleOptions = (layerStyle instanceof Function) ?
				layerStyle(feat.properties, tile.getCoord().z) :
				layerStyle;
				this._updateStyles(feat, tile, styleOptions);
			}
		}
	},

	_updateStyles: function(feat, renderer, styleOptions) {
		if (!(styleOptions instanceof Array)) {
			styleOptions = [styleOptions];
		}

		for (var j in styleOptions) {
			var style = L.extend({}, L.Path.prototype.options, styleOptions[j]);
			feat.updateStyle(renderer, style);
		}
	},

	_createLayer: function(feat, pxPerExtent, layerStyle) {
		var layer;
		switch (feat.type) {
		case 1:
			layer = new PointLayer(feat, pxPerExtent, this.options.interactive);
			break;
		case 2:
			layer = new PolylineLayer(feat, pxPerExtent, this.options.interactive);
			break;
		case 3:
			layer = new PolygonLayer(feat, pxPerExtent, this.options.interactive);
			break;
		}

		if (this.options.interactive) {
			layer.addEventParent(this);
		}

		return layer;
	},
});

L.vectorGrid = function (options) {
	return new L.VectorGrid(options);
};

var FeatureLayer = L.Class.extend({
	render: function(renderer, style) {
		this._renderer = renderer;
		this.options = style;
		renderer._initPath(this);
		renderer._updateStyle(this);
	},

	updateStyle: function(renderer, style) {
		this.options = style;
		renderer._updateStyle(this);
	},

	_getPixelBounds: function() {
		var parts = this._parts;
		var bounds = L.bounds([]);
		for (var i = 0; i < parts.length; i++) {
			var part = parts[i];
			for (var j = 0; j < part.length; j++) {
				bounds.extend(part[j]);
			}
		}

		var w = this._clickTolerance(),
		    p = new L.Point(w, w);

		bounds.min._subtract(p);
		bounds.max._add(p);

		return bounds;
	},
	_clickTolerance: L.Path.prototype._clickTolerance,
});

var PointLayer = L.CircleMarker.extend({
	includes: FeatureLayer.prototype,

	initialize: function(feature, pxPerExtent) {
		this.properties = feature.properties;
		this._makeFeatureParts(feature, pxPerExtent);
	},

	render: function(renderer, style) {
		FeatureLayer.prototype.render.call(this, renderer, style);
		this._radius = style.radius;
		this._updatePath();
	},

	_makeFeatureParts: function(feat, pxPerExtent) {
		var coord = feat.geometry[0][0];
		if ('x' in coord) {
			this._point = L.point(coord.x * pxPerExtent, coord.y * pxPerExtent);
			this._empty = L.Util.falseFn;
		}
	},
	makeInteractive: function() {
		var r = this._radius,
		    r2 = this._radiusY || r,
		    w = this._clickTolerance(),
		    p = [r + w, r2 + w];
		this._pxBounds = new L.Bounds(this._point.subtract(p), this._point.add(p));
	}
});

var polyBase = {
	_makeFeatureParts: function(feat, pxPerExtent) {
		var rings = feat.geometry;
		var coord;

		this._parts = [];
		for (var i in rings) {
			var ring = rings[i];
			var part = [];
			for (var j in ring) {
				coord = ring[j];
				if ('x' in coord) {
					// Protobuf vector tiles return {x: , y:}
					part.push(L.point(coord.x * pxPerExtent, coord.y * pxPerExtent));
				} else {
					// Geojson-vt returns [,]
					part.push(L.point(coord[0] * pxPerExtent, coord[1] * pxPerExtent));
				}
			}
			this._parts.push(part);
		}
	},

	makeInteractive: function() {
		this._pxBounds = this._getPixelBounds();
	}
};

var PolylineLayer = L.Polyline.extend({
	includes: [FeatureLayer.prototype, polyBase],

	initialize: function(feature, pxPerExtent) {
		this.properties = feature.properties;
		this._makeFeatureParts(feature, pxPerExtent);
	},

	render: function(renderer, style) {
		style.fill = false;
		FeatureLayer.prototype.render.call(this, renderer, style);
		this._updatePath();
	},

	updateStyle: function(renderer, style) {
		style.fill = false;
		FeatureLayer.prototype.updateStyle.call(this, renderer, style);
	},
});

var PolygonLayer = L.Polygon.extend({
	includes: [FeatureLayer.prototype, polyBase],

	initialize: function(feature, pxPerExtent) {
		this.properties = feature.properties;
		this._makeFeatureParts(feature, pxPerExtent);
	},

	render: function(renderer, style) {
		FeatureLayer.prototype.render.call(this, renderer, style);
		this._updatePath();
	}
});
