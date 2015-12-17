(function () {
    'use strict';

    angular
        .module('app')
        .controller('StudyController', StudyController);

    StudyController.$inject = ['$location', 'FlashService', '$rootScope', '$http', '$scope', '$timeout'];
    function StudyController($location, FlashService, $rootScope, $http, $scope, $timeout) {
        var vm = this;
        
        var PRE_PROMPT_PAUSE_MILLIS = 2500;
        
        var numberPrompts = {
            english: [1,2,3,4],
            french: [1,2,3]
        };
        
        vm.submitAnswer = submitAnswer;
        vm.startQuestion = startQuestion;
        vm.endStudy = endStudy;
        
        vm.number = null;
        vm.questionStartTs = null;
        readyForResponse(false);
        vm.finished = false;
        vm.acceptInput = false;
        
        var durationMillis = 0;
        
        setTimeout(function() {startQuestion();}, PRE_PROMPT_PAUSE_MILLIS);

        (function initController() {
            vm.studylanguage = $rootScope.globals.studylanguage;
            vm.prompts = _.shuffle(angular.copy(numberPrompts[vm.studylanguage]));
        })();
        
        function startQuestion() {
            vm.number = vm.prompts.pop();
            
            var extension = '.mp3';
            if (vm.studylanguage == 'english') extension = '.wav'; // hackery
            
            vm.questionStartTs = new Date().getTime();
            
            var audio = new Audio();
            audio.src = '../../audio/' + vm.studylanguage + '/' + vm.number + extension;
            audio.addEventListener('loadedmetadata', function() {
                audio.play(); 
                readyForResponse(true);
                durationMillis = Math.round(audio.duration * 1000);
//                console.log('duration = ' + durationMillis);
            });
        }

        function submitAnswer() {
            var answer = vm.answer;
            $('form #answer').val('');
            if (!vm.acceptInput) {
                console.log('throwing away superfluous enter');
                return;
            }
            
            var participantname = $rootScope.globals.participantname;
            var dateofbirth = $rootScope.globals.dateofbirth;
            var todaysdate = $rootScope.globals.todaysdate;
            var prompt = vm.number;
            var correct = prompt == answer;
            var answerSubmitTs = new Date().getTime();
            var timeFromQuestionStart = answerSubmitTs - vm.questionStartTs;
            
            // TODO determine length of audio file!
            
            readyForResponse(false);
            
            var timeFromStart = new Date().getTime() - vm.questionStartTs;
            var data = {
                'Language': vm.studylanguage,
                'Participant name': $rootScope.globals.participantname,
                'Number prompted': vm.number,
                'Number typed': answer,
                'Time from start of clip, ms': timeFromStart,
                'Time from end of clip, ms': timeFromStart - durationMillis,
                'Correct?': prompt == answer,
                'Clip duration': durationMillis,
                ' ': ''
            };
            
            var datastr = $.param(data);
            console.log(datastr);
            $http.jsonp('https://script.google.com/macros/s/AKfycbzy1IfR7EnffJuxotEutGIsFDMF5q44bLFDVD48GqWE1swlDSE/exec?prefix=JSON_CALLBACK&' + datastr).then(
                function success() {
                    if (vm.prompts.length > 0) {
                        var apiCallDuration = new Date().getTime() - answerSubmitTs;
                        var timeout = apiCallDuration > PRE_PROMPT_PAUSE_MILLIS ? 0 : PRE_PROMPT_PAUSE_MILLIS - apiCallDuration;
                        setTimeout(startQuestion, timeout);
                    }
                    else {
                        vm.finished = true;
                    }
                },
                function failure(error) {
                    alert('Unable to send data :( - ' + JSON.stringify(error));
                }
            );
        };
        
        // Hackery... Wasn't working with ng-show and ng-class :(
        function readyForResponse(ready) {
            if (ready) {
                $('.notice').hide();
                $('#answer').removeClass('pleasewait');
            }
            else {
                $('.notice').show();
                $('#answer').addClass('pleasewait');
            }
            vm.acceptInput = ready;
        }

        function endStudy() {
            $location.path('/');
        }
        
        $('form #answer').focus();
    }
})();