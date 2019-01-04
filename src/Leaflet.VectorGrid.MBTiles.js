import Pbf from 'pbf';
import {VectorTile} from 'vector-tile';
import reactzlibjs from "react-zlib-js";
import {Buffer} from 'buffer';

L.VectorGrid.MBTiles = L.VectorGrid.extend({

	initialize: function (databaseUrl, options) {
		this._databaseIsLoaded = false;
		if (typeof databaseUrl === 'string') {
			fetch(databaseUrl).then(function (response) {
				return response.arrayBuffer();
			}).then(function (buffer) {
				this._openDB(buffer);
			}.bind(this)).catch(function (error) {
				this.fire('databaseerror', {error: error});
			})
		} else if (databaseUrl instanceof ArrayBuffer) {
			this._openDB(databaseUrl);
		} else {
			this.fire('databaseerror');
		}
		L.VectorGrid.prototype.initialize.call(this, options);
	},

	_openDB: function (buffer) {
		try {
			/// This assumes the `SQL` global variable to exist!!
			this._db = new SQL.Database(new Uint8Array(buffer));
			this._stmt = this._db.prepare('SELECT tile_data FROM tiles WHERE zoom_level = :z AND tile_column = :x AND tile_row = :y');

			// Load some metadata (or at least try to)
			var metaStmt = this._db.prepare('SELECT value FROM metadata WHERE name = :key');
			var row = metaStmt.getAsObject({':key': 'attribution'});
			if (row.value) {
				this.options.attribution = row.value;
			}
			row = metaStmt.getAsObject({':key': 'minzoom'});
			if (row.value) {
				this.options.minNativeZoom = Number(row.value);
			}
			row = metaStmt.getAsObject({':key': 'maxzoom'});
			if (row.value) {
				this.options.maxNativeZoom = Number(row.value);
			}
			row = metaStmt.getAsObject({':key': 'format'});
			if (row.value && row.value === 'pbf') {
				this._format = 'application/x-protobuf'
			}
			this.fire('databaseloaded');
			this._databaseIsLoaded = true;
		} catch (ex) {
			this.fire('databaseerror', {error: ex});
		}
	},

	setUrl: function (url, noRedraw) {
		console.log('seturl called');
		this._url = url;
		if (!noRedraw) {
			this.redraw();
		}
		return this;
	},

	_getSubdomain: L.TileLayer.prototype._getSubdomain,

	_isCurrentTile: function (coords, tileBounds) {
		if (!this._map) {
			return true;
		}
		var tileBounds = this._tileCoordsToBounds(coords);
		var currentBounds = this._map.getBounds().overlaps(tileBounds);
		return currentBounds;

	},

	clampZoom: function(zoom) {
		var minDetailZoom = this.options.minDetailZoom;
		var maxDetailZoom = this.options.maxDetailZoom;
		if (undefined !== minDetailZoom && zoom < minDetailZoom) {
			return minDetailZoom;
		}
		if (undefined !== maxDetailZoom && maxDetailZoom < zoom) {
			return maxDetailZoom;
		}
		return zoom;
	},

	getZoomForUrl: function(zoom) {
		var maxZoom = this.options.maxZoom;
		var zoomReverse = this.options.zoomReverse;
		var zoomOffset = this.options.zoomOffset;
		if (zoomReverse) {
			zoom = maxZoom - zoom;
		}
		return clampZoom(zoom + zoomOffset);
	},

	_getCompression: function(buffer) {
		if (buffer[0] === 0x78 && buffer[1] === 0x9c) return "deflate";
		if (buffer[0] === 0x1f && buffer[1] === 0x8b) return "gzip";
		return null;
	},

	_getVectorTilePromise: function (coords, tileBounds) {

		return new Promise(function (resolve, reject) {
			try {
				if (this._stmt) {
					var invertedY = this._globalTileRange.max.y - coords.y;
					if (!this._isCurrentTile(coords, tileBounds)) {
						return resolve({layers:[]});
					}
					coords.y = this._globalTileRange.max.y - coords.y;
					var row = this._stmt.getAsObject({
						':x': coords.x,
						':y': coords.y,
						':z': coords.z
					});
					if (this._map && !this._map.options.crs.infinite) {
						var invertedY = this._globalTileRange.max.y - coords.y;
						if (this.options.tms) { // Should this option be available in Leaflet.VectorGrid?
							row['y'] = invertedY;
						}
						row['-y'] = invertedY;
					}
					if ('tile_data' in row) {
						var raw = row.tile_data;
						var buf = new Buffer(row.tile_data);
						switch (this._getCompression(row.tile_data)) {
							case "deflate":
								raw = reactzlibjs.inflateSync(buf);
								resolve(raw);
								break;
							case "gzip":
								raw = reactzlibjs.gunzipSync(buf);
								resolve(raw);
								break;
							default:
								resolve(raw);
						}
					} else {
						return resolve({layers:[]});
					}
				}
			} catch (error) {
				reject(error);
			}
		}.bind(this)).then(function (response) {
			return new VectorTile(new Pbf(response));
		}.bind(this)).then(function (json) {
			// Normalize feature getters into actual instanced features
			for (var layerName in json.layers) {
				var feats = [];
				for (var i = 0; i < json.layers[layerName].length; i++) {
					var feat = json.layers[layerName].feature(i);
					feat.geometry = feat.loadGeometry();
					feats.push(feat);
				}
				json.layers[layerName].features = feats;
			}
			return json;
		});
	}
});

L.vectorGrid.mbtiles = function (url, options) {
	return new L.VectorGrid.MBTiles(url, options);
};
