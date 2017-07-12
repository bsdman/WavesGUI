(function () {
    'use strict';

    angular
        .module(`app.portfolio`)
        .directive(`fileSelect`, [function WavesFileSelect() {
            return {
                restrict: `A`,
                scope: {
                    fileHandler: `&`
                },
                link: function (scope, element) {
                    element.on(`change`, (changeEvent) => {
                        const files = changeEvent.target.files;
                        if (files.length) {
                            scope.fileHandler({file: files[0]});
                        }
                    });
                }
            };
        }]);
})();
