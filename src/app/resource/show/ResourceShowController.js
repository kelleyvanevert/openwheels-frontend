'use strict';
angular.module('owm.resource.show', [])
    .controller('ResourceShowController', function ($window, $log, $q, $timeout, $location, $mdDialog, $mdMedia, $scope, $state, $filter, authService, resourceService, bookingService, invoice2Service, alertService, chatPopupService, ratingService, resource, me, resourceQueryService, featuresService, $stateParams, linksService, Analytics, metaInfoService, $localStorage, $translate, appConfig, $anchorScroll) {
    Analytics.trackEvent('discovery', 'show_car', resource.id, undefined, true);
    metaInfoService.set({ robots: resource.isActive && !resource.removed ? 'all' : 'noindex' });
    metaInfoService.set({ url: appConfig.serverUrl + '/auto-huren/' + (resource.city || '').toLowerCase().replace(/ /g, '-') + '/' + resource.id });
    metaInfoService.set({ canonical: 'https://mywheels.nl/auto-huren/' + (resource.city || '').toLowerCase().replace(/ /g, '-') + '/' + resource.id });
    if (resource.removed === undefined) {
        resource.removed = false;
    }
    $scope.removed = (resource.removed || !resource.isActive);
    $scope.unavailable = (resource.isAvailableFriends === false);
    if ($scope.removed) {
        resourceQueryService.setText(resource.location);
        resourceQueryService.setLocation({ latitude: resource.latitude, longitude: resource.longitude });
    }
    $scope.booking = {
        resource: resource
    };
    $scope.resource = resource;
    $scope.me = me;
    $scope.showBookingForm = false;
    $scope.showBookingFormToggle = true;
    if (!$scope.removed) {
        $scope.satisfaction = Math.round($scope.resource.rating_totals.satisfaction * 100) + '%';
    }
    $scope.openDialogSpinner = false;
    $scope.openChatWith = openChatWith;
    $scope.openCommentDialog = openCommentDialog;
    $scope.isFavoriteResolved = false;
    $scope.toggleFavorite = toggleFavorite;
    $scope.shareUrl = featuresService.get('serverSideShare') ? linksService.resourceUrl(resource.id, (resource.city || '').toLowerCase().replace(/ /g, '-')) : $window.location.href;
    $log.debug('Share url = ' + $scope.shareUrl);
    var ageInDays = moment().diff($scope.resource.created, 'days');
    $scope.resource.isNew = ageInDays < 180;
    setResourceType(resource);
    function setResourceType(resource) {
        if (resource.resourceType === 'car') {
            $scope.resourceTypeValue = $translate.instant('RESOURCE_TYPE.CAR');
        }
        else if (resource.resourceType === 'cabrio') {
            $scope.resourceTypeValue = $translate.instant('RESOURCE_TYPE.CABRIO');
        }
        else if (resource.resourceType === 'van') {
            $scope.resourceTypeValue = $translate.instant('RESOURCE_TYPE.VAN');
        }
        else if (resource.resourceType === 'station') {
            $scope.resourceTypeValue = $translate.instant('RESOURCE_TYPE.STATION');
        }
        else if (resource.resourceType === 'oldtimer') {
            $scope.resourceTypeValue = $translate.instant('RESOURCE_TYPE.OLDTIMER');
        }
        else {
            $scope.resourceTypeValue = $translate.instant('RESOURCE_TYPE.CAR');
        }
    }
    if (!$scope.removed) {
        $scope.airconditioning = resource.properties.map(function (o) { return o.id; }).indexOf('airconditioning');
        $scope.automaticGear = resource.properties.map(function (o) { return o.id; }).indexOf('automaat');
        $scope.bikeCarrier = resource.properties.map(function (o) { return o.id; }).indexOf('fietsendrager');
        $scope.childSeat = resource.properties.map(function (o) { return o.id; }).indexOf('kinderzitje');
        $scope.mp3Connection = resource.properties.map(function (o) { return o.id; }).indexOf('mp3-aansluiting');
        $scope.navigation = resource.properties.map(function (o) { return o.id; }).indexOf('navigatie');
        $scope.wheelchairFriendly = resource.properties.map(function (o) { return o.id; }).indexOf('rolstoelvriendelijk');
        $scope.towbar = resource.properties.map(function (o) { return o.id; }).indexOf('trekhaak');
        $scope.winterTires = resource.properties.map(function (o) { return o.id; }).indexOf('winterbanden');
    }
    $scope.ageInDays = moment().diff($scope.resource.created, 'days');
    loadSearchState();
    if (me) {
        loadFavorite();
    }
    else {
        $scope.isFavoriteResolved = true;
    }
    if (featuresService.get('ratings')) {
        loadRatings();
    }
    $scope.images = resource.pictures
        .map(function (picture) {
        var path = picture.large || picture.normal || picture.small || null;
        if (path && !path.match(/^http/)) {
            path = appConfig.serverUrl + '/' + path;
        }
        return path;
    })
        .filter(function (url) { return url; });
    if ($scope.images.length === 0) {
        $scope.images.push('assets/img/resource-avatar-large.jpg');
    }
    $scope.carouselBackgroundImage = {
        backgroundImage: 'url("' + $scope.images[0] + '")'
    };
    $scope.owlApi = null;
    $scope.owlReady = function ($api) {
        $scope.owlApi = $api;
    };
    $scope.owlGoto = function (i) {
        if ($scope.owlApi) {
            $scope.owlApi.trigger('to.owl.carousel', i);
        }
    };
    $scope.owlClick = function ($event) {
        var item = $($event.target).closest('.item');
        if (item.length) {
            var i = parseInt(item.attr('index'));
            $scope.owlApi.trigger('to.owl.carousel', i);
        }
    };
    function openChatWith(otherPerson) {
        var otherPersonName = $filter('fullname')(otherPerson);
        chatPopupService.openPopup(otherPersonName, otherPerson.id, resource.id, null);
    }
    function openCommentDialog(rating, $event) {
        $scope.rating = rating;
        $mdDialog.show({
            fullscreen: $mdMedia('xs'),
            preserveScope: true,
            scope: $scope,
            templateUrl: 'resource/partials/commentDialog.tpl.html',
            parent: angular.element(document.body),
            targetEvent: $event,
            clickOutsideToClose: true,
            controller: ['$scope', '$mdDialog', 'ratingService', function ($scope, $mdDialog, ratingService) {
                    $scope.rating = rating;
                    $scope.hide = function () {
                        $mdDialog.hide();
                    };
                    $scope.save = function () {
                        ratingService.commentOnRating({
                            ratingId: $scope.rating.id,
                            comment: $scope.ratingComment
                        })
                            .then(function (response) {
                            alertService.add('success', 'Jouw reactie op de beoordeling van ' + $filter('toTitleCase')($scope.rating.sender.firstName) + ' is opgeslagen.', 3000);
                            loadRatings();
                            $mdDialog.hide();
                        }, function (error) {
                            $scope.errorComment = error.message;
                        })["finally"](function () {
                            alertService.loaded();
                        });
                    };
                }]
        });
    }
    function loadSearchState() {
        var timeFrame = resourceQueryService.data.timeFrame;
        if (timeFrame) {
            $scope.booking.beginRequested = timeFrame.startDate;
            $scope.booking.endRequested = timeFrame.endDate;
        }
        $location.search(angular.extend($location.search(), resourceQueryService.createStateParams()));
        var discountCode = $stateParams.discountCode;
        if (!discountCode) {
            if ($localStorage.discountCode) {
                discountCode = $localStorage.discountCode;
            }
        }
        $scope.booking.discountCode = discountCode;
    }
    function loadRatings() {
        return ratingService.getResourceRatings({
            resource: $scope.resource.id
        }).then(function (result) {
            $scope.resource.ratings = result;
        });
    }
    if (!$scope.removed) {
        angular.extend($scope, {
            map: {
                center: {
                    latitude: resource.latitude,
                    longitude: resource.longitude
                },
                draggable: true,
                markers: [{
                        idKey: 1,
                        icon: (resource.locktypes.indexOf('chipcard') >= 0 || resource.locktypes.indexOf('smartphone') >= 0) ? 'assets/img/mywheels-open-marker-40.png' : 'assets/img/mywheels-key-marker-40.png',
                        latitude: resource.latitude,
                        longitude: resource.longitude,
                        title: resource.alias
                    }],
                zoom: 14,
                options: {
                    scrollwheel: false,
                    fullscreenControl: false,
                    mapTypeControl: false,
                    streetViewControl: false
                }
            }
        });
    }
    function loadFavorite() {
        $scope.isFavoriteResolved = false;
        var dfd = $q.defer();
        dfd.promise.then(function (bool) {
            $scope.isFavorite = bool;
            $scope.isFavoriteResolved = true;
        });
        resourceService.getFavorites({ maxResults: 3 }).then(function (favoritesRecentsAndSuggestions) {
            var isFavorite;
            angular.forEach(favoritesRecentsAndSuggestions, function (candidate) {
                isFavorite = isFavorite || (candidate.label === 'favorite' && candidate.id === resource.id);
            });
            dfd.resolve(isFavorite);
        })["catch"](function () {
            dfd.resolve(false);
        });
    }
    function toggleFavorite(bool) {
        var params = { resource: resource.id };
        var method = bool ? resourceService.addFavorite : resourceService.removeFavorite;
        $scope.isFavoriteResolved = false;
        method(params).then(function () {
            $scope.isFavorite = bool;
        })["catch"](function (err) {
            alertService.addError(err);
        })["finally"](function () {
            $scope.isFavoriteResolved = true;
        });
    }
    $scope.toggleBookingForm = function () {
        $scope.showBookingForm = !!!$scope.showBookingForm;
        $scope.showBookingFormToggle = !!!$scope.showBookingFormToggle;
        $anchorScroll('priceBookingContainer');
        if (!$scope.showBookingForm) {
            $scope.showBookingFormToggle = false;
            $timeout(function () {
                $scope.showBookingFormToggle = true;
            }, 250);
        }
    };
});
//# sourceMappingURL=ResourceShowController.js.map