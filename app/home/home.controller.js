(function () {
    'use strict';

    angular
        .module('app')
        .controller('HomeController', HomeController);

    HomeController.$inject = ['$location', 'UserService', '$rootScope'];
    function HomeController($location, UserService, $rootScope) {
        var vm = this;

        vm.user = null;
        vm.participantInfo = participantInfo;

        initController();

        function initController() {
            loadCurrentUser();
        }

        function participantInfo(lang) {
            $rootScope.globals.studylanguage = lang;
            $location.path('/participantinfo');
        }

        function loadCurrentUser() {
            UserService.GetByUsername($rootScope.globals.currentUser.username)
                .then(function (user) {
                    vm.user = user;
                });
        }
    }

})();