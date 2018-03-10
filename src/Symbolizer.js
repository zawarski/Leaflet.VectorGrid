

// 🍂class Symbolizer
// 🍂inherits Class
//
// A `Symbolizer` provides a way to convert a `vector-tile` feature
// into zero or more `VTSymbol`s and zero or more `L.Layer`s.
//
// This is important for the `getFeatureSymbolizer` option of `VectorGrid`:
// The return value of that function must always be a `Symbolizer.`
//
// `Symbolizer`s should be created just once, and reused through
// features that should look the same.
//
// The base `Symbolizer` renders nothing (creates zero `VTSymbol`s, and
// zero `L.Layer`s for any input feature).
//
// 🍂example
//
// var myCircleSymbolizer = new L.VectorGrid.CircleSymbolizer([circleOptions]);
// var redLineSymbolizer = new L.VectorGrid.LineSymbolizer([{ color: 'red' }]);
// var blueLineSymbolizer = new L.VectorGrid.LineSymbolizer([{ color: 'blue' }]);
//
// var grid = L.vectorGrid.slicer( geoJsonData, {
// 	getFeatureSymbolizer: function(
// 		themeName, properties, zoom, geometryDimension
// 	) {
//
// 		if (geometryDimension === 1) {
// 			// Geometry dimension 1 means "Point"
// 			return myCircleSymbolizer;
// 		}
//
// 		// For lines and polygons, use red lines or blue lines depending on
// 		// e.g. a feature property.
// 		if (properties.something > 0) {
// 			return redLineSymbolizer;
// 		} else {
// 			return blueLineSymbolizer;
// 		}
// 	}
// } ).addTo(Map);
//
//


const Symbolizer = L.Class.extend({

	// Renders/symbolizes the given vector tile feature into the given renderer with
	// the given pxPerExtent ratio. This is called once per vector tile feature.
	// How to render the feature in the renderer (circle, line, polygon)
	// is up to each concrete subclass.
	// All subclasses might provide their own implementation. It's OK for a
	// symbolizer to not render anything.
	render: function(vtFeature, pxPerExtent, renderer) {},

	// Adds zero or more `L.Layer`s to the given layergroup.
	// All subclasses might provide their own implementation. It's OK for a
	// symbolizer to not add any layers.
	addLayers: function(vtFeature, layergroup) {},

	// Utility. Renders the given VTSymbol into the given renderer,
	// reassigning the given styles to the VTSymbol and rendering
	// each style just once.
	_renderSymbolWithStyles: function(vtSymbol, renderer, styles) {
		for (let i = 0, l= styles.length ; i < l; i++) {
			vtSymbol.render(renderer, styles[i]);
			renderer._addPath(vtSymbol);
		}
	},

	// Given an `Array` of `L.Path` styles, return an array of `L.Path` styles,
	// each of which includes all the defaults.
	_extendStylesWithDefaults(styles) {
		return styles.map((style)=>L.extend({}, L.Path.prototype.options, style));
	}

});

export default Symbolizer
