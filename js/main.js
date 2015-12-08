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

        function getStories(page) {
            return $http({
                method: 'GET',
                url: getApiUrl('/stories'),
                data: {page: page === undefined ? 1 : page}
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
        $scope.paging = {
            fetchMore: true,
            nextPage: 1
        };

        $scope.fetchStories = function() {
            if ($scope.paging.fetchMore) {
                $log.info("Fetching more items...");
                StoryService.actions.getStories($scope.paging.nextPage).then(
                    function(successPayload) {
                        $scope.paging.fetchMore = !successPayload.data.last;
                        $scope.paging.nextPage = !successPayload.data.last ? $scope.paging.nextPage + 1 : $scope.paging.nextPage;
                        var newStories = successPayload.data.content;
                        newStories.forEach(function(s) {
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
        }

        $scope.fetchStories(); // initial fetch
    }

})();
