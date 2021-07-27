//Firebase Integration

var email = "*******"

var password = "*******"

var firebase = require('firebase')

const fs = require('fs');

var currentPlant;
var currentBrokerUrl;

var irrigationsPath;

var firebaseConfig = {
    apiKey: "******",
    authDomain: "*******",
    databaseURL: "*******",
    projectId: "*******",
    storageBucket: "*******",
    messagingSenderId: "*******",
    appId: "*******",
    measurementId: "*******"
  };
  

firebase.initializeApp(firebaseConfig)

firebase.auth().signInWithEmailAndPassword(email, password)
.then((userCredential) => {
    // Signed in
    var user = firebase.auth().currentUser
	var userId = user.uid;
	
	irrigationsPath = 'users/' + userId.toString() + '/brokers/';
	
	database.ref('users/' + user.uid).once('value')
.then(function(snapshot) {
    console.log( snapshot.val() )
})
    //console.log(user)
  })
  .catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;
  });


let database = firebase.database()

//MQTT code
var mqtt = require('mqtt');
var dbTopic = 'dbdata'; 
var plantNameTopic = 'irrigatedPlant';
var brokerUrlTopic = 'brokerUrl';
var Broker_URL = 'mqtts://192.168.0.103';

var caFile = fs.readFileSync("ca.crt");
var certFile = fs.readFileSync("cert.crt");
var keyFile = fs.readFileSync("key.key");


var Options={
clientId: 'jsMqttDbCl',
username: 'node-client-writer',
rejectUnauthorized:false,
password: 'nodeclient',
port: 1883,
retain:true,
keepalive : 60,
ca: [ caFile ],
cert: certFile,
key: keyFile,
qos:2
};

var mqttclient  = mqtt.connect( Broker_URL, Options);//conection with broker
mqttclient.on('connect', mqtt_connect);
mqttclient.on('reconnect', mqtt_reconnect);
mqttclient.on('error', mqtt_error);
mqttclient.on('message', mqtt_messsageReceived);
mqttclient.on('close', mqtt_close);


function mqtt_connect() {
	console.log("Connected to MQTT broker.");
    mqttclient.subscribe(dbTopic, mqtt_subscribe);
	mqttclient.subscribe(plantNameTopic, mqtt_subscribe);
	mqttclient.subscribe(brokerUrlTopic, mqtt_subscribe);
	
};

function mqtt_subscribe(err, granted) {
    console.log("Subscribed to " + dbTopic);
    if (err) {console.log(err);}
};

function mqtt_reconnect(err) {
	mqttclient  = mqtt.connect(Broker_URL, Options);
};

function mqtt_error(err) {
    console.log("Error with MQTT!");
	if (err) {console.log(err);}
};

//handle incoming mqtt messages
function mqtt_messsageReceived(topic, message){
	
	if(topic.toString() == dbTopic.toString()){
	console.log("Message is "+message+" and going to store in database!");
	var msg = message.toString();
	const strarray = msg.split(';');
	var inDate = strarray[0];
	var inStartTime = strarray[1];
	var inStopTime = strarray[2];
	var inMoist = strarray[3];
	console.log("StopTime" + inStopTime.toString());
	insertIrrigationData(inDate, inStartTime, inStopTime, inMoist);
   // insertintoDB(inDate, inStartTime, inStopTime, inMoist);
    return;
	}
	
	if(topic.toString() == plantNameTopic.toString()){
		currentPlant = message.toString();
		irrigationsPath += currentPlant;
		console.log('currentplant:' + currentPlant);
		return;
	}
	
	if(topic.toString() == brokerUrlTopic.toString()){
		currentBrokerUrl = message.toString();
		irrigationsPath += currentBrokerUrl + "/irrigations/";
		console.log('currentbrokerUrl:' + currentBrokerUrl);
		return;
	}
	
};

function mqtt_close() {
	console.log("Close MQTT connection!");
};

function insertIrrigationData(inDate, inStartTime, inStopTime, inMoist){
	console.log(irrigationsPath);
	database.ref().child(irrigationsPath.toString()).push({
		date:inDate,
		startTime: inStartTime,
		endTime: inStopTime,
		moistureLvl: inMoist
	});
	console.log('Firebase insert opeartion is being performed!' + inStartTime);
};
