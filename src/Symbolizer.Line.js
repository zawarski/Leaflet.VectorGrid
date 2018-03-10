
import VTPolybase  from './VTSymbol.Polyline.js'
import Symbolizer  from './Symbolizer.js'

// 🍂class LineSymbolizer
// 🍂inherits Symbolizer
//
// A `LineSymbolizer` converts `vector-tile` features into `VTPolyline`s.

// 🍂factory L.vectorGrid.lineSymbolizer(styles: Array)
// Creates a new Line Symbolizer. The only parameter is an array of style
// objects, as per `L.Polyline`.

const LineSymbolizer = Symbolizer.extend({

	initialize: function(lineStyles) {
		this._lineStyles = this._extendStylesWithDefaults(lineStyles);
	},

	// The render function for LineSymbolizers does not need
	// to handle the layergroup.
	render: function(vtFeature, pxPerExtent, renderer) {
		const symbol = new VTPolyLine(vtFeature, pxPerExtent);

		/// TODO: run addEventParent here somehow!!!

		this._renderSymbolWithStyles(symbol, renderer, this._lineStyles);

		/// TODO: run addEventParent here somehow!!!
	}

});

export default LineSymbolizer
