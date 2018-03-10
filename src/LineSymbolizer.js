import { VTPolyline } from './VTPolyline.js'
import { Symbolizer } from './Symbolizer.js'

export default const LineSymbolizer = Symbolizer.extend({

	initialize: function(lineStyles) {
		this._lineStyles = this._extendStylesWithDefaults(lineStyles);
	}

	// The render function for LineSymbolizers does not need
	// to handle the layergroup.
	render: function(vtFeature, pxPerExtent, renderer) {
		const symbol = new VTPolyLine(vtFeature, pxPerExtent);

		/// TODO: run addEventParent here somehow!!!

		this._renderSymbolWithStyles(symbol, renderer, this._lineStyles);

		/// TODO: run addEventParent here somehow!!!
	}

});
