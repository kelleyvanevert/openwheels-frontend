'use strict';

angular.module('tokenSilentRefreshService', [])

/*
  It's ugly to need to put this here,
   as if it's not an `authService` related method but rather a token method,
   and duplicating `authUrl` in the meantime as well,
   but because the `api` module uses it for replay, we would
   be introducing circularity, where the `api` module needs the `authService`..
*/

.service('tokenSilentRefreshService', function ($window, appConfig, tokenService) {

  this.silentRefresh = silentRefresh;

  function silentRefresh () {
    // we actually only need one iframe and message handler,
    //  but, for now, this is easier coding :)
    
    var iframe = $window.document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.url = authUrl('postMessage', 'postMessage');

    $window.addEventListener('message', function (e) {
      try {
        var message = JSON.parse(e.data);
        if (message.name === 'oAuthToken') {
          tokenService.createToken(message.data).save();
        }
      } catch (e) {
        // noop
      }
    });

    // kick-off
    $window.document.body.appendChild(iframe);
  }

  function authUrl(errorPath, successPath) {
    var oAuth2CallbackUrl =
      $window.location.protocol + '//' +
      $window.location.host +
      //$state.href('oauth2callback') +
      '/oauth2callback.html' +
      '?' +
      (!successPath ? '' : '&successPath=' + encodeURIComponent(successPath)) +
      (!errorPath ? '' : '&errorPath=' + encodeURIComponent(errorPath));

    return appConfig.authEndpoint +
      '?client_id=' + appConfig.appId +
      '&response_type=' + 'token' +
      '&redirect_uri=' + encodeURIComponent(oAuth2CallbackUrl);
  }

});