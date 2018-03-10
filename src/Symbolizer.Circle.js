import  VTCircle  from './VTSymbol.Circle.js'
import  Symbolizer  from './Symbolizer.js'


// 🍂class CircleSymbolizer
// 🍂inherits Symbolizer
//
// A `CircleSymbolizer` converts `vector-tile` features into `VTCircle`s.

// 🍂factory L.vectorGrid.circleSymbolizer(styles: Array)
// Creates a new Circle Symbolizer. The only parameter is an array of style
// objects, as per `L.Circle`.


const CircleSymbolizer = Symbolizer.extend({

	initialize: function(circleStyles) {
		this._circleStyles = this._extendStylesWithDefaults(circleStyles);
	},

	// The render function for CircleSymbolizers does not need
	// to handle the layergroup.
	render: function(vtFeature, pxPerExtent, renderer) {
		const symbol = new VTCircle(vtFeature, pxPerExtent);

		/// TODO: run addEventParent here somehow!!!

		this._renderSymbolWithStyles(symbol, renderer, this._circleStyles);

		/// TODO: run addEventParent here somehow!!!
	}

});

export default CircleSymbolizer
