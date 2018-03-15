'use strict';

angular.module('filters.removeEntersFilter', [])

.filter('removeEntersFilter', function() {
	return function(text) {
		return text ? text.replace('<p>', '').replace('</p>', '').replace('<span>', '').replace('</span>', '') : '';
	};
});