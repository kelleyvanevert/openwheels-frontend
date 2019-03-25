'use strict';

// Kelley van Evert, 6 mrt 2019
angular.module('bookingInvoicesDirective', [])

.directive('bookingInvoices', function bookingInvoices (
  authService,
  invoice2Service
) {

  return {
    restrict: 'E',
    scope: {
      viewAs: '@', // "renter" or "owner"
      booking: '=',
    },
    templateUrl: 'directives/bookingInvoices/bookingInvoices.tpl.html',
    replace: true,
    controller: ['$scope', '$q', '$log', function bookingInvoicesController ($scope, $q, $log) {

      var me = authService.user.identity;

      /*
      * Invoices
      */
      function injectInvoiceLines(res) {
        var invoiceLinesSent, invoiceLinesReceived = [];
        if(res.sent) {
          invoiceLinesSent = _.map(_.flatten(_.pluck(res.sent, 'invoiceLines')), function(i) {i.type='sent'; return i; });
        }
        if(res.received) {
          invoiceLinesReceived = _.map(_.flatten(_.pluck(res.received, 'invoiceLines')), function(i) {i.type='received'; return i; });
        }
        var invoiceLines = _.sortBy(_.union(invoiceLinesSent, invoiceLinesReceived), 'position');
        $scope.invoiceLines = invoiceLines;
        return invoiceLines;
      }

      $scope.receivedInvoices = null;
      $scope.receivedInvoicesTotalAmount = 0;

      $scope.sentInvoices = null;
      $scope.sentInvoicesTotalAmount = 0;

      if ($scope.viewAs === 'renter') {
        $q.all({received: loadReceivedInvoices()})
        .then(injectInvoiceLines);
      }

      if ($scope.viewAs === 'owner') {
        $q.all({received: loadReceivedInvoices(), sent: loadSentInvoices()})
        .then(injectInvoiceLines);
      }

      function loadReceivedInvoices() {
        var booking = $scope.booking;
        return invoice2Service.getReceived({ person: me.id, booking: booking.id }).then(function (invoices) {

          $scope.receivedInvoices = invoices || [];

          var sum = 0;
          var hasError = false;
          angular.forEach(invoices, function (invoice) {
            var invoiceTotal;
            try {
              invoiceTotal = parseFloat(invoice.total);
              sum += invoiceTotal;
            } catch (e) {
              hasError = true;
            }
          });
          $scope.receivedInvoicesTotalAmount = hasError ? null : sum;
          return invoices;
        });
      }

      function loadSentInvoices() {
        var booking = $scope.booking;
        return invoice2Service.getSent({ person: me.id, booking: booking.id }).then(function (invoices) {

          $scope.sentInvoices = invoices || [];

          var sum = 0;
          var hasError = false;
          angular.forEach(invoices, function (invoice) {
            var invoiceTotal;
            try {
              invoiceTotal = parseFloat(invoice.total);
              sum += invoiceTotal;
            } catch (e) {
              hasError = true;
            }
          });
          $scope.sentInvoicesTotalAmount = hasError ? null : sum;
          return invoices;
        });
      }

    }],
  };

});