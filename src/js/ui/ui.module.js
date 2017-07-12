(function () {
    'use strict';

    angular
        .module(`app.ui`, [])
        .constant(`ui.events`, {
            LEASING_CANCEL: `leasing-cancel`
        });

    angular
        .module(`app.ui`)
        // actual values are set in the application config phase
        .constant(`constants.application`, {
            CLIENT_VERSION: ``,
            NODE_ADDRESS: ``,
            COINOMAT_ADDRESS: ``
        });
})();
