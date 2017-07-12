(function () {
    'use strict';

    const ASSET_DESCRIPTION_MAX = 1000;
    const ASSET_NAME_MIN = 4;
    const ASSET_NAME_MAX = 16;
    const TOKEN_DECIMALS_MAX = 8;
    const FIXED_ISSUE_FEE = new Money(1, Currency.WAVES);

    function TokenCreate($scope, $interval, constants, applicationContext, assetService, dialogService, apiService,
                         notificationService, formattingService, transactionBroadcast) {

        const ctrl = this;
        const refreshDelay = 15 * 1000;
        let refreshPromise;

        $scope.$on(`$destroy`, () => {
            if (angular.isDefined(refreshPromise)) {
                $interval.cancel(refreshPromise);
                refreshPromise = undefined;
            }
        });

        ctrl.wavesBalance = new Money(0, Currency.WAVES);
        ctrl.issuanceValidationOptions = {
            rules: {
                assetName: {
                    required: true,
                    minbytelength: ASSET_NAME_MIN,
                    maxbytelength: ASSET_NAME_MAX
                },
                assetDescription: {
                    maxbytelength: ASSET_DESCRIPTION_MAX
                },
                assetTotalTokens: {
                    required: true,
                    min: 0
                },
                assetTokenDecimalPlaces: {
                    required: true,
                    min: 0,
                    max: TOKEN_DECIMALS_MAX
                }
            },
            messages: {
                assetName: {
                    required: `Asset name is required`,
                    minbytelength: `Asset name is too short. Please give your asset a longer name`,
                    maxbytelength: `Asset name is too long. Please give your asset a shorter name`
                },
                assetDescription: {
                    maxbytelength: `Maximum length of asset description exceeded. Please make a shorter description`
                },
                assetTotalTokens: {
                    required: `Total amount of issued tokens in required`,
                    min: `Total issued tokens amount must be greater than or equal to zero`
                },
                assetTokenDecimalPlaces: {
                    required: `Number of token decimal places is required`,
                    min: `Number of token decimal places must be greater or equal to zero`,
                    max: `Number of token decimal places must be less than or equal to ${TOKEN_DECIMALS_MAX}`
                }
            }
        };
        ctrl.asset = {
            fee: FIXED_ISSUE_FEE
        };
        ctrl.confirm = {};
        ctrl.broadcast = new transactionBroadcast.instance(apiService.assets.issue,
            ((transaction, response) => {
                resetForm();

                applicationContext.cache.putAsset(response);

                const displayMessage = `Asset ${ctrl.confirm.name} has been issued!<br/>` +
                    `Total tokens amount: ${ctrl.confirm.totalTokens}<br/>` +
                    `Date: ${formattingService.formatTimestamp(transaction.timestamp)}`;
                notificationService.notice(displayMessage);
            }));
        ctrl.broadcastIssueTransaction = broadcastIssueTransaction;
        ctrl.assetIssueConfirmation = assetIssueConfirmation;
        ctrl.resetForm = resetForm;

        loadDataFromBackend();
        resetForm();

        function assetIssueConfirmation(form, event) {
            event.preventDefault();

            if (!form.validate()) {
                return;
            }

            if (ctrl.asset.fee.greaterThan(ctrl.wavesBalance)) {
                notificationService.error(`Not enough funds for the issue transaction fee`);
                return;
            }

            const decimalPlaces = Number(ctrl.asset.decimalPlaces);
            const maxTokens = Math.floor(constants.JAVA_MAX_LONG / Math.pow(10, decimalPlaces));
            if (ctrl.asset.totalTokens > maxTokens) {
                notificationService.error(`Total issued tokens amount must be less than ${maxTokens}`);

                return;
            }

            const asset = {
                name: ctrl.asset.name,
                description: ctrl.asset.description,
                totalTokens: ctrl.asset.totalTokens,
                decimalPlaces: Number(ctrl.asset.decimalPlaces),
                reissuable: ctrl.asset.reissuable,
                fee: ctrl.asset.fee
            };

            const sender = {
                publicKey: applicationContext.account.keyPair.public,
                privateKey: applicationContext.account.keyPair.private
            };

            ctrl.confirm.name = ctrl.asset.name;
            ctrl.confirm.totalTokens = ctrl.asset.totalTokens;
            ctrl.confirm.reissuable = ctrl.asset.reissuable ? `RE-ISSUABLE` : `NON RE-ISSUABLE`;

            ctrl.broadcast.setTransaction(assetService.createAssetIssueTransaction(asset, sender));

            dialogService.open(`#create-asset-confirmation`);
        }

        function broadcastIssueTransaction() {
            ctrl.broadcast.broadcast();
        }

        function resetForm() {
            ctrl.asset.name = ``;
            ctrl.asset.description = ``;
            ctrl.asset.totalTokens = `0`;
            ctrl.asset.decimalPlaces = `0`;
            ctrl.asset.reissuable = false;
        }

        function loadDataFromBackend() {
            refreshBalance();

            refreshPromise = $interval(() => {
                refreshBalance();
            }, refreshDelay);
        }

        function refreshBalance() {
            apiService.address.balance(applicationContext.account.address)
                .then((response) => {
                    ctrl.wavesBalance = Money.fromCoins(response.balance, Currency.WAVES);
                });
        }
    }

    TokenCreate.$inject = [
        `$scope`, `$interval`, `constants.ui`, `applicationContext`, `assetService`, `dialogService`, `apiService`,
        `notificationService`, `formattingService`, `transactionBroadcast`
    ];

    angular
        .module(`app.tokens`)
        .controller(`tokenCreateController`, TokenCreate);
})();
