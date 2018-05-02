'use strict';

angular.module('owm.booking.new', [])

.controller('NewBookingShowController', function ($scope, booking, me, metaInfoService, appConfig) {

	metaInfoService.set({url: appConfig.serverUrl + '/booking/overzicht'});
	metaInfoService.set({canonical: 'https://mywheels.nl/booking/overzicht'});

	$scope.booking = booking;
	$scope.resource = booking.resource;
	$scope.userPerspective = booking.person.id === me.id ? 'renter' : 'owner';
	$scope.timeFrame = null;

});