import { VTCircle } from './VTCircle.js'
import { Symbolizer } from './Symbolizer.js'

export default const CircleSymbolizer = Symbolizer.extend({

	initialize: function(circleStyles) {
		this._circleStyles = this._extendStylesWithDefaults(circleStyles);
	}

	// The render function for CircleSymbolizers does not need
	// to handle the layergroup.
	render: function(vtFeature, pxPerExtent, renderer) {
		const symbol = new VTCircle(vtFeature, pxPerExtent);

		/// TODO: run addEventParent here somehow!!!

		this._renderSymbolWithStyles(symbol, renderer, this._circleStyles);

		/// TODO: run addEventParent here somehow!!!
	}

});
