
// 🍂class VTSymbol
// 🍂inherits Class
// The abstract VTSymbol class is mostly equivalent in concept to a `L.Path` - it's an interface for
// polylines, polygons and circles. But instead of representing leaflet Layers,
// it represents things that have to be drawn inside a vector tile. Instead
// of dealing with coordinates relative to the map's CRS, it deals with
// coordinates within a vector tile

// A vector tile *theme layer* might have zero, one, or more *vectorTileLayerStyles* or one *symbolizer function*
// A vector tile *feature* might be symbolized as zero, one, or more *symbols*.
// The actual symbolizers applied will depend on filters and the symbolizer functions or the vectorTileLayerStyles options.

const VTSymbol = L.Class.extend({
	// 🍂method initialize(feature: VTFeature, pxPerExtent: Number)
	// Initializes a new VTSymbol given a GeoJSON feature and the
	// pixel-to-coordinate-units ratio. Internal use only.

	// 🍂method render(renderer, style)
	// Renders this symbolizer in the given tiled renderer, with the given
	// `L.Path` options.  Internal use only.
	render: function(renderer, style) {
		this._renderer = renderer;
		this.options = style;
		renderer._initPath(this);
		renderer._updateStyle(this);
	},

	// 🍂method render(renderer, style)
	// Updates the `L.Path` options used to style this symbolizer, and re-renders it.
	// Internal use only.
	updateStyle: function(renderer, style) {
		this.options = style;
		renderer._updateStyle(this);
	},

	_getPixelBounds: function() {
		var parts = this._parts;
		var bounds = L.bounds([]);
		for (var i = 0; i < parts.length; i++) {
			var part = parts[i];
			for (var j = 0; j < part.length; j++) {
				bounds.extend(part[j]);
			}
		}

		var w = this._clickTolerance(),
		    p = new L.Point(w, w);

		bounds.min._subtract(p);
		bounds.max._add(p);

		return bounds;
	},
	_clickTolerance: L.Path.prototype._clickTolerance,
});

export default VTSymbol;
