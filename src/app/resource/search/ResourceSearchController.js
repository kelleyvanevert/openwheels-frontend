'use strict';

angular.module('owm.resource.search', [
    'owm.resource.search.list',
    'owm.resource.search.map',
  ])
  .controller('ResourceSearchController', function ($location, me, $scope, $state, $stateParams, $uibModal, $mdMedia, $mdDialog,
    $filter, $anchorScroll, appConfig, alertService, resourceService, resourceQueryService, user, place, Analytics,
    makeHomeAddressPrefill,
    $cookieStore, preloader, metaInfoService, $rootScope, API_DATE_FORMAT) {

    if (place) {
      metaInfoService.set({url: appConfig.serverUrl + '/auto-huren/' + (place.name || '').toLowerCase().replace(/ /g, '-')});
      metaInfoService.set({canonical: 'https://mywheels.nl/auto-huren/' + (place.name || '').toLowerCase().replace(/ /g, '-')});
    } else {
      metaInfoService.set({url: appConfig.serverUrl + '/auto-huren'});
      metaInfoService.set({canonical: 'https://mywheels.nl/auto-huren'});
    }


    $scope.instance = Math.random();


    $scope.me = me;

    var DEFAULT_LOCATION = {
      // Utrecht, The Netherlands
      latitude: 52.091667,
      longitude: 5.117778000000044
    };

    var query = resourceQueryService.data;

    var results_per_page = 20;
    var max_pages = 10;

    $scope.searching = false;
    $scope.place = place;
    $scope.booking = {};
    $scope.resources = [];
    $scope.searchText = '';

    // set pagination variables
    resetPaginationCache();

    $scope.completePlacesOptions = {
      country: $filter('translateOrDefault')('SEARCH_COUNTRY', 'nl'),
      watchEnter: true
    };

    $scope.filters = {
      props: {
        radius: undefined
      },
      filters: {},
      options: {
        'airconditioning': false,
        'fietsendrager': false,
        'winterbanden': false,
        'kinderzitje': false,
        'navigatie': false,
        'trekhaak': false,
        'automaat': false,
        'mp3-aansluiting': false,
        'rolstoelvriendelijk': false
      },
    };

    init();

    function init() {
      if (query.timeFrame) {
        $scope.booking.beginRequested = query.timeFrame.startDate;
        $scope.booking.endRequested = query.timeFrame.endDate;
      }

      if (query.radius) {
        $scope.filters.props.radius = query.radius;
      }

      if (query.page) {
        $scope.page = query.page;
      }

      if (query.options) {
        query.options.forEach(function (key) {
          $scope.filters.options[key] = true;
        });
      }

      if (query.filters) {
        $scope.filters.filters = query.filters;
      }

      if (place && !$stateParams.lng) {
        resourceQueryService.setLocation({
          latitude: place.latitude,
          longitude: place.longitude
        });
        if(me && place.coordinator && me.id === place.coordinator.id) {
          $scope.filters.filters.smartwheels = true;
          $state.go($state.$current, resourceQueryService.createStateParams());
        }
      }

      $scope.searchText = query.text || makeHomeAddressPrefill(me);
      doSearch(true, query.page, undefined, true);
    }

    // get search result for page(s)
    // if gotoStartPage is true the searchresults will be displayed once
    // the request is finished. The loader/spinner will be shown.
    // If gotoStartPage is empty no GUI changes are made, this is useful when
    // we want to cache results in the background
    function doSearch(isInitialSearch, startPage, numberOfPages, gotoStartPage) {
      // ensure backward compatatibility, define default values for new params
      if (startPage === undefined) {
        startPage = 1;
      }
      if (numberOfPages === undefined) {
        numberOfPages = 2;
      }
      if (gotoStartPage === undefined) {
        gotoStartPage = true;
      }

      // are requested pages legal?
      if (startPage > max_pages) {
        startPage = max_pages;
      }
      if (startPage + numberOfPages > max_pages) {
        numberOfPages = max_pages - startPage + 1;
      }

      // time frame
      resourceQueryService.setTimeFrame({
        startDate: $scope.booking.beginRequested,
        endDate: $scope.booking.endRequested
      });

      // radius
      resourceQueryService.setRadius($scope.filters.props.radius);

      // options
      var optionsArray = Object.keys($scope.filters.options).filter(function (e) {
        return $scope.filters.options[e];
      });
      resourceQueryService.setOptions(optionsArray);

      // filters
      var filtersObject = $scope.filters.filters;
      resourceQueryService.setFilters(filtersObject);

      // construct api call
      var params = {};
      // set maxresults and calculate offset
      if(startPage === 1) {
        params.maxresults = results_per_page;
        params.offset = 0;
      } else {
        params.maxresults = numberOfPages * results_per_page;
        params.offset = (startPage - 1) * results_per_page;
      }
      if (query.location) {
        params.location = query.location;
      }
      if (query.timeFrame) {
        params.timeFrame = query.timeFrame;
      }
      if (query.radius) {
        params.radius = query.radius;
      }
      if (query.options) {
        params.options = query.options;
      }
      if (query.filters) {
        params.filters = query.filters;
      }
      params.sort = query.sort;
      if (!params.location) {
        if (user.isAuthenticated) {
          params.person = user.identity.id;
        } else {
          params.location = DEFAULT_LOCATION;
        }
      }

      // we only want to show spinner/loader when the user is waiting for
      // the results. This function is sometimes called to cache the next page,
      // in that case we do not want to show the spinner.
      if (gotoStartPage) {
        // perform search
        //alertService.load();
        $scope.searching = true;
      }

      var promise;
      promise = resourceService.searchV3(params);

      return promise.then(function (resources) {
        $scope.numberOfResults = resources.totalResults > 100 ? Math.floor(resources.totalResults / 100) * 100  + '+' : resources.totalResults;
        $scope.last_page = Math.min(Math.ceil(parseInt(resources.totalResults) / results_per_page), max_pages);
        resources = resources.results;
        resources = _.map(resources, function(resource) {
          delete resource.properties;
          return resource;
        });

        // cache results
        for (var i = 0; i < numberOfPages; i++) {
          $scope.pagedResults[startPage + i] = resources.slice((i) * results_per_page, (i + 1) * results_per_page);
        }

        // if needed, update UI
        if (gotoStartPage) {
          $scope.selectedResource = resources[0];
          Analytics.trackEvent('discovery', 'search', user.isAuthenticated, undefined, true);
          $scope.showPage(startPage);
        } else {
          var images = _.map(resources, function(resource) {
            if(resource.pictures && resource.pictures.length > 0 && resource.pictures[0] && resource.pictures[0].large) {
              var url = resource.pictures[0].large;
              if (!url.match(/^http/)) {
                url = appConfig.serverUrl + '/' + url;
              }
              return url;
            }
          });
          preloader.preloadImages(images);
				}

        return resources;
      })
      .catch(function (err) {
        alertService.addError(err);
      })
      .finally(function () {
        $scope.searching = false;
        //alertService.loaded();
      });
    }

    $scope.showPage = function (page) {
      // check page is legal value
      if (page < 1) {
        page = 1;
      }
      if (page > max_pages) {
        page = max_pages;
      }

      // update url
      $scope.page = page;
      resourceQueryService.setPage(page);
      updateUrl();

      $anchorScroll('scroll-to-top-anchor');

      // page can be cached or not
      if ($scope.pagedResults[page] !== undefined) { // Hooray, page is already in cache
        $scope.resources = $scope.pagedResults[page];
      } else { // Snap, page is not in cache, get it and show immediately
        doSearch(false, page, 2, true);
      }

      // if next page is not in cache, cache it
      var cachedPages = Object.keys($scope.pagedResults);
      if (cachedPages.indexOf(page + 1) < 0) { // next page not in cache, cache it!
        // doSearch might block loop, so do it in background;
        setTimeout(function () {
          doSearch(false, page + 1, 1, false);
        }, 0);
      }
    };

    //select timeframe modal
    $scope.selectTimeframe = function () {
      var booking = $scope.booking;

      $mdDialog.show({
        controller: ['$scope', function ($scope) {
          $scope.beginRequested = booking.beginRequested;
          $scope.endRequested   = booking.endRequested;

          $scope.hide = function() {
            $mdDialog.hide();
          };
          $scope.accept = function () {
            booking.beginRequested = $scope.beginRequested;
            booking.endRequested   = $scope.endRequested;
            doSearch();

            $mdDialog.hide();
          };
        }],
        templateUrl: 'booking/timeframe/booking-timeframe-modal.tpl.html',
        parent: angular.element(document.body),
        //targetEvent: $event,
        clickOutsideToClose: true,
      });
    };

    $scope.removeTimeframe = function () {
      $rootScope.timeFrameRemoved = true;
      $scope.booking.beginRequested = null;
      $scope.booking.endRequested = null;
      return doSearch();
    };

    //select filters modal
    $scope.setFilters = function () {
      $mdDialog.show({
        autoWrap: false,
        templateUrl: 'resource/filter/resource-filter-modal.tpl.html',
        controller : 'ResourceFilterController',
        locals: {
          props: $scope.filters.props,
          filters: $scope.filters.filters,
          options: $scope.filters.options
        },
        fullscreen: $mdMedia('xs')
      })
      .then(function (selected) {
        Analytics.trackEvent('discovery', 'filters_applied', user.isAuthenticated, undefined, true);
        $scope.filters.props = selected.props;
        $scope.filters.filters = selected.filters;
        $scope.filters.options = selected.options;

        return doSearch();
      });
    };

    $scope.sidebarFiltersChanged = function () {
      Analytics.trackEvent('discovery', 'filters_applied', user.isAuthenticated, undefined, true);
      resetPaginationCache();
      doSearch();
    };

    function resetPaginationCache() {
      // pagination variables
      $scope.page = 1; // current page
      $scope.last_page = max_pages;
      $scope.pagedResults = {};
    }

    $scope.update = function(stateParams) {
      doSearch();
    };

    function updateUrl() {
      $location.search(resourceQueryService.createStateParams());
    }

    $scope.toggleMap = function toggleMap() {
      if (!$state.includes('owm.resource.search.map')) {
        $state.go('owm.resource.search.map', resourceQueryService.createStateParams());
      } else {
        $state.go('owm.resource.search.list', resourceQueryService.createStateParams());
      }
    };

    $scope.selectResource = function (resource) {
      var params = resourceQueryService.createStateParams();
      params.resourceId = resource.id;
      params.city = (resource.city || '').toLowerCase().replace(/ /g, '-');
      $state.go('owm.resource.show', angular.extend(params, { loader: false }));
    };

    $scope.sortChange = function(sort) {
      resetPaginationCache();
      doSearch();
      updateUrl();
    };

    $scope.getPages = function(num) {
      return new Array(num);
    };

  });

