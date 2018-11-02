'use strict';

angular.module('filters.replace', [])

.filter('replaceSpaceToDash', function () {
	return function (input) {
		if(input === undefined) {
			return;
		}
		return input.replace(/ /g, '-');
	};
})

.filter('replaceDashToSpace', function () {
	return function (input) {
		if(input === undefined) {
			return;
		}
		return input.replace('-', ' ');
	};
});