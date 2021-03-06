/*
 * angular-google-places-autocomplete
 *
 * Copyright (c) 2014 "kuhnza" David Kuhn
 * Licensed under the MIT license.
 * https://github.com/kuhnza/angular-google-places-autocomplete/blob/master/LICENSE
 */

'use strict';

angular.module('google.places', [])
/**
 * DI wrapper around global google places library.
 *
 * Note: requires the Google Places API to already be loaded on the page.
 */
.factory('googlePlacesApi', ['$window',  'uiGmapGoogleMapApi', function ($window, uiGmapGoogleMapApi) {
	return uiGmapGoogleMapApi.then(function () {
		if (!$window.google) {
			throw 'Global `google` var missing. Did you forget to include the places API script?';
		}
		return $window.google;
	});


}])

/**
 * Autocomplete directive. Use like this:
 *
 * <input type="text" g-places-autocomplete ng-model="myScopeVar" />
 */
.directive('gPlacesAutocomplete',
					 [ '$parse', '$compile', '$timeout', '$document', 'googlePlacesApi',
						 function ($parse, $compile, $timeout, $document, googlePromise) {

							 function unwrap (x) {
								 return typeof x === 'function' ? x() : x;
							 }

								if (!Object.entries) {
									Object.entries = function( obj ){
										var ownProps = Object.keys( obj ),
												i = ownProps.length,
												resArray = new Array(i); // preallocate the Array
										while (i--)
											resArray[i] = [ownProps[i], obj[ownProps[i]]];
										
										return resArray;
									};
								}

								// AUTOCOMPLETION CACHE
								// ====================

							 var cache;
							 try {
								 cache = JSON.parse(window.localStorage.getItem('cache_places_autocomplete'));
								 if (!cache) {
									 window.localStorage.setItem('cache_places_autocomplete', '{}');
									 cache = {};
								 }
							 } catch (e) {
								 try {
									 window.localStorage.setItem('cache_places_autocomplete', '{}');
									 cache = {};
								 } catch (e) {
									 // noop
								 } // no localstorage
							 } // no localstorage or json parse error

							 var cacheSaveTimeoutID;

							 function saveCache () {
								 if (cache && window.localStorage) {
									
									// first, prune the cache to only include the 500 most recent autocomplete api results
									var entries = Object.entries(cache);
									var num_remove = Math.max(0, entries.length - 500);
									if (num_remove) {
										entries
											.sort(function (a,b) { return a.timestamp < b.timestamp; })
											.slice(0, num_remove)
											.forEach(function (entry) {
												delete cache[entry[0]];
											});
									}

									try {
										window.localStorage.setItem('cache_places_autocomplete', JSON.stringify(cache));
									} catch (e) {} // no localstorage or storage limit reached
								 }

								 cacheSaveTimeoutID = undefined;
							 }

							 function scheduleCacheSave () {
								 if (!cacheSaveTimeoutID) {
									 cacheSaveTimeoutID = setTimeout(saveCache, 1000);
								 }
							 }

							 function tryGetCachedPredictions (input) {
									if (cache && cache[input]) {
										var dt_seconds = (Math.round(Date.now() / 1000) - cache[input].timestamp);
										if (dt_seconds / (60 * 60 * 24 * 30) > 1) {
											// don't keep/use longer than 1 month
											delete cache[input];
											scheduleCacheSave();
											return false;
										}

										return cache[input].predictions;
									}

									// if anything goes wrong
								 return false;
							 }

							 function cachePredictions (input, predictions) {
								 if (cache) {
									cache[input] = {
										timestamp: Math.round(Date.now() / 1000),
										predictions: predictions.map(function (prediction) {
											delete prediction.structured_formatting;
											delete prediction.reference;
											delete prediction.types;
											return prediction;
										}),
									};
									scheduleCacheSave();
								 }
							 }

								// PLACES API CACHE
								// ================

							 var placesCache;
							 try {
								 placesCache = JSON.parse(window.localStorage.getItem('cache_places_details'));
								 if (!placesCache) {
									 window.localStorage.setItem('cache_places_details', '{}');
									 placesCache = {};
								 }
							 } catch (e) {
								 try {
									 window.localStorage.setItem('cache_places_details', '{}');
									 placesCache = {};
								 } catch (e) {} // no localstorage
							 } // no localstorage or json parse error

							 var placesCacheSaveTimeoutID;

							 function savePlacesCache () {
								 if (placesCache && window.localStorage) {
									
									// first, prune the cache to only include the 500 most recent places api results
									var entries = Object.entries(placesCache);
									var num_remove = Math.max(0, entries.length - 500);
									if (num_remove) {
										entries
											.sort(function (a,b) { return a.timestamp < b.timestamp; })
											.slice(0, num_remove)
											.forEach(function (entry) {
												delete placesCache[entry[0]];
											});
									}

									try {
										window.localStorage.setItem('cache_places_details', JSON.stringify(placesCache));
									} catch (e) {
										// console.debug(e);
										// noop
									} // no localstorage or storage limit reached
								 }

								 placesCacheSaveTimeoutID = undefined;
							 }

							 function schedulePlacesCacheSave () {
								 if (!placesCacheSaveTimeoutID) {
									 placesCacheSaveTimeoutID = setTimeout(savePlacesCache, 1000);
								 }
							 }

							 function tryGetPlacesCachedResult (input) {
									if (placesCache && placesCache[input]) {
										var dt_seconds = (Math.round(Date.now() / 1000) - placesCache[input].timestamp);
										if (dt_seconds / (60 * 60 * 24 * 30) > 1) {
											// don't keep/use longer than 1 month
											delete placesCache[input];
											schedulePlacesCacheSave();
											return false;
										}

										return placesCache[input].result;
									}

									// if anything goes wrong
								 return false;
							 }

							 function cachePlacesResult (input, place) {
								 try {
									place = JSON.parse(JSON.stringify(place));
									// place.geometry.location.lat = unwrap(place.geometry.location.lat);
									// place.geometry.location.lng = unwrap(place.geometry.location.lng);
									if (placesCache) {
										placesCache[input] = {
											timestamp: Math.round(Date.now() / 1000),
											result: place,
										};
										schedulePlacesCacheSave();
									}
								 } catch (e) {
									 // console.debug(e);
									 // noop
								 }
							 }

							 return {
								 restrict: 'A',
								 require: '^ngModel',
								 scope: {
									 model: '=ngModel',
									 options: '=?',
									 forceSelection: '=?',
									 customPlaces: '=?'
								 },
								 controller: ['$scope', function ($scope) {}],
								 link: function ($scope, element, attrs, controller) {
									 var keymap, hotkeys, autocompleteService, placesService, google;

									 googlePromise
									 .then(function(google2) {
										 google = google2;
										 hotkeys = [keymap.tab, keymap.enter, keymap.esc, keymap.up, keymap.down];
										 autocompleteService = new google.maps.places.AutocompleteService();
										 placesService = new google.maps.places.PlacesService(element[0]);
										 init();
									 });

									 keymap = {
										 tab: 9,
										 enter: 13,
										 esc: 27,
										 up: 38,
										 down: 40
									 };

									 function init() {
										 $scope.query = '';
										 $scope.predictions = [];
										 $scope.input = element;
										 $scope.options = $scope.options || {};

										 initAutocompleteDrawer();
										 initEvents();
										 initNgModelController();
									 }

									 function initEvents() {
										 element.bind('keydown', onKeydown);
										 element.bind('blur', onBlur);
										 element.bind('submit', onBlur);

										 $scope.$watch('selected', select);
									 }

									 function initAutocompleteDrawer() {
										 // Drawer element used to display predictions
										 var drawerElement = angular.element('<div g-places-autocomplete-drawer></div>'),
											 body = angular.element($document[0].body),
											 $drawer;

										 drawerElement.attr({
											 input: 'input',
											 query: 'query',
											 predictions: 'predictions',
											 active: 'active',
											 selected: 'selected'
										 });

										 $drawer = $compile(drawerElement)($scope);
										 body.append($drawer);  // Append to DOM
									 }

									 function initNgModelController() {
										 controller.$parsers.push(parse);
										 controller.$formatters.push(format);
										 controller.$render = render;
									 }

									 function onKeydown(event) {

										 if ($scope.predictions.length === 0 || indexOf(hotkeys, event.which) === -1) {
											 return;
										 }

										 event.preventDefault();

										 if (event.which === keymap.down) {
											 $scope.active = ($scope.active + 1) % $scope.predictions.length;
											 $scope.$digest();
										 } else if (event.which === keymap.up) {
											 $scope.active = ($scope.active ? $scope.active : $scope.predictions.length) - 1;
											 $scope.$digest();
										 } else if (event.which === 13 || event.which === 9) {
											 if ($scope.forceSelection) {
												 $scope.active = ($scope.active === -1) ? 0 : $scope.active;
											 }

											 $scope.$apply(function () {
												 $scope.selected = $scope.active;

												 if ($scope.selected === -1) {
													 clearPredictions();
												 }
											 });
										 } else if (event.which === 27) {
											 $scope.$apply(function () {
												 event.stopPropagation();
												 clearPredictions();
											 });
										 }
									 }

									 function onBlur(event) {
										 if ($scope.predictions.length === 0) {
											 return;
										 }

										 if ($scope.forceSelection) {
											 $scope.selected = ($scope.selected === -1) ? 0 : $scope.selected;
										 }

										 $scope.$digest();

										 $scope.$apply(function () {
											 if ($scope.selected === -1) {
												 clearPredictions();
											 }
										 });
									 }

									 function selectAction(place) {
											$scope.$apply(function () {
												$scope.model = place;
												$scope.$emit('g-places-autocomplete:select', place);
												$timeout(function () {
													controller.$viewChangeListeners.forEach(function (fn) {fn();});
												});
											});
									 }

									 function select() {
										 var prediction;

										 prediction = $scope.predictions[$scope.selected];
										 if (!prediction) {
											 return;
										 }

										 if (prediction.is_custom) {
											 $timeout(function () {
											   selectAction(prediction.place);
											 }, 200);
										 } else {
											 var cachedResult = tryGetPlacesCachedResult(prediction.place_id);
											 if (cachedResult) {
												 $timeout(function () {
													 selectAction(cachedResult);
												 }, 200);
											 } else {
												placesService.getDetails({
													placeId: prediction.place_id,
													fields: [
														'formatted_address',
														'address_component',
														'geometry',
														'icon',
														'id',
														'place_id',
													],
												}, function (place, status) {
													if (status === google.maps.places.PlacesServiceStatus.OK) {
														cachePlacesResult (prediction.place_id, place);
														selectAction(place);
													}
												});
											 }
										 }

										 clearPredictions();
									 }

									 function parse(viewValue) {
										 var request;

										 if (!(viewValue && isString(viewValue))) return viewValue;

										 $scope.query = viewValue;

										 var cachedPredictions = tryGetCachedPredictions(viewValue);
										 if (cachedPredictions && cachedPredictions.length > 0) {
											
											 clearPredictions();
											 $scope.predictions.push.apply($scope.predictions, cachedPredictions);

										 } else {
											
											request = angular.extend({ input: viewValue }, $scope.options);
											autocompleteService.getPlacePredictions(request, function (predictions, status) {
												$scope.$apply(function () {
													var customPlacePredictions;

													clearPredictions();

													if ($scope.customPlaces) {
														customPlacePredictions = getCustomPlacePredictions($scope.query);
														$scope.predictions.push.apply($scope.predictions, customPlacePredictions);
													}

													if (status === google.maps.places.PlacesServiceStatus.OK) {
														$scope.predictions.push.apply($scope.predictions, predictions);
													}

													if ($scope.predictions.length > 5) {
														$scope.predictions.length = 5;  // trim predictions down to size
													}
													
													if ($scope.predictions.length > 0) {
														cachePredictions(request.input, $scope.predictions);
													}
												});
											});

										 }

										 if ($scope.forceSelection) {
											 return controller.$modelValue;
										 } else {
											 return viewValue;
										 }
									 }

									 function format(modelValue) {
										 var viewValue = "";

										 if (isString(modelValue)) {
											 viewValue = modelValue;
										 } else if (isObject(modelValue)) {
											 viewValue = modelValue.formatted_address;
										 }

										 return viewValue;
									 }

									 function render() {
										 return element.val(controller.$viewValue);
									 }

									 function clearPredictions() {
										 $scope.active = -1;
										 $scope.selected = -1;
										 $scope.predictions = [];
									 }

									 function getCustomPlacePredictions(query) {
										 var predictions = [],
											 place, match, i;

										 for (i = 0; i < $scope.customPlaces.length; i++) {
											 place = $scope.customPlaces[i];

											 match = getCustomPlaceMatches(query, place);
											 if (match.matched_substrings.length > 0) {
												 predictions.push({
													 is_custom: true,
													 custom_prediction_label: place.custom_prediction_label || '(Custom Non-Google Result)',  // required by https://developers.google.com/maps/terms § 10.1.1 (d)
													 description: place.formatted_address,
													 place: place,
													 matched_substrings: match.matched_substrings,
													 terms: match.terms
												 });
											 }
										 }

										 return predictions;
									 }

									 function getCustomPlaceMatches(query, place) {
										 var q = query + '',  // make a copy so we don't interfere with subsequent matches
											 terms = [],
											 matched_substrings = [],
											 fragment,
										 termFragments,
										 i;

										 termFragments = place.formatted_address.split(',');
										 for (i = 0; i < termFragments.length; i++) {
											 fragment = termFragments[i].trim();

											 if (q.length > 0) {
												 if (fragment.length >= q.length) {
													 if (startsWith(fragment, q)) {
														 matched_substrings.push({ length: q.length, offset: i });
													 }
													 q = '';  // no more matching to do
												 } else {
													 if (startsWith(q, fragment)) {
														 matched_substrings.push({ length: fragment.length, offset: i });
														 q = q.replace(fragment, '').trim();
													 } else {
														 q = '';  // no more matching to do
													 }
												 }
											 }

											 terms.push({
												 value: fragment,
												 offset: place.formatted_address.indexOf(fragment)
											 });
										 }

										 return {
											 matched_substrings: matched_substrings,
											 terms: terms
										 };
									 }

									 function isString(val) {
										 return Object.prototype.toString.call(val) === '[object String]';
									 }

									 function isObject(val) {
										 return Object.prototype.toString.call(val) === '[object Object]';
									 }

									 function indexOf(array, item) {
										 var i, length;

										 if (array === null) return -1;

										 length = array.length;
										 for (i = 0; i < length; i++) {
											 if (array[i] == item) return i;
										 }
										 return -1;
									 }

									 function startsWith(string1, string2) {
										 return toLower(string1).lastIndexOf(toLower(string2), 0) == 0;
									 }

									 function toLower(string) {
										 return (string === null) ? "" : string.toLowerCase();
									 }
								 }
							 }
						 }
					 ])


					 .directive('gPlacesAutocompleteDrawer', ['$window', '$document', function ($window, $document) {
						 var TEMPLATE = [
							 '<div class="pac-container" ng-if="isOpen()" ng-style="{top: position.top+\'px\', left: position.left+\'px\', width: position.width+\'px\'}" style="display: block;" role="listbox" aria-hidden="{{!isOpen()}}">',
							 '  <div class="pac-item" g-places-autocomplete-prediction index="$index" prediction="prediction" query="query"',
							 '       ng-repeat="prediction in predictions track by $index" ng-class="{\'pac-item-selected\': isActive($index) }"',
							 '       ng-mouseenter="selectActive($index)" ng-click="selectPrediction($index)" role="option" id="{{prediction.id}}">',
							 '  </div>',
							 '</div>'
						 ];

						 return {
							 restrict: 'A',
							 scope:{
								 input: '=',
								 query: '=',
								 predictions: '=',
								 active: '=',
								 selected: '='
							 },
							 template: TEMPLATE.join(''),
							 link: function ($scope, element) {
								 element.bind('mousedown', function (event) {
									 event.preventDefault();  // prevent blur event from firing when clicking selection
								 });

								 $window.onresize = function () {
									 $scope.$apply(function () {
										 $scope.position = getDrawerPosition($scope.input);
									 });
								 }

								 $scope.isOpen = function () {
									 return $scope.predictions.length > 0;
								 };

								 $scope.isActive = function (index) {
									 return $scope.active == index;
								 };

								 $scope.selectActive = function (index) {
									 $scope.active = index;
								 };

								 $scope.selectPrediction = function (index) {
									 $scope.selected = index;
								 };

								 $scope.$watch('predictions', function () {
									 $scope.position = getDrawerPosition($scope.input);
								 }, true);

								 function getDrawerPosition(element) {
									 var domEl = element[0],
										 rect = domEl.getBoundingClientRect(),
										 docEl = $document[0].documentElement,
										 body = $document[0].body,
										 scrollTop = $window.pageYOffset || docEl.scrollTop || body.scrollTop,
										 scrollLeft = $window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

									 return {
										 width: rect.width,
										 height: rect.height,
										 top: rect.top + rect.height + scrollTop,
										 left: rect.left + scrollLeft
									 };
								 }
							 }
						 }
					 }])

					 .directive('gPlacesAutocompletePrediction', [function () {
						 var TEMPLATE = [
							 '<span class="pac-icon pac-icon-marker"></span>',
							 '<span class="pac-item-query" ng-bind-html="prediction | highlightMatched"></span>',
							 '<span ng-repeat="term in prediction.terms | unmatchedTermsOnly:prediction">{{term.value | trailingComma:!$last}}&nbsp;</span>',
							 '<span class="custom-prediction-label" ng-if="prediction.is_custom">&nbsp;{{prediction.custom_prediction_label}}</span>'
						 ];

						 return {
							 restrict: 'A',
							 scope:{
								 index:'=',
								 prediction:'=',
								 query:'='
							 },
							 template: TEMPLATE.join('')
						 }
					 }])

					 .filter('highlightMatched', ['$sce', function ($sce) {
						 return function (prediction) {
							 var matchedPortion = '',
								 unmatchedPortion = '',
								 matched;

							 if (prediction.matched_substrings.length > 0 && prediction.terms.length > 0) {
								 matched = prediction.matched_substrings[0];
								 matchedPortion = prediction.terms[0].value.substr(matched.offset, matched.length);
								 unmatchedPortion = prediction.terms[0].value.substr(matched.offset + matched.length);
							 }

							 return $sce.trustAsHtml('<span class="pac-matched">' + matchedPortion + '</span>' + unmatchedPortion);
						 }
					 }])

					 .filter('unmatchedTermsOnly', [function () {
						 return function (terms, prediction) {
							 var i, term, filtered = [];

							 for (i = 0; i < terms.length; i++) {
								 term = terms[i];
								 if (prediction.matched_substrings.length > 0 && term.offset > prediction.matched_substrings[0].length) {
									 filtered.push(term);
								 }
							 }

							 return filtered;
						 }
					 }])

					 .filter('trailingComma', [function () {
						 return function (input, condition) {
							 return (condition) ? input + ',' : input;
						 }
					 }]);


