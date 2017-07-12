(function () {
    'use strict';

    const DEFAULT_AMOUNT_TO_PAY = 50;

    function FiatCurrency(code, displayName) {
        this.code = code;
        if (displayName) {
            this.displayName = displayName;
        } else {
            this.displayName = code;
        }
    }

    function CardDeposit($scope, $window, $q, events, dialogService,
                         fiatService, applicationContext, notificationService) {

        const ctrl = this;
        let deferred;

        ctrl.currencies = [new FiatCurrency(`EURO`, `Euro`), new FiatCurrency(`USD`)];
        ctrl.limits = Object.create(null);
        ctrl.updateReceiveAmount = updateReceiveAmount;
        ctrl.updateLimitsAndReceiveAmount = updateLimitsAndReceiveAmount;
        ctrl.redirectToMerchant = redirectToMerchant;

        reset();

        $scope.$on(events.WALLET_CARD_DEPOSIT, (event, eventData) => {
            dialogService.open(`#card-deposit-dialog`);

            reset();
            ctrl.crypto = eventData.currency;

            updateLimitsAndReceiveAmount();
        });

        function reset() {
            ctrl.payAmount = DEFAULT_AMOUNT_TO_PAY;
            ctrl.payCurrency = ctrl.currencies[0];
            ctrl.crypto = {};
            ctrl.getAmount = ``;
        }

        function updateLimitsAndReceiveAmount() {
            fiatService.getLimits(applicationContext.account.address, ctrl.payCurrency.code, ctrl.crypto)
                .then((response) => {
                    ctrl.limits = {
                        min: Number(response.min),
                        max: Number(response.max)
                    };

                    if (ctrl.payAmount < ctrl.limits.min) {
                        ctrl.payAmount = ctrl.limits.min;
                    } else if (ctrl.payAmount > ctrl.limits.max) {
                        ctrl.payAmount = ctrl.limits.max;
                    }
                })
                .catch((response) => {
                    remotePartyErrorHandler(`get limits`, response);
                });

            updateReceiveAmount();
        }

        function remotePartyErrorHandler(operationName, response) {
            if (response) {
                if (response.data) {
                    notificationService.error(response.data.message);
                } else if (response.statusText) {
                    notificationService.error(`Failed to ${operationName}. Error code: ${response.status
                    }<br/>Message: ${response.statusText}`);
                }
            } else {
                notificationService.error(`Operation failed: ${operationName}`);
            }
        }

        function updateReceiveAmount() {
            if (deferred) {
                deferred.reject();
                deferred = undefined;
            }

            const amount = Number(ctrl.payAmount);
            if (isNaN(amount) || ctrl.payAmount <= 0) {
                ctrl.getAmount = ``;
                return;
            }

            deferred = $q.defer();
            deferred.promise.then((response) => {
                if (response) {
                    ctrl.getAmount = `${response} ${ctrl.crypto.shortName}`;
                } else {
                    ctrl.getAmount = ``;
                }
            }).catch((value) => {
                if (value) {
                    remotePartyErrorHandler(`get rates`, value);
                }
            });

            fiatService.getRate(applicationContext.account.address, ctrl.payAmount, ctrl.payCurrency.code, ctrl.crypto)
                .then(deferred.resolve)
                .catch(deferred.reject);
        }

        function redirectToMerchant() {
            try {
                validateAmountToPay();

                const url = fiatService.getMerchantUrl(
                    applicationContext.account.address,
                    ctrl.payAmount, ctrl.payCurrency.code, ctrl.crypto
                );

                $window.open(url, `_blank`);

                return true;
            } catch (e) {
                notificationService.error(e.message);
                return false;
            }
        }

        function validateAmountToPay() {
            if (Number(ctrl.payAmount) < ctrl.limits.min) {
                throw new Error(`Minimum amount to pay is ${ctrl.limits.min} ${ctrl.payCurrency.displayName}`);
            }
            if (Number(ctrl.payAmount) > ctrl.limits.max) {
                throw new Error(`Maximum amount to pay is ${ctrl.limits.max} ${ctrl.payCurrency.displayName}`);
            }
        }
    }

    CardDeposit.$inject = [
        `$scope`, `$window`, `$q`, `wallet.events`, `dialogService`,
        `coinomatFiatService`, `applicationContext`, `notificationService`
    ];

    angular
        .module(`app.wallet`)
        .controller(`cardDepositController`, CardDeposit);
})();
