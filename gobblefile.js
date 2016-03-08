

var gobble = require('gobble');

var concatenatedJs = gobble('src').transform('concat', {
	dest: 'Leaflet.VectorGrid.js',
	files: [
		'Leaflet.Renderer.SVG.Tile.js',
		'Leaflet.Renderer.Canvas.Tile.js',
		'Leaflet.VectorGrid.js',
		'Leaflet.VectorGrid.Slicer.js',
		'Leaflet.VectorGrid.Protobuf.js'
	]
});


module.exports = gobble([
	concatenatedJs,
	concatenatedJs.transform('uglifyjs', { ext: '.min.js' })
]);

