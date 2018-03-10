import  VTSymbol from './VTSymbol.Symbol.js'
import VTPolybase from './VTSymbol.Polybase.js'

// 🍂class VTPolyline
// 🍂inherits Polyline
// 🍂inherits VTSymbol
// A symbolizer for lines. Can be applied to line and polygon features.

const VTPolyline = L.Polyline.extend({
	includes: [VTSymbol.prototype, VTPolybase],

	initialize: function(feature, pxPerExtent) {
		this.properties = feature.properties;
		this._makeFeatureParts(feature, pxPerExtent);
	},

	render: function(renderer, style) {
		style.fill = false;
		VTSymbol.prototype.render.call(this, renderer, style);
		this._updatePath();
	},

	updateStyle: function(renderer, style) {
		style.fill = false;
		VTSymbol.prototype.updateStyle.call(this, renderer, style);
	},
});

export default VTPolyline
