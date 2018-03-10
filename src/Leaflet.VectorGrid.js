// import {} from './Leaflet.Renderer.SVG.Tile.js';
// import { PointSymbolizer } from './Symbolizer.Point.js';
// import { LineSymbolizer } from './Symbolizer.Line.js';
// import { FillSymbolizer } from './Symbolizer.Fill.js';

import  CircleSymbolizer  from './Symbolizer.Circle.js';
import  LineSymbolizer  from './Symbolizer.Line.js';
import  PolygonSymbolizer from './Symbolizer.Polygon.js';
import FunctionalSymbolizer from './Symbolizer.Functional.js';

/* 🍂class VectorGrid
 * 🍂inherits GridLayer
 *
 * A `VectorGrid` is a generic, abstract class for displaying tiled vector data.
 * it provides facilities for symbolizing and rendering the data in the vector
 * tiles, but lacks the functionality to fetch the vector tiles from wherever
 * they are.
 *
 * Extends Leaflet's `L.GridLayer`.
 */

L.VectorGrid = L.GridLayer.extend({

	options: {
		// 🍂option rendererFactory = L.svg.tile
		// A factory method which will be used to instantiate the per-tile renderers.
		rendererFactory: L.svg.tile,

		// 🍂option vectorTileLayerStyles: Object = {}
		// A data structure holding initial symbolizer definitions for the vector features.
		vectorTileLayerStyles: {},

		// 🍂option getFeatureSymbolizers: Function
		// A function that runs for every vector tile feature (receiving
		// `(theme, properties, zoomLevel, geometryDimension)`, and must
		// return an `Array` of `Symbolizer`s.
		// By default, symbolizers are made out of the `vectorTileLayerStyles`
		// option.
        // If specified, the vectorTileLayerStyles is not used.
		getFeatureSymbolizers: undefined,

		// 🍂option interactive: Boolean = false
		// Whether this `VectorGrid` fires `Interactive Layer` events.
		interactive: false,

		// 🍂option getFeatureId: Function = undefined
		// A function that, given a vector feature, returns an unique identifier for it, e.g.
		// `function(feat) { return feat.properties.uniqueIdField; }`.
		// Must be defined for `setFeatureStyle` to work.
	},

	initialize: function(options) {
		L.setOptions(this, options);
		L.GridLayer.prototype.initialize.apply(this, arguments);
		if (this.options.getFeatureId) {
			this._vectorTiles = {};
			this._overriddenStyles = {};
			this.on('tileunload', function(e) {
				var key = this._tileCoordsToKey(e.coords),
				    tile = this._vectorTiles[key];

				if (tile && this._map) {
					tile.removeFrom(this._map);
				}
				delete this._vectorTiles[key];
			}, this);
		}

		if (!this.options.getFeatureSymbolizers) {
			this.options.getFeatureSymbolizers = this._defaultGetFeatureSymbolizers.bind(this);
		}

		this._dataLayerNames = {};
	},

	createTile: function(coords, done) {
		const storeFeatures = this.options.getFeatureId;

		const tileSize = this.getTileSize();
		const renderer = this.options.rendererFactory(coords, tileSize, this.options);

		const vectorTilePromise = this._getVectorTilePromise(coords);

		if (storeFeatures) {
			this._vectorTiles[this._tileCoordsToKey(coords)] = renderer;
			renderer._symbols = {};
		}

		vectorTilePromise.then( function renderTile(vectorTile) {
			for (const themeName in vectorTile.layers) {
				this._dataLayerNames[themeName] = true;
				const theme = vectorTile.layers[themeName];

				const pxPerExtent = this.getTileSize().divideBy(theme.extent);

// 				var layerStyle = this.options.vectorTileLayerStyles[ themeName ] ||
// 				L.Path.prototype.options;

				for (var i = 0; i < theme.features.length; i++) {
					var feat = theme.features[i];
					var id;

					let symbolizer = this.options.getFeatureSymbolizers(
						themeName, feat.properties, coords.z, feat.type
					);

					symbolizer.render(feat, pxPerExtent, renderer);

// 					var styleOptions = layerStyle;
// 					if (storeFeatures) {
// 						id = this.options.getFeatureId(feat);
// 						var styleOverride = this._overriddenStyles[id];
// 						if (styleOverride) {
// 							if (styleOverride[themeName]) {
// 								styleOptions = styleOverride[themeName];
// 							} else {
// 								styleOptions = styleOverride;
// 							}
// 						}
// 					}
//
// 					if (styleOptions instanceof Function) {
// 						styleOptions = styleOptions(feat.properties, coords.z);
// 					}
//
// 					if (!(styleOptions instanceof Array)) {
// 						styleOptions = [styleOptions];
// 					}
//
// 					if (!styleOptions.length) {
// 						continue;
// 					}
//
// 					var vtSymbol = this._createLayer(feat, pxPerExtent);
//
// 					for (var j = 0; j < styleOptions.length; j++) {
// 						var style = L.extend({}, L.Path.prototype.options, styleOptions[j]);
// 						vtSymbol.render(renderer, style);
// 						renderer._addPath(vtSymbol);
// 					}
//
// 					if (this.options.interactive) {
// 						vtSymbol.makeInteractive();
// 					}
//
// 					if (storeFeatures) {
// 						renderer._symbols[id] = {
// 							themeName: themeName,
// 							feature: vtSymbol
// 						};
// 					}
				}

			}
			if (this._map != null) {
				renderer.addTo(this._map);
			}
			L.Util.requestAnimFrame(done.bind(coords, null, null));
		}.bind(this));

		return renderer.getContainer();
	},

	// 🍂method setFeatureStyle(id: Number, layerStyle: L.Path Options): this
	// Given the unique ID for a vector features (as per the `getFeatureId` option),
	// re-symbolizes that feature across all tiles it appears in.
	setFeatureStyle: function(id, layerStyle) {
		this._overriddenStyles[id] = layerStyle;

		for (var tileKey in this._vectorTiles) {
			var tile = this._vectorTiles[tileKey];
			var features = tile._symbols;
			var data = features[id];
			if (data) {
				var feat = data.feature;

				var styleOptions = layerStyle;
				if (layerStyle[data.themeName]) {
					styleOptions = layerStyle[data.themeName];
				}

				this._updateStyles(feat, tile, styleOptions);
			}
		}
		return this;
	},

	// 🍂method setFeatureStyle(id: Number): this
	// Reverts the effects of a previous `setFeatureStyle` call.
	resetFeatureStyle: function(id) {
		delete this._overriddenStyles[id];

		for (var tileKey in this._vectorTiles) {
			var tile = this._vectorTiles[tileKey];
			var features = tile._symbols;
			var data = features[id];
			if (data) {
				var feat = data.feature;
				var styleOptions = this.options.vectorTileLayerStyles[ data.themeName ] ||
				L.Path.prototype.options;
				this._updateStyles(feat, tile, styleOptions);
			}
		}
		return this;
	},

	// 🍂method getDataLayerNames(): Array
	// Returns an array of strings, with all the known names of data layers in
	// the vector tiles displayed. Useful for introspection.
	getDataLayerNames: function() {
		return Object.keys(this._dataLayerNames);
	},

	_updateStyles: function(feat, renderer, styleOptions) {
		styleOptions = (styleOptions instanceof Function) ?
			styleOptions(feat.properties, renderer.getCoord().z) :
			styleOptions;

		if (!(styleOptions instanceof Array)) {
			styleOptions = [styleOptions];
		}

		for (var j = 0; j < styleOptions.length; j++) {
			var style = L.extend({}, L.Path.prototype.options, styleOptions[j]);
			feat.updateStyle(renderer, style);
		}
	},

	_defaultGetFeatureSymbolizers: function(themeName, properties, zoomLevel, geometryDimension) {

		const themeStyle = this.options.vectorTileLayerStyles[ themeName ] ||
		                 L.Path.prototype.options;

		if (themeStyle instanceof Function) {
			// Style is dynamic depending on each feature in this theme

			return new FunctionalSymbolizer(themeStyle, zoomLevel)

		} else {
			let symbolizerConstructor;

			// Style is static for all features in this theme
			if (geometryDimension === 1) {
				symbolizerConstructor = CircleSymbolizer;
			} else if (geometryDimension === 2){
				symbolizerConstructor = LineSymbolizer;
			} else if (geometryDimension === 3) {
				symbolizerConstructor = PolygonSymbolizer;
			} else {
				throw new Error("Vector tile feature has a non-valid dimension (1 for point, 2 for line, 3 for polygon)");
			}

			if (!(themeStyle instanceof Array)) {
				themeStyle = [themeStyle];
			}

			if (!themeStyle.length) {
				// Return a null symbolizer - calls to render() and addLayers()
				// will do nothing.
				return new Symbolizer();
			}

			return new symbolizerConstructor(themeStyle);
		}

	},

// 	// Default symbolizer function - given a VTFeature,
// 	_createLayer: function(feat, pxPerExtent) {
// 		var layer;
// 		switch (feat.type) {
// 		case 1:
// 			layer = new PointSymbolizer(feat, pxPerExtent);
// 			break;
// 		case 2:
// 			layer = new LineSymbolizer(feat, pxPerExtent);
// 			break;
// 		case 3:
// 			layer = new FillSymbolizer(feat, pxPerExtent);
// 			break;
// 		}
//
// 		if (this.options.interactive) {
// 			layer.addEventParent(this);
// 		}
//
// 		return layer;
// 	},
});

/*
 * 🍂section Extension methods
 *
 * Classes inheriting from `VectorGrid` **must** define the `_getVectorTilePromise` private method.
 *
 * 🍂method getVectorTilePromise(coords: Object): Promise
 * Given a `coords` object in the form of `{x: Number, y: Number, z: Number}`,
 * this function must return a `Promise` for a vector tile.
 *
 */
L.vectorGrid = function (options) {
	return new L.VectorGrid(options);
};

