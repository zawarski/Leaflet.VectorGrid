




// Returns a function that returns the literal argument. Pretty much a classic
// closure.
function returnLiteral(val){
	return function retLiteral(/* props, zoom */){ return val; };
}

// Given an array of functions, returns a function that returns mapping that array to the parameters.
function returnArray(arr) {
	return function retArray(props, zoom) {
		return arr.map(function(el) {
			return el(props, zoom);
		}).filter(function(el) {
			return (el !== undefined);
		});
	}
}

// Returns a function that filters the feature based on whether a property is in
// a list of valid values or not
function inFilter(style, args) {
	var attr = args[1];
	var valid = args.slice(2);

	return function filterIn(props, zoom) {
		if (valid.indexOf(props[attr]) !== -1) {
			return style
		} else {
			return undefined;
		}
	};
}

// Returns a function that filters the feature based on whether a property is in
// a list of valid values or not
function equalFilter(style, args) {
	var attr = args[1];
	var target = args[2];

	return function filterEq(props, zoom) {
		if (props[attr] == target) {
			return style
		} else {
			return undefined;
		}
	};
}

function unequalFilter(style, args) {
	var attr = args[1];
	var target = args[2];

	return function filterUneq(props, zoom) {
		if (props[attr] != target) {
			return style
		} else {
			return undefined;
		}
	};
}

function greaterFilter(style, args) {
	var attr = args[1];
	var target = args[2];

	return function filterGreater(props, zoom) {
		if (props[attr] > target) {
			return style
		} else {
			return undefined;
		}
	};
}

function lessThanFilter(style, args) {
	var attr = args[1];
	var target = args[2];

	return function filterLessThan(props, zoom) {
		if (props[attr] < target) {
			return style
		} else {
			return undefined;
		}
	};
}

function greaterOrEqualFilter(style, args) {
	var attr = args[1];
	var target = args[2];

	return function filterGreater(props, zoom) {
		if (props[attr] >= target) {
			return style
		} else {
			return undefined;
		}
	};
}

// function allFilter(style, args) {
// 	var attr = args[1];
// 	var target = args[2];
//
// 	return function filterAll(props, zoom) {
// 		if (props[attr] <= target) {
// 			return style
// 		} else {
// 			return undefined;
// 		}
// 	};
// }



// Given a set of sets of `L.Path` options, each set including a `filter` property
// in mapbox filter array format, return an executable JS function
// that will take a feature and a zoom level, and return the style(s) applicable.

// See https://www.mapbox.com/mapbox-gl-style-spec/#types-filter
export default function mapboxFilterToFunc(styles) {

	var outStyles=[];

	for (var i=0; i<styles.length; i++) {

		if (styles[i].filter) {

			if (styles[i].filter[0] === 'in') {
				outStyles.push(inFilter(styles[i], styles[i].filter));
// 				console.info('Handled filter', styles[i].filter );
			} else if (styles[i].filter[0] === '==') {
				outStyles.push(equalFilter(styles[i], styles[i].filter));
// 				console.info('Handled filter', styles[i].filter );
			} else if (styles[i].filter[0] === '!=') {
				outStyles.push(unequalFilter(styles[i], styles[i].filter));
			} else if (styles[i].filter[0] === '>') {
				outStyles.push(greaterFilter(styles[i], styles[i].filter));
			} else if (styles[i].filter[0] === '<') {
				outStyles.push(lessThanFilter(styles[i], styles[i].filter));
			} else if (styles[i].filter[0] === '>=') {
				outStyles.push(greaterOrEqualFilter(styles[i], styles[i].filter));
			} else if (styles[i].filter[0] === '<=') {
				outStyles.push(lessThanOrEqualFilter(styles[i], styles[i].filter));
// 			} else if (styles[i].filter[0] === 'all') {
// 				outStyles.push(allFilter(styles[i], styles[i].filter));
			} else {
				console.warn('Unknown or unhandled filter', styles[i].filter[0]);
			}

		} else {
			// This style always applies to the src layer
			outStyles.push(returnLiteral(styles[i]));
		}

	}

	return returnArray(outStyles);
}



