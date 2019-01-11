'use strict';

angular.module('openwheels', [
/* Framework */
  'ngAria',
  'ngAnimate',
  'ngCookies',
  'ngMaterial',
  'ngMessages',
  'ngSanitize',

  /* Tools */
  'ui.router',
  'ui.unique',
  'ui.bootstrap',
  'ui.calendar',
  'ui.sortable', // bower install ng-sortable
  'validation.match', // see vendor_custom
  'angularMoment',
  'ngMdIcons',
  'uiGmapgoogle-maps',
  'ngStorage',
  'pascalprecht.translate',
  'geolocation',
  'geocoder',
  'ngAutocomplete',
  'ngScrollTo',
  'uiCropper',
  // 'vcRecaptcha',

  /* Auto-generated */
  'templates-app',
  'templates-common',
  'openwheels.environment',
  'openwheels.config',

  /* API communication & access control */
  'api',
  'rpcServices',
  'authService',
  'tokenService',
  'oAuth2Callback',
  'oAuth2MessageListener',
  'stateAuthorizer',

  /* Services */
  'alertService',
  'dialogService',
  'DutchZipcodeService',
  'brandedFileLoader',
  'TimeFrameService',
  'windowSizeService',
  'owm.geoPositionService',
  'owm.linksService',
  'owm.featuresService',
  'owm.metaInfoService',
  'owm.meHelperService',
  // 'angular-google-analytics', // this is `angular-track`, and is being phased out
  'mobileDetectService',

  'Cookies',
  'AB',

  /* Directives */
  'form.validation',
  'signupFormDirective',
  'pickadate',
  '720kb.socialshare',
  'timeframe',
  'datetimeDirective',
  'bookingListDirective',
  'licencePlateInfoDirective',
  'phoneNumberDirective',
  'formGroupDirective',
  'bindingDirectives',
  'ratingThumbDirective',
  'ratingThumbBinaryDirective',
  'badgeListDirective',
  'infoIconDirective',
  'vouchersDirective',
  'resourceSidebarDirective',
  'fileInputDirective',
  'resourceCarouselDirective',
  'bookingDirectives',
  'personDirectives',
  'passwordStrengthDirective',
  'geocoderDirective',
  'geocoderDirectiveSearchbar',
  'socialDirectives',
  'bindMetaDirective',
  'personalDataDirective',
  'sameHeightDirective',
  'autoblurDirective',
  'restrictToDirective',
  'autoResize',
  'infoDialogDirective',
  'huurkostenLineDirective',

  'angular-owl-carousel-2',
  'hl.sticky',
  
  'bootstrapDateTimePickerDirective',
  'timeframePickerDirective',
  'resourcePricingDirective',
  'invoiceEstimateDirective',
  'noUiSliderDirective',
  'validPhoneNumberDirective',
  'hasFeatureIconDirective',

  /* Filters */
  'filters.util',
  'filters.dateUtil',
  'filters.getByPropertyFilter',
  'filters.fullname',
  'filters.avatar',
  'filters.replace',
  'filters.ratingStars',
  'filters.dirty',
  'filters.reverse',
  'filters.percentage',
  'filters.bookingStatus',
  'filters.booking',
  'filters.translateOrDefault',
  'filters.removeEntersFilter',

  /* Components */
  'openwheels.analytics',
  'openwheels.social',
  'owm.shell',
  'owm.alert',
  'owm.translate',
  'owm.auth',
  'owm.home',
  'owm.pages',
  'owm.resource',
  'owm.booking',
  'owm.person',
  'owm.finance',
  'owm.payment',
  'owm.trips',
  'owm.chat',
  'owm.message',
  'owm.discount',
  'owm.contract'
])

.constant('API_DATE_FORMAT', 'YYYY-MM-DD HH:mm')
.constant('FRONT_DATE_FORMAT', 'dddd DD MMMM HH:mm')

.provider('authUrl', function () {
  this.$get = ['$window', 'appConfig', function ($window, appConfig) {
    return function authUrl (errorPath, successPath) {
      var oAuth2CallbackUrl =
        $window.location.protocol + '//' +
        $window.location.host +
        //$state.href('oauth2callback') +
        '/assets/oauth2callback.html' +
        '?' +
        (!successPath ? '' : '&successPath=' + encodeURIComponent(successPath)) +
        (!errorPath ? '' : '&errorPath=' + encodeURIComponent(errorPath));

      return appConfig.authEndpoint +
        '?client_id=' + appConfig.appId +
        '&response_type=' + 'token' +
        '&redirect_uri=' + encodeURIComponent(oAuth2CallbackUrl);
    };
  }];
})

