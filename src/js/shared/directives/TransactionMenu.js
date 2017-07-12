(function () {
    'use strict';

    const ADDRESS_STUB = `n/a`;

    function TransactionMenu($scope, constants, events, notificationService) {
        const ctrl = this;

        ctrl.idCopied = idCopied;
        ctrl.dataCopied = dataCopied;
        ctrl.fullTransactionData = fullTransactionData;
        ctrl.hasRecipient = hasRecipient;
        ctrl.addressCopied = addressCopied;
        ctrl.isLeasing = isLeasing;
        ctrl.cancelLeasing = cancelLeasing;

        function addressCopied() {
            return notificationService.notice(`Address has been copied`);
        }

        function idCopied() {
            notificationService.notice(`Transaction ID has been copied`);
        }

        function dataCopied() {
            notificationService.notice(`Full transaction data have been copied`);
        }

        function hasRecipient() {
            return !!ctrl.transaction.recipient;
        }

        function isLeasing() {
            return ctrl.transaction.type === constants.START_LEASING_TRANSACTION_TYPE;
        }

        function cancelLeasing() {
            $scope.$emit(events.LEASING_CANCEL, {
                startLeasingTransaction: ctrl.transaction
            });
        }

        function fullTransactionData() {
            const recipient = hasRecipient() ? ctrl.transaction.recipient : ADDRESS_STUB;
            let attachment = ``;
            if (ctrl.transaction.attachment) {
                attachment = ` | ATTACHMENT: ${ctrl.transaction.attachment}`;
            }

            return `TX ID: ${ctrl.transaction.id
            } | TYPE: ${ctrl.transaction.formatted.type
            } | DATE: ${ctrl.transaction.formatted.datetime
            } | SENDER ADDRESS: ${ctrl.transaction.sender
            } | TX AMOUNT: ${ctrl.transaction.formatted.amount} ${ctrl.transaction.formatted.asset
            } | RECIPIENT ADDRESS: ${recipient
            } | TX FEE: ${ctrl.transaction.formatted.fee} ${ctrl.transaction.formatted.feeAsset.displayName
            }${ctrl.transaction.formatted.feeAsset.id ? ` (${ctrl.transaction.formatted.feeAsset.id})` : ``
            }${attachment}`;
        }
    }

    TransactionMenu.$inject = [`$scope`, `constants.transactions`, `ui.events`, `notificationService`];

    angular
        .module(`app.shared`)
        .component(`txMenu`, {
            controller: TransactionMenu,
            bindings: {
                transaction: `<`
            },
            templateUrl: `shared/transaction.menu.component`
        });
})();
