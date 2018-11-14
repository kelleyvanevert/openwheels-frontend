'use strict';

angular.module('mobileDetectService', [])

.factory('mobileDetectService', function () {
	return new window.MobileDetect(window.navigator.userAgent);
});
