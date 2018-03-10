import VTPolygon  from './VTSymbol.Polygon.js'
import Symbolizer  from './Symbolizer.js'

const CircleSymbolizer = Symbolizer.extend({

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
