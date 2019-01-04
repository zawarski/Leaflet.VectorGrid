import reactzlibjs from "react-zlib-js";
import {Buffer} from 'buffer';

L.TileLayer.MBTiles = L.TileLayer.extend({

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
			if (row.value && row.value === 'png') {
				this._format = 'image/png'
			} else if (row.value && row.value === 'jpg') {
				this._format = 'image/jpg'
			} else {
				// Fall back to PNG, hope it works.
				this._format = 'image/png'
			}
			this.fire('databaseloaded');
			this._databaseIsLoaded = true;
		} catch (ex) {
			this.fire('databaseerror', {error: ex});
		}
	},

	createTile: function (coords, done) {
		var tile = document.createElement('img');

		if (this.options.crossOrigin) {
			tile.crossOrigin = '';
		}

		tile.alt = '';

		tile.setAttribute('role', 'presentation');

		// In TileLayer.MBTiles, the getTileUrl() method can only be called when
		// the database has already been loaded.
		if (this._databaseIsLoaded) {
			L.DomEvent.on(tile, 'load', L.bind(this._tileOnLoad, this, done, tile));
			L.DomEvent.on(tile, 'error', L.bind(this._tileOnError, this, done, tile));

			tile.src = this.getTileUrl(coords);
		} else {
			this.on('databaseloaded', function(){
				L.DomEvent.on(tile, 'load', L.bind(this._tileOnLoad, this, done, tile));
				L.DomEvent.on(tile, 'error', L.bind(this._tileOnError, this, done, tile));
				tile.src = this.getTileUrl(coords);
			}.bind(this));
		}

		return tile;
	},

	_getCompression: function(buffer) {
		if (buffer[0] === 0x78 && buffer[1] === 0x9c) return "deflate";
		if (buffer[0] === 0x1f && buffer[1] === 0x8b) return "gzip";
		return null;
	},

	getTileUrl: function (coords) {
		// Luckily, SQL execution is synchronous. If not, this code would get
		// much more complicated.
		var row = this._stmt.getAsObject({
			':x': coords.x,
			':y': this._globalTileRange.max.y - coords.y,
			':z': coords.z
		});

		if ('tile_data' in row) {
			var raw = row.tile_data;
			var buf = new Buffer(row.tile_data);
			switch (this._getCompression(row.tile_data)) {
				case "deflate":
					raw = reactzlibjs.inflateSync(buf);
					break;
				case "gzip":
					raw = reactzlibjs.gunzipSync(buf);
					break;
			}
			return window.URL.createObjectURL(new Blob([raw] , {type: 'application/x-protobuf'}));
		} else {
			return L.Util.emptyImageUrl;
		}
	}

});

L.tileLayer.mbTiles = function(databaseUrl, options) {
	return new L.TileLayer.MBTiles(databaseUrl, options);
};






