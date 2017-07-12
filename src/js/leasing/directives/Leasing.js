(function () {
    'use strict';

    const POLLING_DELAY = 5000;
    const DEFAULT_ERROR_MESSAGE = `Failed to load balance details`;

    function Leasing($interval, constants, applicationContext, leasingService, transactionLoadingService,
                     notificationService) {

        const ctrl = this;

        ctrl.transactions = [];
        ctrl.limitTo = 1000;
        ctrl.balanceDetails = null;

        refreshAll();

        const intervalPromise = $interval(refreshAll, POLLING_DELAY);
        ctrl.$onDestroy = function () {
            $interval.cancel(intervalPromise);
        };

        function refreshAll() {
            refreshBalanceDetails();
            refreshLeasingTransactions();
        }

        function refreshBalanceDetails() {
            leasingService
                .loadBalanceDetails(applicationContext.account.address)
                .then((balanceDetails) => {
                    ctrl.balanceDetails = balanceDetails;
                })
                .catch((e) => {
                    if (e) {
                        if (e.data) {
                            notificationService.error(e.data.message);
                        } else if (e.message) {
                            notificationService.error(e.message);
                        } else if (e.statusText) {
                            notificationService.error(e.statusText);
                        } else {
                            notificationService.error(DEFAULT_ERROR_MESSAGE);
                        }
                    } else {
                        notificationService.error(DEFAULT_ERROR_MESSAGE);
                    }
                });
        }

        function refreshLeasingTransactions() {
            transactionLoadingService
                .loadTransactions(applicationContext.account, ctrl.limitTo)
                .then((transactions) => {
                    ctrl.transactions = transactions.filter((tx) => {
                        const startLeasing = constants.START_LEASING_TRANSACTION_TYPE;
                        const cancelLeasing = constants.CANCEL_LEASING_TRANSACTION_TYPE;
                        return tx.type === startLeasing || tx.type === cancelLeasing;
                    });
                });
        }
    }

    Leasing.$inject = [
        `$interval`, `constants.transactions`, `applicationContext`, `leasingService`, `transactionLoadingService`,
        `notificationService`
    ];

    angular
        .module(`app.leasing`)
        .component(`wavesLeasing`, {
            controller: Leasing,
            templateUrl: `leasing/component`
        });
})();
