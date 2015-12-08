(function () {
    'use strict';

    moment.locale('pl');

    angular
    .module('maziaj', [])
    .constant('MAZIAJ_CONFIG', {
        apiConfig: {
            secure: false,
            host: 'api-maziaj.herokuapp.com',
            port: null
        }
    });

    /* SERVICES */

    angular
    .module('maziaj')
    .factory('StoryService', StoryService);

    StoryService.$inject = ['$http', '$log', '$timeout', 'MAZIAJ_CONFIG'];

    function StoryService($http, $log, $timeout, MAZIAJ_CONFIG) {
        var StoryService = {
            data: {},
            actions: {
                getStories: getStories,
                getFrame: getFrame
            }
        };

        return StoryService;

        function getApiUrl(endpoint) {
            return (MAZIAJ_CONFIG.apiConfig.secure ? 'https' : 'http') + "://" + MAZIAJ_CONFIG.apiConfig.host + endpoint;
        }

        function _getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        function getStories() {
            return $http({
                method: 'GET',
                url: getApiUrl('/stories')
            })
            .success(function(data, status, headers, config) {})
            .error(function(data, status, headers, config) {});
        }

        function getFrame(storyId, frameId) {
            return $http({
                method: 'GET',
                url: getApiUrl('/stories/'+storyId+'/frame/'+frameId)
            })
            .success(function(data, status, headers, config) {})
            .error(function(data, status, headers, config) {});
        }
    }

    /* CONTROLLERS */

    angular
    .module('maziaj')
    .controller('StoryListController', StoryListController);

    StoryListController.$inject = ['$scope', '$log', '$timeout', 'StoryService'];

    function StoryListController($scope, $log, $timeout, StoryService) {
        $scope.stories = [];

        StoryService.actions.getStories().then(
            function(successPayload) {
                $log.info(successPayload);

                var newStories = successPayload.data.content;
                newStories.forEach(function(s) {
                    $log.info(s);
                    var frameIndex = 0,
                        newStory = {
                            id: s.id,
                            displayId: s.id.substring(0, s.id.length/2),
                            creationDate: moment(new Number(s.creationDate)).fromNow(),
                            framesCount: s.frames.length,
                            frames: s.frames,
                            detailedFrames: {}
                        };

                    // add story to list and start fetching frames
                    $scope.stories.push(newStory);
                    newStory.frames.forEach(function(f) {
                        StoryService.actions.getFrame(s.id, f).then(
                            function(successPayload) {
                                $log.info(successPayload);
                                successPayload.data.creationDate.pop();
                                newStory.detailedFrames[f] = {
                                    id: successPayload.data.author,
                                    author: successPayload.data.author,
                                    creationDate: moment(new Number(successPayload.data.creationDate)).fromNow(),
                                    type: successPayload.data.type,
                                    image: successPayload.data.image || undefined,
                                    caption: successPayload.data.caption || undefined
                                };
                            },
                            function(errorPayload) {}
                        );
                    });
                })
            },
            function(errorPayload) {
                $log.error(errorPayload);
            }
        );
    }

})();
