(function () {
    'use strict';

    angular
        .module('app')
        .controller('ParticipantInfoController', ParticipantInfoController);

    ParticipantInfoController.$inject = ['$location', 'UserService', '$rootScope'];
    function ParticipantInfoController($location, UserService, $rootScope) {
        var vm = this;

        vm.user = null;
        vm.startStudy = startStudy;
        vm.testAudio = testAudio;
        
        initController();

        function initController() {
            
        }

        function startStudy() {
            $rootScope.globals.participantname = vm.participantname;
            $rootScope.globals.mode = 'demo';
            $location.path('/demo');
        }
        
        function testAudio() {
            var audio = new Audio('../../audio/english/1.mp3');
            audio.play();
        }
    }

})();