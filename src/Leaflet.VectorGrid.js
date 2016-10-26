

L.VectorGrid = L.GridLayer.extend({

	options: {
		rendererFactory: L.svg.tile,
		vectorTileLayerStyles: {},
		interactive: false,
	},

	initialize: function() {
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

					/// Style can be a callback that is passed the feature's
					/// properties and tile zoom level...
					var styleOptions = (layerStyle instanceof Function) ?
					layerStyle(feat.properties, coords.z) :
					layerStyle;


					if (!(styleOptions instanceof Array)) {
						styleOptions = [styleOptions];
					}

					if (!styleOptions.length) {
						continue;
					}

					this._mkFeatureParts(feat, pxPerExtent);

					if (storeFeatures) {
						var id = this.options.getFeatureId(feat);

						renderer._features[id] = {
							layerName: layerName,
							feature: feat
						};
					}

					/// Style can be an array of styles, for styling a feature
					/// more than once...
					for (var j in styleOptions) {
						var style = L.extend({}, L.Path.prototype.options, styleOptions[j]);
						this._addFeature(renderer, feat, style);
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
				layerStyle(feat.properties, featureData.zoom) :
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
			if (feat.type === 2) {	// Polyline
				style.fill = false;
			}
			feat.options = style;
			renderer._updateStyle(feat);
		}
	},

	_addFeature: function(renderer, feat, style) {
		if (feat.type === 2) {	// Polyline
			style.fill = false;
		}

		feat.options = style;
		renderer._initPath( feat );
		renderer._updateStyle( feat );

		if (feat.type === 1) { // Points
			feat._radius = style.radius,
			feat._updatePath = function() { renderer._updateCircle( feat ) };
		} else if (feat.type === 2) {	// Polyline
			feat._updatePath = function() { renderer._updatePoly(feat, false); };
		} else if (feat.type === 3) {	// Polygon
			feat._updatePath = function() { renderer._updatePoly(feat, true); };
		}

		feat._updatePath();

		if (this.options.interactive) {
			this._makeInteractive(feat);
		}

		renderer._addPath( feat );
	},

	// Fills up feat._parts based on the geometry and pxPerExtent,
	// pretty much as L.Polyline._projectLatLngs and L.Polyline._clipPoints
	// would do but simplified as the vectors are already simplified/clipped.
	_mkFeatureParts: function(feat, pxPerExtent) {
		var coord;

		if (feat.type === 1) {
			// Point
			coord = feat.geometry[0][0];
			if ('x' in coord) {
				feat._point = L.point(coord.x * pxPerExtent, coord.y * pxPerExtent);
				feat._empty = L.Util.falseFn;
			}
		} else {
			// Polylines and polygons
			var rings = feat.geometry;

			feat._parts = [];
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
				feat._parts.push(part);
			}
		}
	},

	_makeInteractive: function(feat) {
		feat._clickTolerance = L.Path.prototype._clickTolerance;
		L.extend(feat, L.Evented.prototype);
		feat.addEventParent(this);

		switch (feat.type) {
		case 1: // Point
			feat._containsPoint = L.CircleMarker.prototype._containsPoint;
			var r = feat._radius,
			    r2 = feat._radiusY || r,
			    w = feat._clickTolerance(),
			    p = [r + w, r2 + w];
			feat._pxBounds = new L.Bounds(feat._point.subtract(p), feat._point.add(p));
			break;
		case 2: // Polyline
			feat._containsPoint = L.Polyline.prototype._containsPoint;
			feat._pxBounds = this._getPixelBounds(feat);
			break;
		case 3: // Polygon
			feat._containsPoint = L.Polygon.prototype._containsPoint;
			feat._pxBounds = this._getPixelBounds(feat);
			break;
		}
	},

	_getPixelBounds: function(layer) {
		var parts = layer._parts;
		var bounds = L.bounds([]);
		for (var i = 0; i < parts.length; i++) {
			var part = parts[i];
			for (var j = 0; j < part.length; j++) {
				bounds.extend(part[j]);
			}
		}

		var w = layer._clickTolerance(),
		    p = new L.Point(w, w);

		bounds.min._subtract(p);
		bounds.max._add(p);

		return bounds;
	},
});



L.vectorGrid = function (options) {
	return new L.VectorGrid(options);
};
