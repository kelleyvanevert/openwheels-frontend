'use strict';

angular.module('tokenSilentRefreshService', [])

/*
  It's ugly to need to put this here,
   as if it's not an `authService` related method but rather a token method,
   and duplicating `authUrl` in the meantime as well,
   but because the `api` module uses it for replay, we would
   be introducing circularity, where the `api` module needs the `authService`..
*/

.service('tokenSilentRefreshService', function ($window, $q, $log, $state, appConfig, tokenService, authUrl) {

  this.silentRefresh = silentRefresh;

  function silentRefresh () {
    return $q(function (resolve, reject) {
      $log.log('rejecting silent refresh in 5s ...');
      setTimeout(function () {
        $log.log('rejecting silent refresh NOW');
        reject();
      }, 5000);
    });
    /*
    return $q(function (resolve, reject) {
      // we actually only need one iframe and message handler,
      //  but, for now, this is easier coding :)
      
      var iframe = $window.document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = authUrl('postMessage', 'postMessage');

      $window.addEventListener('message', function (e) {
        try {
          var message = JSON.parse(e.data);
          if (message.name === 'oAuthToken') {
            var token = tokenService.createToken(message.data).save();
            resolve(token);
          } else if (message.name === 'oAuthError') {
            reject();
          }
        } catch (e) {}
      });

      // kick-off
      $window.document.body.appendChild(iframe);
    });
    */
  }

});