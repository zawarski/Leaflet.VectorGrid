

// 🍂class Background
// 🍂inherits Layer

// Changes the background CSS style of the map, but acts as a layer
// that can be switched on and off.

L.Background = L.Layer.extend({


	initialize: function(style) {
		console.log('Background: ', style);
		this._style = style;
	},

    onAdd: function(map) {
		this._map = map;

		if (!map._backgroundColourStack) {
			map._backgroundColourStack = {};
		}

		map._backgroundColourStack[ L.stamp(this) ] = this._style;

		this._enableStyle(this._style);
    },

    onRemove: function(map) {
		delete this._map._backgroundColourStack[ L.stamp(this) ];

		this._map.getContainer().style.background = '';	// Reset style attrib, rely back again on CSS.
		this._map.off('zoomend load', this._updateColour, this);

		// While there *should* be one background definition on the
		// mapbox stylesheets, we cannot be sure of that. Or users might enable two
		// mapbox stylesheets at the same time. Or stuff like that.
		// So that's why we check if there are more instances of `Background` in
		// this map.
		var i = Object.keys(this._map._backgroundColourStack)[0];
		if (i) {
			this._enableStyle(this._map._backgroundColourStack[i])
		}
	},

	// Used for enabling this background's style, or for popping another background
	// colour/fn.
    _enableStyle: function(style) {
		if (typeof style === 'string') {
			this._map.getContainer().style.background = this._style;
		} else if (typeof style === 'function') {
			this._map.on('zoomend load', this._updateColour, this);
		}
	},

	_updateColour: function() {
		this._map.getContainer().style.background = this._style(undefined, this._map.getZoom()).background;
	}

});


// 🍂factory background(style: String)
// Instantiate a new map `Background` with the given CSS colour string.

// 🍂factory background(styleFn: Function)
// Instantiate a new map `Background` with the given zoom-to-CSS-colour function.
// The function passed must be of the form `function(undefined, zoom){}` and
// must return an object with a `background` property.
L.background = function(style) {
	return new L.Background(style);
}

