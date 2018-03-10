import { VTSymbol } from './VTSymbol.js'
import { VTPolybase } from './VTPolybase.js'

// 🍂class VTPolygon
// 🍂inherits Polyline
// 🍂inherits VTSymbol
// A symbolizer for filled areas. Applies only to polygon features.

export const VTPolygon = L.Polygon.extend({
	includes: [VTSymbol.prototype, PolyBase],

	initialize: function(feature, pxPerExtent) {
		this.properties = feature.properties;
		this._makeFeatureParts(feature, pxPerExtent);
	},

	render: function(renderer, style) {
		VTSymbol.prototype.render.call(this, renderer, style);
		this._updatePath();
	}
});
