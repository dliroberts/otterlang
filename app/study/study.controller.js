(function () {
    'use strict';

    angular
        .module('app')
        .controller('StudyController', StudyController);

    StudyController.$inject = ['$location', 'FlashService', '$rootScope', '$http'];
    function StudyController($location, FlashService, $rootScope, $http) {
        var vm = this;
        
        var numberPrompts = {
            english: [1,2,3,4],
            french: [1,2,3]
        };
        
        vm.submitAnswer = submitAnswer;
        vm.startQuestion = startQuestion;
        vm.endStudy = endStudy;
        
        vm.number = null;
        vm.questionStartTs = null;
        vm.inputdisabled = true;
        vm.finished = false;
        
        setTimeout(function() {startQuestion();}, 3000);

        (function initController() {
            vm.studylanguage = $rootScope.globals.studylanguage;
            vm.prompts = _.shuffle(angular.copy(numberPrompts[vm.studylanguage]));
        })();
        
        function startQuestion() {
            vm.number = vm.prompts.pop();
            
            var extension = '.mp3';
            if (vm.studylanguage == 'english') extension = '.wav'; // hackery
            
            var audio = new Audio('../../audio/' + vm.studylanguage + '/' + vm.number + extension);
            vm.questionStartTs = new Date().getTime();
            vm.inputdisabled = false;
            audio.play();
        }

        function submitAnswer() {
            var participantname = $rootScope.globals.participantname;
            var dateofbirth = $rootScope.globals.dateofbirth;
            var todaysdate = $rootScope.globals.todaysdate;
            var prompt = vm.number;
            var answer = vm.answer;
            var correct = prompt == answer;
            var timeFromQuestionStart = new Date().getTime() - vm.questionStartTs;
            // TODO determine length of audio file!
            
            vm.inputdisabled = true;
            $('form #answer').val('');
            
            var data = {
                'Language': vm.studylanguage,
                'Participant name': $rootScope.globals.participantname,
                'Number prompted': vm.number,
                'Number typed': vm.answer,
                'Correct?': prompt == answer,
                'Time from start of prompt, ms': new Date().getTime() - vm.questionStartTs,
                'Time from end of prompt, ms': '' // TODO determine length of audio file!
            };
            
            var datastr = $.param(data);
            $http.jsonp('https://script.google.com/macros/s/AKfycbzy1IfR7EnffJuxotEutGIsFDMF5q44bLFDVD48GqWE1swlDSE/exec?prefix=JSON_CALLBACK&' + datastr).then(
                function success() {
                    if (vm.prompts.length > 0)
                        setTimeout(startQuestion, 3000);
                    else {
                        vm.finished = true;
                    }
                },
                function failure(error) {
                    alert('Unable to send data :( - ' + error);
                }
            );
        };

        function endStudy() {
            $location.path('/');
        }
        
        $('form #answer').focus();
    }
})();