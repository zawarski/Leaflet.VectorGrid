import VTPolygon  from './VTSymbol.Polygon.js'
import Symbolizer  from './Symbolizer.js'

// 🍂class PolygonSymbolizer
// 🍂inherits Symbolizer
//
// A `PolygonSymbolizer` converts `vector-tile` features into `VTPolygon`s.

// 🍂factory L.vectorGrid.polygonSymbolizer(styles: Array)
// Creates a new Polygon Symbolizer. The only parameter is an array of style
// objects, as per `L.Polygon`.

const PolygonSymbolizer = Symbolizer.extend({

	initialize: function(polygonStyles) {
		this._polygonStyles = this._extendStylesWithDefaults(polygonStyles);
	},

	// The render function for PolygonSymbolizers does not need
	// to handle the layergroup.
	render: function(vtFeature, pxPerExtent, renderer) {
		const symbol = new VTPolygon(vtFeature, pxPerExtent);

		/// TODO: run addEventParent here somehow!!!

		this._renderSymbolWithStyles(symbol, renderer, this._polygonStyles);

		/// TODO: run addEventParent here somehow!!!
	}

});

export default CircleSymbolizer
