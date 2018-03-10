
// Aux file to bundle everything together

import {} from './Leaflet.VectorGrid.js';
import {} from './Leaflet.VectorGrid.Protobuf.js';
import {} from './Leaflet.VectorGrid.Slicer.js';
import {} from './Leaflet.Renderer.Canvas.Tile.js';
import {} from './Leaflet.Renderer.SVG.Tile.js';

import CircleSymbolizer  from './Symbolizer.Circle.js';
import LineSymbolizer  from './Symbolizer.Line.js';
import PolygonSymbolizer from './Symbolizer.Polygon.js';
import FunctionalSymbolizer from './Symbolizer.Functional.js';

L.VectorGrid.CircleSymbolizer = CircleSymbolizer;
L.VectorGrid.LineSymbolizer = LineSymbolizer;
L.VectorGrid.PolygonSymbolizer = PolygonSymbolizer;
L.VectorGrid.FunctionalSymbolizer = FunctionalSymbolizer;
