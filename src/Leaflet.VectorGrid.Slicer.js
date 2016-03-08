


// geojson-vt powered!
// NOTE: Assumes the global `geojsonvt` exists!!!
L.VectorGrid.Slicer = L.VectorGrid.extend({

	options: {
		vectorTileLayerName: 'sliced',
		extent: 4096	// Default for geojson-vt
	},

	initialize: function(geojson, options) {
		L.VectorGrid.prototype.initialize.call(this, options);

		// Inherits available options from geojson-vt!
		this._slicer = geojsonvt(geojson, this.options);
	},

	_getVectorTilePromise: function(coords) {
		var slicedTile = this._slicer.getTile(coords.z, coords.x, coords.y);

		if (!slicedTile) { return new Promise(function(resolve){ return resolve({ layers: [] }); }); }

		var vectorTileLayer = {
			features: [],
			extent: this.options.extent,
			name: this.options.vectorTileLayerName,
			length: slicedTile.features.length
		}

		for (var i in slicedTile.features) {
			var feat = {
				geometry: slicedTile.features[i].geometry,
				properties: slicedTile.features[i].tags,
				type: slicedTile.features[i].type	// 1 = point, 2 = line, 3 = polygon
			}
			vectorTileLayer.features.push(feat);
		}

		// Normalize a layer name so this looks more like a binary VectorTile
		var layers = {};
		layers[this.options.vectorTileLayerName] = vectorTileLayer;

		return new Promise(function(resolve){ return resolve({ layers: layers })});
	},

});



L.vectorGrid.slicer = function (geojson, options) {
	return new L.VectorGrid.Slicer(geojson, options);
};



