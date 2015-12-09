(function () {
    'use strict';

    moment.locale('pl');

    angular
    .module('maziaj', ['ngRoute'])
    .constant('MAZIAJ_CONFIG', {
        apiConfig: {
            secure: false,
            host: 'api-maziaj.herokuapp.com',
            port: null
        }
    }).config(['$routeProvider',
        function($routeProvider) {
            $routeProvider.
            when('/', {
                templateUrl: 'partials/about.html'
            }).
            when('/historyjki', {
                templateUrl: 'partials/story-list.html'
            }).
            when('/historyjki/:storyId', {
                templateUrl: 'partials/story-details.html'
            }).
            otherwise({
                redirectTo: '/'
            });
        }
    ]);

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
                getStory: getStory,
                getFrame: getFrame
            }
        };

        return StoryService;

        function _getApiUrl(endpoint) {
            return (MAZIAJ_CONFIG.apiConfig.secure ? 'https' : 'http') + "://" + MAZIAJ_CONFIG.apiConfig.host + endpoint;
        }

        function _getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        function getStories(page, minFrames) {
            return $http({
                method: 'GET',
                url: _getApiUrl('/stories'),
                params: {
                    page: page ? page : 0,
                    minFrames: minFrames ? minFrames : 5
                }
            })
            .success(function(data, status, headers, config) {})
            .error(function(data, status, headers, config) {});
        }

        function getStory(storyId) {
            return $http({
                method: 'GET',
                url: _getApiUrl('/stories/'+storyId)
            })
            .success(function(data, status, headers, config) {})
            .error(function(data, status, headers, config) {});
        }

        function getFrame(storyId, frameId) {
            return $http({
                method: 'GET',
                url: _getApiUrl('/stories/'+storyId+'/frame/'+frameId)
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
            initial: true,
            fetchMore: true,
            fetching: true,
            nextPage: 0
        };

        $scope.fetchStories = function() {
            if ($scope.paging.fetchMore) {
                $log.info("Fetching more items...");
                $scope.paging.fetching = true;
                StoryService.actions.getStories($scope.paging.nextPage).then(
                    function(successPayload) {
                        $scope.paging.initial = false;
                        $scope.paging.fetchMore = !successPayload.data.last;
                        $scope.paging.nextPage = !successPayload.data.last ? $scope.paging.nextPage + 1 : $scope.paging.nextPage;
                        var newStories = successPayload.data.content;
                        newStories.forEach(function(s) {
                            var frameIndex = 0,
                                newStory = {
                                    id: s.id,
                                    creationDate: moment(new Number(s.creationDate)).fromNow(),
                                    framesCount: s.frames.length,
                                    frames: s.frames.slice(0, s.frames.length > 5 ? 4 : s.frames.length),
                                    detailedFrames: {}
                                };

                            // add story to list and start fetching frames
                            $scope.stories.push(newStory);
                            newStory.frames.forEach(function(f) {
                                StoryService.actions.getFrame(s.id, f).then(
                                    function(successPayload) {
                                        newStory.detailedFrames[f] = {
                                            id: successPayload.data.id,
                                            author: successPayload.data.author,
                                            creationDate: moment(new Number(successPayload.data.creationDate)).fromNow(),
                                            type: successPayload.data.type,
                                            image: successPayload.data.image,
                                            caption: successPayload.data.caption
                                        };
                                    },
                                    function(errorPayload) {}
                                );
                            });
                            $scope.paging.fetching = false;
                        })
                    },
                    function(errorPayload) {
                        $log.error(errorPayload);
                    }
                );
            }
        }

        $scope.fetchStories(); // initial fetch
    };

    angular
    .module('maziaj')
    .controller('StoryDetailsController', StoryDetailsController);

    StoryDetailsController.$inject = ['$scope', '$log', '$timeout', '$routeParams', 'StoryService'];

    function StoryDetailsController($scope, $log, $timeout, $routeParams, StoryService) {
        $scope.story = {
            id: $routeParams.storyId
        };

        $log.info("Fetching story details...");
        StoryService.actions.getStory($routeParams.storyId).then(
            function(successPayload) {
                $scope.story = {
                    id: successPayload.data.id,
                    creationDate: moment(new Number(successPayload.data.creationDate)).fromNow(),
                    framesCount: successPayload.data.frames.length,
                    frames: successPayload.data.frames,
                    detailedFrames: {}
                };
                $scope.story.frames.forEach(function(f) {
                    StoryService.actions.getFrame($scope.story.id, f).then(
                        function(successPayload) {
                            $scope.story.detailedFrames[f] = {
                                id: successPayload.data.id,
                                author: successPayload.data.author,
                                creationDate: moment(new Number(successPayload.data.creationDate)).fromNow(),
                                type: successPayload.data.type,
                                image: successPayload.data.image,
                                caption: successPayload.data.caption
                            };
                        },
                        function(errorPayload) {}
                    );
                });
            },
            function(errorPayload) {}
        );
    };

})();