.config(function (ngMdIconServiceProvider) {
  ngMdIconServiceProvider.addShape('info_italic', '<path d="m 12.861328,4.5846655 c -0.496,0 -0.923297,0.1640937 -1.279297,0.4960937 -0.353,0.331 -0.533203,0.7322656 -0.533203,1.1972655 0,0.466 0.179203,0.86536 0.533203,1.19336 0.356,0.327999 0.783297,0.492187 1.279297,0.492187 0.497,0 0.922391,-0.164188 1.275391,-0.492187 0.353,-0.328 0.53125,-0.72636 0.53125,-1.19336 0,-0.4649999 -0.17825,-0.8662655 -0.53125,-1.1972655 -0.352,-0.332 -0.778391,-0.4960937 -1.275391,-0.4960937 z" /><path d="m 11.179688,9.4909157 c -0.405001,0 -0.834063,0.07275 -1.289063,0.21875 -0.455,0.144 -0.9316875,0.3165313 -1.4296875,0.5195313 l -0.2011719,0.828125 c 0.146,-0.056 0.3223438,-0.112781 0.5273438,-0.175781 0.207,-0.061 0.4094687,-0.08984 0.6054687,-0.08984 0.401,0 0.6694999,0.06617 0.8124999,0.201172 0.141,0.135 0.212891,0.374797 0.212891,0.716797 0,0.192 -0.02236,0.402812 -0.06836,0.632812 -0.046,0.228 -0.102921,0.472469 -0.169921,0.730469 l -0.7617192,2.689453 c -0.067,0.283 -0.1154844,0.533813 -0.1464844,0.757813 -0.03,0.224 -0.044922,0.445156 -0.044922,0.660156 0,0.553 0.2033281,1.008187 0.6113281,1.367187 0.4080005,0.359 0.9807965,0.539063 1.7167975,0.539063 0.479,0 0.899718,-0.06345 1.261718,-0.189453 0.363,-0.126 0.847078,-0.308828 1.455078,-0.548828 l 0.203125,-0.826172 c -0.106,0.049 -0.273859,0.105922 -0.505859,0.169922 -0.234,0.064 -0.441953,0.0957 -0.626953,0.0957 -0.392,0 -0.668172,-0.06436 -0.826172,-0.19336 -0.16,-0.129 -0.240234,-0.372515 -0.240234,-0.728515 0,-0.141 0.02522,-0.35 0.07422,-0.625 0.05,-0.275 0.104016,-0.521328 0.166016,-0.736328 l 0.757813,-2.679688 c 0.074,-0.247 0.125343,-0.515547 0.152343,-0.810547 0.027,-0.294 0.04102,-0.500187 0.04102,-0.617187 0,-0.564 -0.200703,-1.023953 -0.595703,-1.376953 -0.397,-0.3520003 -0.960407,-0.5292973 -1.691406,-0.5292973 z" />');
})

.config(function ($locationProvider, $stateProvider, $urlRouterProvider) {

  $locationProvider.html5Mode(true);

  $urlRouterProvider.rule(function($injector, $location) {

    var path = $location.path();
    var hasTrailingSlash = path[path.length-1] === '/';

    if(hasTrailingSlash) {

      //if last charcter is a slash, return the same url without the slash
      var newPath = path.substr(0, path.length - 1);
      return newPath;
    }

  });

  /**
   * Prevent infinite loop when requesting non-existing url
   * see https://github.com/angular-ui/ui-router/issues/600
   */
  $urlRouterProvider.otherwise(function ($injector, $location) {
    var $state = $injector.get('$state');
    $state.go('home');
  });

  /**
  * Force server reload for these urls:
  */
  $stateProvider.state('autodelen', {
    url: '/autodelen',
    onEnter: ['$window', function ($window) {
      $window.location.reload();
    }]
  });
  $stateProvider.state('autodelen2', {
    url: '/autodelen/*path',
    onEnter: ['$window', function ($window) {
      $window.location.reload();
    }]
  });

})

