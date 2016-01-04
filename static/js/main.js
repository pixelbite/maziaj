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
        function ($routeProvider) {
            $routeProvider.
            when('/', {
                templateUrl: 'partials/story-list.html'
            }).
            when('/co-to', {
                templateUrl: 'partials/about.html'
            }).
            when('/historyjka/:storyId', {
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

    StoryService.$inject = ['$http', 'MAZIAJ_CONFIG'];

    function StoryService($http, MAZIAJ_CONFIG) {
        return {
            data: {},
            actions: {
                getStories: getStories,
                getStory: getStory,
                getFrame: getFrame,
                likeStory: likeStory
            }
        };

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
                    sort: 'creationDate,desc',
                    minFrames: minFrames ? minFrames : 5
                }
            })
                .success(function (data, status, headers, config) {
                })
                .error(function (data, status, headers, config) {
                });
        }

        function getStory(storyId) {
            return $http({
                method: 'GET',
                url: _getApiUrl('/stories/' + storyId)
            })
                .success(function (data, status, headers, config) {
                })
                .error(function (data, status, headers, config) {
                });
        }

        function getFrame(storyId, frameId) {
            return $http({
                method: 'GET',
                url: _getApiUrl('/stories/' + storyId + '/frame/' + frameId)
            })
                .success(function (data, status, headers, config) {
                })
                .error(function (data, status, headers, config) {
                });
        }

        function likeStory(storyId) {
            return $http({
                method: 'PUT',
                url: _getApiUrl('/stories/' + storyId + '/like')
            })
                .success(function (data, status, headers, config) {
                })
                .error(function (data, status, headers, config) {
                });
        }
    }

    /* CONTROLLERS */

    angular
        .module('maziaj')
        .controller('StoryListController', StoryListController);

    StoryListController.$inject = ['$scope', '$log', 'StoryService'];

    function StoryListController($scope, $log, StoryService) {
        $scope.stories = [];
        $scope.paging = {
            initial: true,
            fetchMore: true,
            fetching: true,
            nextPage: 0
        };

        $scope.fetchStories = function () {
            if ($scope.paging.fetchMore) {
                $log.info("Fetching more items...");
                $scope.paging.fetching = true;
                StoryService.actions.getStories($scope.paging.nextPage).then(
                    function (successPayload) {
                        $scope.paging.initial = false;
                        $scope.paging.fetchMore = !successPayload.data.last;
                        $scope.paging.nextPage = !successPayload.data.last ? $scope.paging.nextPage + 1 : $scope.paging.nextPage;
                        var newStories = successPayload.data.content;
                        newStories.forEach(function (story) {
                            var newStory = {
                                id: story.id,
                                creationDate: moment(story.creationDate).fromNow(),
                                framesCount: story.frames.length,
                                frames: story.frames.slice(0, story.frames.length > 5 ? 5 : story.frames.length),
                                detailedFrames: {},
                                likes: story.likes
                            };

                            // add story to list and start fetching frames
                            $scope.stories.push(newStory);
                            newStory.frames.forEach(function (f) {
                                StoryService.actions.getFrame(story.id, f).then(
                                    function (successPayload) {
                                        newStory.detailedFrames[f] = {
                                            id: successPayload.data.id,
                                            author: successPayload.data.author,
                                            creationDate: moment(successPayload.data.creationDate).fromNow(),
                                            type: successPayload.data.type,
                                            image: successPayload.data.image,
                                            caption: successPayload.data.caption
                                        };
                                    },
                                    function (errorPayload) {
                                    }
                                );
                            });
                            $scope.paging.fetching = false;
                        })
                    },
                    function (errorPayload) {
                        $log.error(errorPayload);
                    }
                );
            }
        };

        $scope.fetchStories(); // initial fetch
    }

    angular
        .module('maziaj')
        .controller('StoryDetailsController', StoryDetailsController);

    StoryDetailsController.$inject = ['$scope', '$log', '$routeParams', 'StoryService'];

    function StoryDetailsController($scope, $log, $routeParams, StoryService) {
        $scope.story = {
            id: $routeParams.storyId
        };
        $scope.like = {
            liked: false,
            requested: false
        };

        $log.info("Fetching story details...");
        StoryService.actions.getStory($routeParams.storyId).then(
            function (successPayload) {
                $scope.story = {
                    id: successPayload.data.id,
                    creationDate: moment(successPayload.data.creationDate).fromNow(),
                    framesCount: successPayload.data.frames.length,
                    frames: successPayload.data.frames,
                    likes: successPayload.data.likes,
                    detailedFrames: {}
                };
                $log.info("Fetched.");
                $('h3.head-affix').affix({offset: 15});
                $scope.story.frames.forEach(function (f) {
                    StoryService.actions.getFrame($scope.story.id, f).then(
                        function (successPayload) {
                            $scope.story.detailedFrames[f] = {
                                id: successPayload.data.id,
                                author: successPayload.data.author,
                                creationDate: moment(successPayload.data.creationDate).fromNow(),
                                type: successPayload.data.type,
                                image: successPayload.data.image,
                                caption: successPayload.data.caption
                            };
                        },
                        function (errorPayload) {
                        }
                    );
                });
            },
            function (errorPayload) {
            }
        );

        $scope.likeThisStory = function () {
            if (!$scope.like.requested && !$scope.like.liked) {
                $scope.like.requested = true;
                StoryService.actions.likeStory($scope.story.id).then(
                    function (successPayload) {
                        $log.info(successPayload);
                        $scope.like.liked = true;
                        $scope.story.likes = successPayload.data;
                    },
                    function (errorPayload) {
                    }
                );
            }
        }
    }

})();
