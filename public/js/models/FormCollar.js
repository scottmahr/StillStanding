

var app = angular.module("stillstanding");




app.service('FormCollar', function($q,$timeout, Globals) {
    this.device = null;
    this.name = 'beeep';
    this.idx = 1;

    var self = this; 



    this.disconnectDevice = function(){
        if (this.device){
            this.device.close();
            this.device = null;
        }
    }
    
    this.connectToClosestDevice = function(){

        console.log('connecting to closest collar...');
        var deferred = $q.defer();

        this.disconnectDevice();
        evothings.easyble.stopScan();
        evothings.easyble.reportDeviceOnce(false);

        var stopScanTime = Date.now() + 2000
        var closestDevice = null
        var strongestRSSI = -1000
        evothings.easyble.startScan(
            function(device){
                // Connect if we have found a sensor tag.
                //console.log(JSON.stringify(device));
                if ((device != null) && (device.name != null) &&
                       (device.name.indexOf('Form Collar') > -1) &&
                     device.rssi != 127){ // Invalid RSSI value
                    if (device.rssi > strongestRSSI){
                        closestDevice = device
                        strongestRSSI = device.rssi
                    }
                }
                if (Date.now() >= stopScanTime){
                    evothings.easyble.stopScan();
                    self.device = closestDevice;
                    if(self.device==null){
                        deferred.reject('no collar found');
                    }else{
                        deferred.resolve('found form collar');
                    }
                }
            },
            function(errorCode){
                deferred.reject('Scan failed');
            })


        return deferred.promise;
    }


    this.connectToDevice = function(){
        var deferred = $q.defer();
        if(this.device==undefined || this.device==null){
            deferred.reject('we do not have a collar yet');
        }else{
            this.device.connect(
                function(device){
                    deferred.resolve({'mac':device.address});
                },
                function(errorCode){
                    deferred.reject('Connect failed');
                }
            )
        }
        return deferred.promise;
    }


    this.readServices = function(){
        console.log('reading services')
        var deferred = $q.defer();
        console.log('test'+this.device.readServices)
        this.device.readServices(
            [],
            function(services){
                console.log('got services:'+JSON.stringify(services))
                deferred.resolve('found services');
            },
            function(errorCode){
                console.log('error getting services');
                deferred.reject('error: '+errorCode);
            }
        );
        return deferred.promise;
    }

    //generic stuff to turn things on
    this.sensorOn = function(dataUUID,notificationUUID,notificationFunction){
        var deferred = $q.defer();
        // Only start sensor if a notification function has been set.
        if (!notificationFunction) { return }

        //console.log('starting a service...');
        // Set sensor notification to ON.
        this.device.writeDescriptor(
            dataUUID, // Characteristic for data
            notificationUUID, // Configuration descriptor
            new Uint8Array([1,0]),
            function() {deferred.resolve('turned on data');},
            function(errorCode) {deferred.reject('error turning on data:'+errorCode);})

        // Start sensor notification.
        this.device.enableNotification(
            dataUUID,
            function(data) { notificationFunction(new Uint8Array(data)) },
            function(errorCode) {console.log('problem with data flow:'+errorCode);})
        return deferred.promise;
    }


    this.setLED = function(r,g,b){
        //now, try to send a command
        console.log('setting led')
        this.device.writeCharacteristic(
            Globals.LED_UUID,
            new Uint8Array([r,g,b]),
            function(){
                //console.log('good!')
            },
            function(errorCode){
                console.log('error code:'+errorCode)
            });
    }

    this.sendCommand = function(command,params){
        this.device.writeCharacteristic(
            Globals.COMMAND_UUID,
            new Uint8Array([command].concat(params)),
            function(){
                //console.log('good!')
            },
            function(errorCode){
                console.log('error code:'+errorCode)
            });
    }

    this.readBattery = function(){
        this.device.readCharacteristic(
            Globals.BATTERY_DATA,
            function(data){
                console.log('good!'+JSON.stringify(data))
            },
            function(errorCode){
                console.log('error codex:'+errorCode)
            });
    }

    this.sensorOff = function(dataUUID){
        // Set sensor configuration to OFF
        configUUID && this.device.writeCharacteristic(
            configUUID,
            new Uint8Array([0]),
            function() {},
            function(errorCode){
                console.log('error code:'+errorCode)
            });

        dataUUID && this.device.disableNotification(
            dataUUID,
            function() {},
            function(errorCode){
                console.log('error code:'+errorCode)
            });
    }








});




