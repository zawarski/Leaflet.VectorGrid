

import {} from './Leaflet.VectorGrid.Protobuf';

import mapboxFilterToFunc from './mapboxFilters';

L.LayerGroup.Mapbox = L.LayerGroup.extend({
	initialize: function(url, token, options) {

		L.LayerGroup.prototype.initialize.call(this);

		this._url = url;
		this._token = token;
		options = options || {};

		// URL is like mapbox://styles/mapbox/dark-v9
		// Request is like https://api.mapbox.com/styles/v1/mapbox/dark-v9?access_token=((token))

		if (url.match(/^mapbox:\/\/styles\//)) {
			url = url.replace('mapbox://styles/', 'https://api.mapbox.com/styles/v1/');
			url += '?&access_token=' + this._token;
		}

		fetch(url)
		.then(function(response){ return response.json() })
		.then(function(style){
// 			console.log(style);

			// Convert the mapbox style def into one (or several) VectorGrid style defs
			var vectorStyles = {};
			var i, j, src, srclyr;

			for (i in style.layers) {
				var layer = style.layers[i];
				var id = layer.id;
				src = layer.source;
				srclyr = layer['source-layer'];
				var opts;
				var invisible = false;

				vectorStyles[src] = vectorStyles[src] || {};
				vectorStyles[src][srclyr] = vectorStyles[src][srclyr] || [];
				layer.paint = layer.paint || {};
				layer.layout = layer.layout || {};

				if (layer.layout && layer.layout.visibility === 'none') {
					invisible = true;
				}

				if (layer.type === 'fill') {
					opts = {
						fillColor:   layer.paint['fill-color']   || '#000000',
						fillOpacity: layer.paint['fill-opacity'] || 1,
						fill:      !!layer.paint['fill-opacity'],
						color:       layer.paint['fill-outline-color'],
						opacity:     layer.paint['fill-outline-color'] ? (layer.paint['fill-opacity'] || 1) : 0,
						weight:      layer.paint['fill-outline-color'] ? 1 : 0,
						stroke:      layer.paint['fill-outline-color'] ? true : false,
					}
// 					opts = [];
				} else if (layer.type === 'line') {
					opts = {
						lineCap:  layer.layout['line-cap']  || 'butt',
						lineJoin: layer.layout['line-join'] || 'miter',
						color:    layer.paint['line-color'] || 1,
						opacity:  layer.paint['line-opacity'] || 1,
						weight:   layer.paint['line-width'] || 1,
						stroke: !!layer.paint['line-opacity'],
					}

					if (!(opts.weight instanceof Number)) {
						opts.weight = 3;
					}
					if (!(opts.opacity instanceof Number)) {
						opts.opacity = 1;
					}
					if (!(opts.color instanceof String)) {
						opts.color = 'black';
					}

// 					console.log(srclyr, opts, layer);
				} else if (layer.type === 'raster') {
					opts = {
						opacity:  layer.paint['raster-opacity'] || 1,
					}
				}
				/// TODO: Background, circle, symbol (marker), extrusion (fallback to fill)

				if (layer.filter) {
					opts.filter = layer.filter;
				}

				if (!invisible && opts) {
					vectorStyles[src][srclyr].push(opts);
				}
			}

			// Do any of the source layers have any filters? If so, replace the
			// array of options with a function.

			for (src in vectorStyles) {
				for (srclyr in vectorStyles[src]) {

					var hasFilter = false;
					var lyropts = vectorStyles[src][srclyr];

					for (i=0; i<lyropts.length; i++) {
						if (lyropts[i].filter) {
							hasFilter = true;
						}
					}

					if (hasFilter) {
						console.log('Source ', src, ', layer ', srclyr, ' with options ', lyropts, ' has filter(s)');
						vectorStyles[src][srclyr] = mapboxFilterToFunc(lyropts);
					}
				}
			}

			for (j in style.sources) {

				var type = style.sources[j].type;

				if (type === 'vector') {
					this._addProtobuf(
						style.sources[j].url,
						L.extend(options, {vectorTileLayerStyles: vectorStyles[j]})
					);
				}
				if (type === 'raster') {
					this._addRaster(style.sources[j].url, vectorStyles[j]);
				}
				/// TODO: image, geojson
			}
		}.bind(this));
	},


	_addProtobuf: function(url, options) {
		// URL is like mapbox://mapbox.mapbox-terrain-v2,mapbox.mapbox-streets-v7

		// Request is like https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2,mapbox.mapbox-streets-v7.json?secure&access_token=((token))

		if (url.match(/^mapbox:\/\//)) {
			url = url.replace('mapbox://', 'https://api.mapbox.com/v4/');
			url += '.json?secure&access_token=' + this._token;

			fetch(url)
			.then(function(response){return response.json()})
			.then(function(json){
				if (Array.isArray(json.tiles)) {
					json.tiles = json.tiles[0];
				}
				options.attribution = json.attribution;
				options.rendererFactory = L.canvas.tile,

				L.vectorGrid.protobuf(json.tiles, options).addTo(this);
			}.bind(this));
		}

	},

	_addRaster: function(url, options) {
		// URL is like mapbox://mapbox.satellite

		// Request is https://api.mapbox.com/v4/mapbox.satellite.json?secure&access_token=((token))
		if (url.match(/^mapbox:\/\//)) {
			url = url.replace('mapbox://', 'https://api.mapbox.com/v4/');
			url += '.json?secure&access_token=' + this._token;

			fetch(url)
			.then(function(response){return response.json()})
			.then(function(json){
				if (Array.isArray(json.tiles)) {
					json.tiles = json.tiles[0];
				}
				options.attribution = json.attribution;

				L.tileLayer(json.tiles, options).addTo(this);
			}.bind(this));
		}
	},

// 	_addImageOverlay: function(url, options) {
//
// 	}


});





L.layerGroup.mapbox = function(url, token, opts) {
	return new L.LayerGroup.Mapbox(url, token, opts);
};


