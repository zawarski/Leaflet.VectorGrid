import  VTSymbol  from './VTSymbol.Symbol.js'
import  VTPolybase from './VTSymbol.Polybase.js'

// 🍂class VTPolygon
// 🍂inherits Polyline
// 🍂inherits VTSymbol
// A symbolizer for filled areas. Applies only to polygon features.

const VTPolygon = L.Polygon.extend({
	includes: [VTSymbol.prototype, VTPolybase],

	initialize: function(feature, pxPerExtent) {
		this.properties = feature.properties;
		this._makeFeatureParts(feature, pxPerExtent);
	},

	render: function(renderer, style) {
		VTSymbol.prototype.render.call(this, renderer, style);
		this._updatePath();
	}
});

export default VTPolygon
