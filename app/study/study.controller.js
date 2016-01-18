(function () {
    'use strict';

    angular
        .module('app')
        .controller('StudyController', StudyController);

    StudyController.$inject = ['$location', 'FlashService', '$rootScope', '$http', '$scope', '$timeout'];
    function StudyController($location, FlashService, $rootScope, $http, $scope, $timeout) {
        var vm = this;
        
        var PRE_PROMPT_PAUSE_MILLIS = 2000;
        
        var numberPrompts = {
            demo: [1,2,3,4,5,6,7,8,9],
            live: [11,13,15,17,22,23,34,39,40,47,54,56,60,70,71,74,78,80,82,85,87,90,93,96,99]
        };
        
        vm.submitAnswer = submitAnswer;
        vm.startQuestion = startQuestion;
        vm.endStudy = endStudy;
        vm.startLiveStudy = startLiveStudy;
        
        vm.number = null;
        vm.questionStartTs = null;
        readyForResponse(false);
        vm.demofinished = false;
        vm.livefinished = false;
        vm.acceptInput = false;
        var responseStartTs = -1;
        
        var durationMillis = 0;
        
        setTimeout(function() {startQuestion();}, PRE_PROMPT_PAUSE_MILLIS);

        (function initController() {
            vm.studylanguage = $rootScope.globals.studylanguage;
            vm.mode = $rootScope.globals.mode;
            vm.prompts = _.shuffle(angular.copy(numberPrompts[vm.mode]));
        })();
        
        function startQuestion() {
            vm.number = vm.prompts.pop();
            
            vm.questionStartTs = new Date().getTime();
            
            var audio = new Audio();
            audio.src = '../../audio/' + vm.studylanguage + '/' + vm.number + '.mp3';
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
            if (!vm.acceptInput || !answer) {
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
            
            var ts = new Date().getTime();
            var timeFromStart = ts - vm.questionStartTs;
            var data = {
                'Language': capitaliseFirstLetter(vm.studylanguage),
                'Participant name': $rootScope.globals.participantname,
                'Number prompted': vm.number,
                'Number typed': answer,
                'Time from start of clip, ms': timeFromStart,
                'Time from end of clip, ms': timeFromStart - durationMillis,
                'Correct?': prompt == answer,
                'Clip duration': durationMillis,
                'Mode': vm.mode,
                ' ': ' '
            };//,
//                'First press, from start of clip, ms': ts - responseStartTs,
//                'First press, from end of clip, ms': ts - responseStartTs - durationMillis,
            
            var datastr = $.param(data);
//            console.log(datastr);
            $http.jsonp('https://script.google.com/macros/s/AKfycbzy1IfR7EnffJuxotEutGIsFDMF5q44bLFDVD48GqWE1swlDSE/exec?prefix=JSON_CALLBACK&' + datastr).then(
                function success() {
                    if (vm.prompts.length > 0) {
                        var apiCallDuration = new Date().getTime() - answerSubmitTs;
                        var timeout = apiCallDuration > PRE_PROMPT_PAUSE_MILLIS ? 0 : PRE_PROMPT_PAUSE_MILLIS - apiCallDuration;
                        setTimeout(startQuestion, timeout);
                    }
                    else {
                        if (vm.mode === 'demo')
                            vm.demofinished = true;
                        else
                            vm.livefinished = true;
                    }
                },
                function failure(error) {
                    // TODO retry
                    alert('Unable to send data :( - ' + JSON.stringify(error));
                }
            );
        };
        
        // Hackery... Wasn't working with ng-show and ng-class :(
        function readyForResponse(ready) {
            if (ready) {
                $('.notice').hide();
                $('#answer').removeClass('pleasewait');
                responseStartTs = -1;
            }
            else {
                $('.notice').show();
                $('#answer').addClass('pleasewait');
            }
            vm.acceptInput = ready;
        }
        
        function capitaliseFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }
        
        function endStudy() {
            $location.path('/');
        }
        
        function startLiveStudy() {
            $rootScope.globals.mode = 'live';
            $location.path('/study');
        }
        
        var answerInput = $('form #answer');
        answerInput.focus();
        answerInput.change(function() {
            if (responseStartTs == -1 && vm.acceptInput)
                responseStartTs = new Date().getTime();
        });
    }
})();