import { VTSymbol } from './VTSymbol.js'
import { VTPolybase } from './VTPolybase.js'

// 🍂class VTPolyline
// 🍂inherits Polyline
// 🍂inherits VTSymbol
// A symbolizer for lines. Can be applied to line and polygon features.

export const VTPolyline = L.Polyline.extend({
	includes: [VTSymbol.prototype, PolyBase],

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

