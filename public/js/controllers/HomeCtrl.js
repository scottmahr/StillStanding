var app = angular.module("stillstanding");

app.controller('HomeCtrl', function ($scope,$interval,$timeout,$location,Restangular,BTLE,BTData) {

    $scope.m = {
        userList:[
            {name:"Scott",icon:"oldman",standingIcon:"oldman",lastTime:'40'},
            {name:"Jacob",icon:"oldman",standingIcon:"oldman",lastTime:'15'},
            {name:"Sally",icon:"woman",standingIcon:"woman",lastTime:'5'},
            ],
        cUserIdx: 0
    };
    $scope.d = BTData;

    $scope.usersBase = Restangular.all('users');

    

    $scope.loadData = function(){
        
        $scope.userList = $scope.usersBase.getList();
        $scope.userList.then(function(usersResult) {
            console.log("got data")
            $scope.m.userList = usersResult;
            //$scope.$broadcast('update', {} );
            //console.log($scope.m.usersEnt)
        });

    }

    $scope.standing = function(){
        console.log('we are standing now')
        BTData.elevOffset = BTData.elevOffset+BTData.height;
    }

    $scope.connect = function(){
        console.log('connecting');
        BTLE.initFormCollar();
    }

    $scope.reset = function(){
        console.log('connecting');
        BTLE.resetTouch();
    }

    $scope.changeUser = function(){
        $scope.m.cUserIdx = ($scope.m.cUserIdx+1)%$scope.m.userList.length;
    }

    $scope.save = function(){
        $scope.m.usersEnt.put().then(function(){console.log('saved')});
    }


    $scope.loadData();

    $scope.$on('newPosition', function (event, data) {
        if(data.fallen){
            $scope.m.userList[$scope.m.cUserIdx].icon = "falling";
        }else{
            $scope.m.userList[$scope.m.cUserIdx].icon = $scope.m.userList[$scope.m.cUserIdx].standingIcon;
        }
        $scope.m.userList[$scope.m.cUserIdx].lastDataTime = (new Date()).getTime();

        $scope.m.userList[$scope.m.cUserIdx].put().then(function(){console.log('saved')});

    });


    this.heartBeat = $interval(function() {
        $scope.m.cTime = (new Date()).getTime();

   }, 500);

    this.heartBeat2 = $interval(function() {
        $scope.loadData();

   }, 2000);


});