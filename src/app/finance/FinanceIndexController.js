'use strict';

angular.module('owm.finance.index', [])

.controller('FinanceIndexController', function (me, requiredCredit, kmPoints,
  $scope, $q, $state,
  $mdDialog, paymentService, alertService) {
  
  $scope.me = me;
  $scope.requiredCredit = requiredCredit;
  $scope.kmPoints = kmPoints;
  $scope.kmPoints.total = $scope.kmPoints
    .map(function (o) { return +(o.amount); })
    .reduce(function (a,b) { return a+b; }, 0);
  
  function onNav () {
    if ($state.$current.name === 'owm.finance.kmpoints') {
      $scope.sectionTitle = 'Beheerdersvergoeding';
    }
    else if ($state.$current.name === 'owm.finance.vouchers') {
      $scope.sectionTitle = 'Rijtegoed';
    }
    else if ($state.$current.name === 'owm.finance.v4') {
      $scope.sectionTitle = 'Facturen';
    }
  }
	$scope.$on('$stateChangeSuccess', onNav);

  $scope.payoutDialog = function($event) {
    $event.stopPropagation();
    $event.preventDefault();

    var dialog = {
      templateUrl: 'finance/payoutDialog.tpl.html',
      controller: ['$scope', 'voucherService', function ($scope, voucherService) {

        $scope.loading = true;
        $scope.vouchers = [];
        $scope.selectedVouchers = [];

        voucherService.search({
          person: me.id,
          minValue: 0.0,
        })
          .then(function(vouchers) {
            $scope.loading = false;
            $scope.vouchers = vouchers;
          });

        $scope.cancel = function() {
          $mdDialog.hide(false);
        };

        $scope.close = function () {
          if($scope.selectedVouchers.length) {
            $mdDialog.hide($scope.selectedVouchers);
          } else {
            $scope.cancel();
          }
        };

        $scope.toggle = function (item, list) {
          var idx = list.indexOf(item);
          if (idx > -1) {
            list.splice(idx, 1);
          }
          else {
            list.push(item);
          }
        };

        $scope.exists = function (item, list) {
          return list.indexOf(item) > -1;
        };
      }],
      locals: {
        vouchers: $scope.vouchers,
      },
    };

    $mdDialog.show(dialog)
    .then(function (vouchers) {
      if(!vouchers) {
        return;
      }
      var promises = [];
      _.forEach(vouchers, function(voucher) {
        promises.push(paymentService.payoutVoucher({voucher: voucher}));
      });

      return $q.all(promises)
      .then(function(results) {
        alertService.add('success', 'De aangevraagde uitbetalingen staan ingepland', 9000);
        $state.reload();
      });
    })
    .catch(function(err){
      alertService.add('danger', err, 9000);
    })
    ;

    return false;
  };

});
