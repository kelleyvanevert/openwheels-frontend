'use strict';

angular.module('owm.shell', [])

.config(function ($stateProvider) {

  /**
   * Empty app shell with placeholders (ui-view's) for menu, toolbar, main content & footer.
   */
  $stateProvider.state('shell', {
    templateUrl: 'shell/shell.tpl.html',
    controller: 'ShellController',
    resolve: {
      isLanguageLoaded: ['$q', '$rootScope', function ($q, $rootScope) {
        var dfd = $q.defer();
        var unbindWatch = $rootScope.$watch('isLanguageLoaded', function (isLoaded) {
          if (isLoaded) {
            unbindWatch();
            dfd.resolve();
          }
        });
        return dfd.promise;
      }],
      me: ['authService', function (authService) {
        return authService.userPromise().then(function (user) {
          return user.isAuthenticated ? user.identity : null;
        });
      }],
      checkBusiness: ['me', '$rootScope', function (me, $rootScope) {
        return ($rootScope.businessUI = me.isBusinessConnected);
      }],
      providerInfo: ['me', 'providerInfoService', '$rootScope', function (me, providerInfoService, $rootScope) {
        return providerInfoService.getInfo({ provider: me.provider.id })
        .then(function (info) {
          // interface ProviderInfo {
          //   extraInfo: any | ProviderExtraInfo
          //   fleetManager: Person
          //   visibleName: string
          // }
          // interface ProviderExtraInfo {
          //   emergency_number: string
          //   welcome_text: string
          // }
          $rootScope.providerInfo = info;
          return info;
        });
      }],
    }
  });

  /**
   * Application with populated menu, toolbar & footer
   */
  $stateProvider.state('owm', {
    parent: 'shell',
    views: {
      'toolbar@shell': {
        templateUrl: 'shell/toolbar/toolbar.tpl.html',
        controller: 'ToolbarController'
      },
      'menu@shell': {
        templateUrl: 'shell/menu/menu.tpl.html',
        controller: 'MenuController'
      },
      'footer@shell': {
        templateUrl: 'shell/footer/footer.tpl.html',
        controller: 'FooterController'
      }
    },
  });

  /**
   * Application with populated menu, toolbar & footer
   */
  $stateProvider.state('owmlanding', {
    parent: 'shell',
    views: {
      'menu@shell': {
        templateUrl: 'shell/landing/menu/menu.tpl.html',
        controller: 'LandingMenuController'
      },
      'footer@shell': {
        templateUrl: 'shell/footer/footer.tpl.html',
        controller: 'FooterController'
      },
    },
  });

});