.config(function (appConfig, uiGmapGoogleMapApiProvider) {
  uiGmapGoogleMapApiProvider.configure({
    key: appConfig.test.gmaps_js_api_key || 'AIzaSyC1QrtfmsYNsJAfx9OOl5QX0oNpMVo3fbw',
    v: '3.34.0',
    libraries: 'places',
    language: 'nl'
  });
})

.config(function (appConfig, googleTagManagerProvider) {
  if (appConfig.gtmContainerId) {
    googleTagManagerProvider.init(appConfig.gtmContainerId);
  }
})

.config(function (appConfig, facebookProvider, twitterProvider) {
    // if (appConfig.features.facebook && appConfig.fbAppId) {
    //   facebookProvider.init(appConfig.fbAppId);
    // }
    // if (appConfig.features.twitter) {
    //   twitterProvider.init();
    // }
})
  /**
   * Disable logging for non-development environments
   */
  .config(function ($logProvider, ENV) {
    if (ENV !== 'development') {
      $logProvider.debugEnabled(false);
    }
  })

.config(function ($mdThemingProvider) {
  $mdThemingProvider.theme('default');
   // .primaryPalette('pink', {
   //   'hue-3': 'A100' // use shade A100 for the <code>md-hue-3</code> class
   // })
   // // If you specify less than all of the keys, it will inherit from the
   // // default shades
   // .accentPalette('purple', {
   //   'default': '200' // use shade 200 for default, and keep all other shades the same
   // });
})

.directive('convertToNumber', function() {
  return {
    require: 'ngModel',
    link: function (scope, element, attrs, ngModel) {
      ngModel.$parsers.push(function(val) {
        return val !== null ? parseInt(val, 10) : null;
      });
      ngModel.$formatters.push(function(val) {
        return val !== null ? '' + val : null;
      });
    }
  };
})

.run(function (windowSizeService, oAuth2MessageListener, stateAuthorizer, authService, featuresService) {
  /* Intentionally left blank */
})

.run(function ($window, $log, $timeout, $state, $stateParams, $rootScope, $anchorScroll,
  alertService, featuresService, linksService, metaInfoService, Analytics, authService, $location, $localStorage,
  AB,
  $analytics) {

  
  $rootScope.moment = moment;

  $rootScope.$state = $state;
  $rootScope.$stateParams = $stateParams;
  $rootScope.isLanguageLoaded = false;

  var hash = function(s) {
    /* Simple hash function. */
    var a = 1, c = 0, h, o;
    if (s) {
      a = 0;
      for (h = s.length - 1; h >= 0; h--) {
        o = s.charCodeAt(h);
        a = (a<<6&268435455) + o + (o<<14);
        c = a & 266338304;
        a = c!==0?a^c>>21:a;
      }
    }
    return String(a);
  };

  function setAnalyticsUser () {
    if (authService.user.isAuthenticated) {
      var userId = authService.user.identity.firstName + authService.user.identity.id;
      var hashedUserId = hash(userId);
      $analytics.setUsername(hashedUserId);
    }
  }

  $rootScope.$on('$stateChangeStart', function (e, toState, toParams, fromState) {
    // show spinner
    alertService.load();
    setAnalyticsUser();
  });

  $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
    $state.previous = fromState;

    $rootScope.previousState = fromState;
    $rootScope.previousStateParams = fromParams;
    // hide spinner
    alertService.loaded();

    if (authService.user.isAuthenticated) {
      setAnalyticsUser();

      var userStatus = authService.user.identity.status;
      var numberBookings = authService.user.identity.numberOfBookings;
      var userPreference = authService.user.identity.preference;

      var dataLayer = window.dataLayer = window.dataLayer || [];
      dataLayer.push({
        'mywheels user status': userStatus,
        'mywheels number of bookings': numberBookings,
        'mywheels user preference': userPreference,
      });
    }

    $localStorage.discountCode = ($location.search().discountCode || $localStorage.discountCode);

    // scroll to top, except for place pages (for toggling map <--> list)
    // depends on presence of DOM-element with id="scroll-to-top-anchor"
    // TODO(?): move to a better place
    if (['owm.resource.place.list', 'owm.resource.place.map'].indexOf(toState.name) < 0) {
      $anchorScroll('scroll-to-top-anchor');
    }

    // set page title
    if (!metaInfoService.isSet('title') && toState.data) {
      metaInfoService.setTranslated({
        title: toState.data.title,
        description: toState.data.description
      });
    }
    metaInfoService.flush();

    /**
     * Use new bootstrap container width on certain pages
     * (can be removed when implemented everywhere)
     */
    $rootScope.containerTransitional = (
      (featuresService.get('filtersSidebar') && $state.includes('owm.resource.search')) ||
      (featuresService.get('filtersSidebar') && $state.includes('owm.resource.place')) ||
      (featuresService.get('resourceSidebar') && $state.includes('owm.resource.show')) ||
      $state.includes('subscribe') ||
      $state.includes('invite') ||
      $state.includes('member') ||
      $state.includes('owm.trips') ||
      $state.includes('owm.person.details') ||
      $state.includes('owmlanding')
    );
    $rootScope.containerHome = (
      ($state.includes('home')) || ($state.$current.self.url === '/auto-verhuren')
    );
    $rootScope.containerIntro = (
      ($state.includes('owm.person.intro'))
    );
    $rootScope.mdOk = ($rootScope.containerTransitional || $rootScope.containerHome);
  });

  // show an error on state change error
  $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
    alertService.loaded();
    $log.debug('State change error', error);
    alertService.closeAll();
    
    if (!fromState.name) {
      $timeout(function () {
        $state.go('home');
      }, 0);
    } else {
      // (stay on same page)
      alertService.add('danger', error.message || 'Woops, er is iets mis gegaan', 5000);
    }
  });

});

// MANUAL BOOTSTRAP

(function () {
  var injector = angular.injector(['ng']);
  var $http = injector.get('$http');
  var $window = injector.get('$window');
  var $q = injector.get('$q');
  var $log = injector.get('$log');

  if (!window.jasmine) {

    if ($window.location.host.indexOf('127.0.0.1') >= 0) {
      $window.location.replace($window.location.href.replace('127.0.0.1', 'localhost'));
    } else {

      // merge configs + bootstrap
      angular.element($window.document).ready(function () {
        $q.all([configFile(), featuresFile()]).then(function (configs) {
          var config = angular.extend(configs[0], configs[1]);
          var ok = bootstrap(config);
          if (ok) {
            $log.debug('app running at ' + config.app_url);
          } else {
            console.log('Invalid configuration');
          }
        });
      });
    }
  }

  function bootstrap(config) {
    if (isValidConfig(config)) {
      angular.module('openwheels.config', []).constant('appConfig', {
        appId: config.app_id,
        appSecret: config.app_secret,
        appUrl: config.app_url,
        appTokenRdw: config.app_token_rdw,
        serverUrl: config.server_url,
        authEndpoint: config.auth_endpoint,
        tokenEndpoint: config.token_endpoint,
        gtmContainerId: config.gtm_container_id || null,
        ga_tracking_id: config.ga_tracking_id || null,
        fbAppId: config.fb_app_id || null,
        features: config.features || {},
        test: config.test || {},
      });

      angular.module(['openwheels']).animation('.slide-toggleable', function () {
        return {
          addClass: function (element, className, doneFn) {
            if (className === 'ct-show') {
              window.jQuery(element).slideDown(100, doneFn);
            }
          },
          removeClass: function (element, className, doneFn) {
            if (className === 'ct-show') {
              window.jQuery(element).slideUp(100, doneFn);
            }
          },
        };
      });

      angular.bootstrap(angular.element('html'), ['openwheels']);
      return true;
    }
    return false;
  }

  function configFile() {
    var dfd = $q.defer();
    $http.get('branding/config.json?v=' + moment().format('YYMMDDHHmmss')).then(function (response) {
      dfd.resolve(response.data);
    }).catch(function () {
      dfd.resolve({});
    });
    return dfd.promise;
  }

  function featuresFile() {
    var dfd = $q.defer();
    $http.get('branding/features.json?v=' + moment().format('YYMMDDHHmmss')).then(function (response) {
      dfd.resolve(response.data);
    }).catch(function () {
      dfd.resolve({});
    });
    return dfd.promise;
  }

  function isValidConfig(config) {
    return config &&
      config.app_id &&
      config.app_secret &&
      config.app_url &&
      config.server_url &&
      config.auth_endpoint &&
      config.token_endpoint;
  }
}());
