var controlServer =  "http://140.115.156.47:3000";
//var server = "http://140.115.156.37:8088/janus";
var serverList = [];
var listOfJanus = {};

var mRoomName = null;
var mIdentify = null;
var mUserName = null;
var localStreamIndex = null;
var callinStreamIndex = null;

$(document).ready(function() {
	//Initialize view
	initializeView();

	initializeViewButton();
	// Initialize the library (console debug enabled)
	Janus.init({
		debug: true, 
		callback: null
	});

	bootbox.dialog({
		title: "Login", 
		message: 
			'<div class="row">  ' +
				'<div class="col-md-12"> ' +
					'<form class="form-horizontal"> ' +
						'<div class="form-group"> ' +
							'<label class="col-md-4 control-label" for="username">User Name</label> ' +
							'<div class="col-md-6"> ' +
								'<input id="username" name="username" type="text" placeholder="User Name" class="form-control input-md"> ' +
							'</div> ' +
						'</div> ' +
						'<div class="form-group"> ' +
							'<label class="col-md-4 control-label" for="roomname">Room Name</label> ' +
							'<div class="col-md-6"> ' +
								'<input id="roomname" name="roomname" type="text" placeholder="Room Name" class="form-control input-md"> ' +
							'</div> ' +
						'</div> ' +
						'<div class="form-group"> ' +
							'<label class="col-md-4 control-label" for="identity-options">Identity</label> ' +
							'<div class="col-md-6"> ' +
								 '<select id="identity-options" id="identity-options" class="form-control">' +
									'<option>Teacher</option>' +
									'<option>Student</option>' +
								'</select>' +
							'</div> ' +
						'</div> ' +
					'</form>' + 
				'</div>' +
			' </div>',
		buttons: {
			success: {
				label: "OK",
				className: "btn-success",
				callback: function () {
					if(!Janus.isWebrtcSupported()) {
						bootbox.alert("No WebRTC support... ", function() {
							window.location.reload();
						});
						return;
					}
					if(!openRoom($('#username').val(), $('#roomname').val(), $('#identity-options').val())) {
						bootbox.alert("Input Error... ", function() {
							window.location.reload();
						});
						return;
					}
				}
			},
			cancel: {
				label: "Cancel",
				className: "btn-cancel",
				callback: function() {
					window.location.reload();
				}
			}
		}
	});
});

function openRoom(username, roomname, identity) {
	//選擇身分，輸入房間名稱，輸入名稱，按下開始按鈕
	if(username.length === 0) {
		// Create fields to register
		return false;
	} else if(roomname.length === 0) {
		// Create fields to register
		return false;
	}else {
		mUserName = username;
		mRoomName = roomname;
		mIdentify = identity;

		//查詢目前房間是否有重複, control server 回傳確認結果
		checkRoomByDes(mRoomName,{	
			success: function(data) {
				var result = data['result'];
				if(mIdentify == 'Teacher'){
					if(result == false) {
						queryServerList();
					} else {
						bootbox.alert("This Room already exit.", function() {
							mUserName = null;
							mRoomName = null;
							mIdentify = null;
							window.location.reload();
						});
					}
				}else if(mIdentify == 'Student'){
					if(result == false) {
						bootbox.alert("This Room is not exit.", function() {
							mUserName = null;
							mRoomName = null;
							mIdentify = null;
							window.location.reload();
						});
					} else {
						queryServerList();
					}
				}
			},
			error: function(errorMsg) {
				console.log("Query Server error:" + errorMsg);
				bootbox.alert("Error:" +errorMsg, function() {
					window.location.reload();
				});
			}
		});
	}
	return true;
}

function createCORSRequest(method, url, index) {
	var xhr = new XMLHttpRequest();
	if ("withCredentials" in xhr) {
		// Check if the XMLHttpRequest object has a "withCredentials" property.
		// "withCredentials" only exists on XMLHTTPRequest2 objects.
		xhr.open(method, url, true);
	} else if (typeof XDomainRequest != "undefined") {
		// Otherwise, check if XDomainRequest.
		// XDomainRequest only exists in IE, and is IE's way of making CORS requests.
		xhr = new XDomainRequest();
		xhr.open(method, url);
	} else {
		// Otherwise, CORS is not supported by the browser.
		xhr = null;
	}
	return xhr;
}

function checkRoomByDes (roomname, callback) {

	console.log('checkRoomByDes:' + roomname);
	var url = controlServer + '/' + 'checkRoomByDes';
	var xhr = new createCORSRequest('POST', url);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	var params = "roomname=" + roomname;

	if (!xhr) {
		bootbox.alert('CORS not supported');
		return;
	}
	xhr.onload = function() {
		console.log('Response from CORS request to ' + url + ': ' + xhr.responseText);
		var data = xhr.responseText;
		callback.success(JSON.parse(data));
	};
	xhr.onerror = function() {
		callback.error('There was an error making the request.');
	};
	xhr.send(params);
}

function queryServerList() {
	var url = controlServer + '/' + 'queryServerList';
	var xhr = new createCORSRequest('GET', url);
	if (!xhr) {
		bootbox.alert('CORS not supported');
		return;
	}
	xhr.onload = function() {
		var resultServerList = xhr.responseText;
		console.log('Response from CORS request to ' + url + ': ' + resultServerList);
		getServerRTTList(JSON.parse(resultServerList), function (resultServerRTT) {
			queryServer(mIdentify, mRoomName, resultServerRTT, {	
				success: function(resultTargetServer) {
					serverList = resultTargetServer['serverList'];
					initAllJanus(resultTargetServer['nodejsList'], resultTargetServer['callinServer']);
				},
				error: function(errorMsg) {
					console.log("Query Server error:" + errorMsg);
					bootbox.alert("Error:" +errorMsg, function() {
						window.location.reload();
					});
				}
			});
		});
		
	};
	xhr.onerror = function() {
		bootbox.alert('There was an error making the request.');
	};
	xhr.send();
}

function getServerRTTList (data, callback) {
	var serverlist_ = data['serverList'];
	if(serverlist_ != null) {
		var serverRTT = new Array(serverlist_.length);
		var finish = serverlist_.length;

		for (var i in serverlist_) {
			var url = serverlist_[i]['nodejsIP'] + '/' + 'RTT';
			getServerRTT(i, url, function (index, request_time) {
				var result = {
					janusIP : serverlist_[index]['janusIP'],
					nodejsIP : serverlist_[index]['nodejsIP'],
					rtt : request_time
				};
				serverRTT[index] = result;
				finish--;

				if(finish == 0){
					return callback(serverRTT);
				}
			});
		};
	} else {
		console.log("no available edge server");
	} 
} 

function getServerRTT(index, url, callback) {
	var xhr = new createCORSRequest('GET', url);
	var start_time = new Date().getTime();

	if (!xhr) {
		bootbox.alert('CORS not supported');
		return;
	}

	xhr.onload = function() {
		var request_time = new Date().getTime() - start_time;
		return callback(index, request_time);
	};

	xhr.onerror = function() {
		return callback(index, 10000);
	};

	xhr.send();
}

function queryServer(identity, roomname, rttResult, callback) {
	console.log('queryServer');
	var url = controlServer + '/' + 'queryServer';
	var xhr = new createCORSRequest('POST', url);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

	var jarray = {rttResult : rttResult};
	var params = "identity=" + identity 
		+ "&roomname=" + roomname 
		+ "&rttResult=" +JSON.stringify(jarray);

	if (!xhr) {
		bootbox.alert('CORS not supported');
		return;
	}
	xhr.onload = function() {
		var data = xhr.responseText;
		console.log('Response from CORS request to ' + url + ': ' + data);
		callback.success(JSON.parse(data));
	};
	xhr.onerror = function() {
		callback.error('There was an error making the request.');
	};
	xhr.send(params);
}

function initAllJanus (nodejsList, callinServerIP) {
	if(serverList.length != 0) {
		var index = 0;
		console.log("create janus server : " + serverList[index]);
		var url = serverList[index];
		if(listOfJanus[url] == undefined){
			var janusObject = {
				nodejsIP : nodejsList[index],
				janus : null, //janus library for connecting janus server.
				pubMPH : null, //video mcu plugin handler for publisher, publihshing stream, get room info
				lisMPH : null, //video mcu plugin handler for listener, receiving stream
				callinServerIP : callinServerIP,
				oCPH : null, //one to one plugin handler for callin student, publishing stream, 
				roomId : null, // join room's id
				userId : null, //this user's id
				studentList : null,
				tStream : null, //teacher's stream
				publisherId : null
			};
			listOfJanus[url] = janusObject;
			initJanus(url);
		}
	} else {
		bootbox.alert('No Edge Server Available.', function() {
			window.location.reload();
		});
	}
}

function initJanus(url) {
	console.log('initJanus : ' + url);
	// Create session for this user
	listOfJanus[url].janus = new Janus({
		server: url,
		success: function() {
			//attach plugin for video broadcasting room and callin 
			attachMcuLocalPlugin(url);
			if(url == listOfJanus[url].callinServerIP){
				initCallinJanus(url);
			}
		},
		error: function(error) {
			console.log(error);
			bootbox.alert(error, function() {
				window.location.reload();
			});
		},
		destroyed: function() {
			window.location.reload();
		}
	});
	if(url != listOfJanus[url].callinServerIP){
		initCallinJanus(url);
	}
};

function initCallinJanus(url) {
	console.log('initCallinJanus : ' + listOfJanus[url].callinServerIP);
	var callinServerIP = listOfJanus[url].callinServerIP;
	if(listOfJanus[callinServerIP] == undefined){
		var janusObject = {
			nodejsIP : null,
			janus : null, //janus library for connecting janus server.
			pubMPH : null, //video mcu plugin handler for publisher, publihshing stream, get room info
			lisMPH : null, //video mcu plugin handler for listener, receiving stream
			callinServerIP : callinServerIP,
			oCPH : null, //one to one plugin handler for callin student, publishing stream, 
			roomId : null, // join room's id
			userId : null, //this user's id
			studentList : null,
			tStream : null, //teacher's stream
			publisherId : null
		};
		listOfJanus[callinServerIP] = janusObject;

		listOfJanus[callinServerIP].janus = new Janus({
			server: callinServerIP,
			success: function() {
				attachCallPlugin(callinServerIP);
			},
			error: function(error) {
				console.log(error);
				bootbox.alert(error, function() {
					window.location.reload();
				});
			},
			destroyed: function() {
				window.location.reload();
			}
		});
	} else {
		attachCallPlugin(callinServerIP);
	}
};

function attachMcuLocalPlugin(url) {
	var janusObject = listOfJanus[url];
	janusObject.janus.attach({
		plugin: "janus.plugin.videoroom",
		success: function(pluginHandle) {
			console.log("Plugin attached! (" + pluginHandle.getPlugin() + ", id=" + pluginHandle.getId() + ")");
			janusObject.pubMPH = pluginHandle;
			if(mIdentify == 'Teacher'){ 
				createRoom(url);
			}else if (mIdentify == 'Student'){ 
				joinRoom(url);
			}
		},
		error: function(error) {
			console.log("Error attaching plugin... " + error);
			bootbox.alert("Error attaching plugin... " + error);
		},
		consentDialog: function(on) {
		},
		onmessage: function(msg, jsep) {
			console.log("Got a message (publisher) : " + JSON.stringify(msg));
			var event = msg["videoroom"];
			if(event != undefined && event != null) {
				if(event === "joined") {
					console.log("Successfully joined room " + msg["room"] + " with ID " + msg["id"]);
					janusObject.userId = msg["id"];
					if(mIdentify === "Teacher") {
						// 準備本地影像並開始SDP交換然後連接Janus Server
						// Publish local stream
					 	console.log("Negotiating WebRTC stream for teacher's stream");
					 	janusObject.pubMPH.createOffer({
					 		media: { 
					 			video: 'hires', 
								audio: true, 
					 			videoRecv: false, 
					 			audioRecv: false
					 		},
					 		success: function(jsep) {
					 			//拿到本地SDP,送到Janus Server
								console.log("Got Local SDP (publisher) : " + JSON.stringify(jsep));
					 			jsep["sdp"] = jsep["sdp"].replace(/sendrecv/g, "sendonly");
					 			var publish = { 
									"request": "configure", 
					 				"audio": true, 
									"video": true 
					 			};
					 			janusObject.pubMPH.send({"message": publish, "jsep": jsep});
					 		},
					 		error: function(error) {
					 			console.log("WebRTC error:" + JSON.stringify(error));
					 			bootbox.alert("WebRTC error... " + JSON.stringify(error));
							}
					 	});
					 } else if (mIdentify == 'Student'){
						//only watching a session, attach any feed.
						if(msg["publishers"] !== undefined && msg["publishers"] !== null) {
							var list = msg["publishers"];
							console.log("Got a list of available publishers/feeds:" + JSON.stringify(list));
							for(var f in list) {
								var id = list[f]["id"];
								var display = list[f]["display"];
								console.log("Get feed : [" + id + "] " + display);
								attachRemoteStream(url, id, display);
								break;
							}
						}
					}
				} else if(event === "event") {
					if(msg["leaving"] !== undefined && msg["leaving"] !== null) {
						if(mIdentify === 'Teacher') {
							//refreshStudentList();
						} else if(mIdentify === "Student" && msg["leaving"] === janusObject.publisherId) {
							bootbox.alert("The Room is over, the publisher left", function() {
								window.location.reload();
							});
						}
					} else if(msg["message"] !== undefined && msg["message"] !== null) {
						console.log(msg["message"]);
						var array = msg["message"].split(':');
						var message = array[0];

						if (message === "studentjoin") {
							// 
						} else if (message === "raiseQuestion") {
							if (mIdentify == 'Teacher'){
								addToQuestionList(array[1]);
								broadcastRoomMessage("b:" + janusObject.userId + ":" + msg["message"]);
							}
						} else if (message === 'b') {
							if(mIdentify == 'Student') {
								if(parseInt(array[1], 10) !== janusObject.userId) {
									if(array[2] === "raiseQuestion") {
										addToQuestionList(array[3]);
									} else if (array[2] === "removeFromQuestionList") {
										removeFromQuestionList(array[3]);
									}
								}
							}
						}
					} else if(msg["error"] !== undefined && msg["error"] !== null) {
					 	var error = msg["error"];
					 	bootbox.alert("Janus error: " + JSON.stringify(error));
					}
				}
			}
			if(jsep !== undefined && jsep !== null) {
				//拿到Janus Server的SDP
				console.log("Got Remote SDP (publisher) : " + JSON.stringify(jsep));
				janusObject.pubMPH.handleRemoteJsep({jsep: jsep});
				
				var userNameDIV=document.getElementById("userNameDIV");
				userNameDIV.innerHTML = mUserName;

				var broadcastDIV=document.getElementById("broadcastDIV");
				broadcastDIV.innerHTML = 'Join course: "' + mRoomName + '"<br/>';
				broadcastDIV.innerHTML += 'Welcome, ' + mUserName + '<br/>';
			}
		},
		onlocalstream: function(stream) {
			//拿到本地影像,儲存並顯示
			console.log("Got a local stream : " + JSON.stringify(stream));
			janusObject.tStream = stream;
			if(localStreamIndex == null) {
				localStreamIndex = url;
				if($('#videoTeacher').length != 0) {
					attachMediaStream($('#videoTeacher').get(0), stream);
				}
			}
		},
		onremotestream: function(stream) {
			console.log("Got a remote stream : " + JSON.stringify(stream));
			// The publisher stream is sendonly, we don't expect anything here
		},
		oncleanup: function() {
			console.log("Got a cleanup notification.");
			window.location.reload();
		}
	});
}

function attachCallPlugin (url) {
	console.log('attachCallPlugin : ' + url);
	var janusObject = listOfJanus[url];
	janusObject.janus.attach({
		plugin: "janus.plugin.videocall",
		success: function(pluginHandle) {
			console.log("Plugin attached! (" + pluginHandle.getPlugin() + ", id=" + pluginHandle.getId() + ")");
			janusObject.oCPH = pluginHandle;
			var register = { "request": "register", "username": mUserName };
				janusObject.oCPH.send({
					"message": register
				});
		},
		error: function(error) {
			console.log("Error attaching plugin... " + error);
			bootbox.alert("Error attaching plugin... " + error);
		},
		consentDialog: function(on) {
		},
		onmessage: function(msg, jsep) {
			console.log("Got a message" + JSON.stringify(msg));
			var result = msg["result"];
			if(result !== null && result !== undefined) {
				if(result["list"] !== undefined && result["list"] !== null) {
					var list = result["list"];
					console.log("Got a list of registered peers:" + JSON.stringify(list));
					for(var mp in list) {
						console.log("  >> [" + list[mp] + "]");
					}

				} else if(result["event"] !== undefined && result["event"] !== null) {
					var event = result["event"];
					if(event === 'registered') {
						console.log("Successfully registered as " + result["username"] + "!");
						// Get a list of available peers, just for fun
						janusObject.oCPH.send({"message": { "request": "list" }});
					} else if(event === 'calling') {
						console.log("Waiting for the peer to answer...");
					} else if(event === 'incomingcall') {
						console.log("Incoming call from " + result["username"] + "!");
						janusObject.oCPH.createAnswer({
							jsep: jsep,
							media: {
								//audioRecv : false,
								//videoRecv : false,
								data: false
							},
							success: function(jsep) {
								jsep["sdp"] = jsep["sdp"].replace(/sendrecv/g, "sendonly");
								console.log("Got SDP!" + JSON.stringify(jsep));
								var body = { "request": "accept" };
								janusObject.oCPH.send({"message": body, "jsep": jsep});
							},
							error: function(error) {
								console.log("WebRTC error:" + JSON.stringify(error));
								bootbox.alert("WebRTC error... " + JSON.stringify(error));
							}
						});
					} else if(event === 'accepted') {
						var peer = result["username"];
						if(peer === null || peer === undefined) {
							console.log("Call started!");
						} else {
							console.log(peer + " accepted the call!");
						}
						// TODO Video call can start
						if(jsep !== null && jsep !== undefined){
							console.log("Handling SDP as well... : " + JSON.stringify(jsep));
							janusObject.oCPH.handleRemoteJsep({jsep: jsep});
						}
					} else if(event === 'hangup') {
						console.log("Call hung up by " + result["username"] + " (" + result["reason"] + ")!");
						// TODO Reset status
						janusObject.oCPH.hangup();
					}
				}
			} else {
				// FIXME Error?
				var error = msg["error"];
				bootbox.alert(error, function() {
					if (error != "Username '" + remotePeer + "' doesn't exist") {
						window.location.reload();
					}
					doHangup();
				});
				// TODO Reset status
			}
		},
		onlocalstream: function(stream) {
			console.log("Got a local stream" + JSON.stringify(stream));
			if(callinStreamIndex == null) {
				callinStreamIndex = url;
				if($('#videoStudnet').length != 0) {
					attachMediaStream($('#videoStudnet').get(0), stream);
				}
			}
		},
		onremotestream: function(stream) {
			console.log("Got a remote stream" + JSON.stringify(stream));
			if(callinStreamIndex == null) {
				callinStreamIndex = url;
				if($('#videoStudnet').length != 0) {
					attachMediaStream($('#videoStudnet').get(0), stream);
				}
			}
			// Show the video, hide the spinner and show the resolution when we get a playing event
			$("#videoStudnet").bind("playing", function () {
				console.log('playing');
			});
		},
		oncleanup: function() {
			console.log("Got a cleanup notification");
			callinStreamIndex = null;
		}
	});
}

function createRoom(url) {
	console.log('create room : ' + url);
	var janusObject = listOfJanus[url];
	var create = {
		"request": "create", 
		"description": mRoomName, 
		"bitrate": 512000, 
		"publishers": 1 
	};
	janusObject.pubMPH.send({
		"message": create, 
		success: function(result) {
			var event = result["videoroom"];
			console.log("Event: " + event);
			if(event != undefined && event != null) {
				registerRoomOnCS(url, mRoomName, result["room"], mUserName);
				janusObject.roomId = result["room"];
				console.log("Room has been created: " + janusObject.roomId);
				var register = { 
					"request": "join", 
					"room": janusObject.roomId, 
					"ptype": "publisher", 
					"display": mUserName 
				};
				janusObject.pubMPH.send({"message": register});
			}
		}
	});
}

function registerRoomOnCS (roomurl, roomname, roomid, username) {
	console.log('registerRoomOnCS:' + roomurl + ', ' + roomname +  ', ' + roomid);
	var url = controlServer + '/' + 'registerRoomOnCS';
	var xhr = new createCORSRequest('POST', url);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	var params = "roomname=" + roomname 
		+ "&url=" + roomurl 
		+ "&roomid=" + roomid
		+ "&username=" + username;
	
	if (!xhr) {
		bootbox.alert('CORS not supported');
		return;
	}
	xhr.onload = function() {
		console.log('Response from CORS request to ' + url + ': ' + xhr.responseText);
		var data = JSON.parse(xhr.responseText);
		console.log(data["result"]);
		if(data['result'] == true) {
		} else {
			bootbox.alert("Error:" + 'Room already exited.', function() {
				window.location.reload();
			});
		}
	};
	xhr.onerror = function() {
		bootbox.alert("Error:" + 'There was an error making the request.', function() {
			window.location.reload();
		});
	};
	xhr.send(params);
}

function unregisterRoomOnCS () {
	if(mIdentify == 'Teacher') {
		console.log('unregisterRoomOnCS:' + mRoomName);
		var url = controlServer + '/' + 'unregisterRoomOnCS';
		var xhr = new createCORSRequest('POST', url);
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		var params = "roomname=" + mRoomName;
		
		if (!xhr) {
			bootbox.alert('CORS not supported');
			return;
		}
		xhr.onload = function() {
			console.log('Response from CORS request to ' + url + ': ' + xhr.responseText);
			var data = JSON.parse(xhr.responseText);
			console.log(data["result"]);
		};
		xhr.onerror = function() {
			bootbox.alert("Error:" + 'There was an error making the request.', function() {
				window.location.reload();
			});
		};
		xhr.send(params);
	}
}

/*
	function unregisterRoomOnJanus () {
		if(mIdentify == 'Teacher') {
			var janusIP = serverList[0];
			var janusObject = listOfJanus[janusIP];
			var url = controlServer + '/' + 'unregisterRoomOnJanus';
			var xhr = new createCORSRequest('POST', url);
			xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			var params = "roomId=" + janusObject.roomId
				+ "&janusIP=" + janusIP;
		
			if (!xhr) {
				bootbox.alert('CORS not supported');
				return;
			}
			xhr.onload = function() {
				console.log('Response from CORS request to ' + url + ': ' + xhr.responseText);
				var data = JSON.parse(xhr.responseText);
				console.log(data["result"]);
			};
			xhr.onerror = function() {
				bootbox.alert("Error:" + 'There was an error making the request.', function() {
					window.location.reload();
				});
			};
			xhr.send(params);
		}
	}
*/

function joinRoom(url) {
	var janusObject = listOfJanus[url];
	//先依照課程名稱拿到room id
	var list = { 
		"request": "list"
	};
	janusObject.pubMPH.send({
		"message": list, 
		success: function(result) {
			console.log("Got room list : " + JSON.stringify(result));
			var list = result["list"];
			for(var f in list) {
				var description = list[f]["description"];
				if (description == mRoomName){
					janusObject.roomId = list[f]["room"];
					break;
				}
			}
			//拿到room id後加入房間
			if(janusObject.roomId != undefined && janusObject.roomId != null){
					// Join an room session
					var register = { 
						"request": "join", 
						"room": janusObject.roomId, 
						"ptype": "publisher", 
						"display": mUserName 
					};
					janusObject.pubMPH.send({"message": register});
			} else {
				bootbox.alert('Room "' + mRoomName +'" doesn not exit.', function() {
					window.location.reload();
				});
			}
		}
	});
}

function attachRemoteStream(url, id, display) {
	var janusObject = listOfJanus[url];
	// A new feed has been published, create a new plugin handle and attach to it as a listener
	janusObject.publisherId = id;
	janusObject.janus.attach({
		plugin: "janus.plugin.videoroom",
		success: function(pluginHandle) {
			janusObject.lisMPH = pluginHandle;
			console.log("Plugin attached! (" + pluginHandle.getPlugin() + ", id=" + pluginHandle.getId() + ")");
			console.log("This is a Listener");
			//要求Janus Server交換SDP
			// We wait for the plugin to send us an offer
			var listen = { 
				"request": "join", 
				"room": janusObject.roomId, 
				"ptype": "listener",
				"feed": id 
			};
			janusObject.lisMPH.send({"message": listen});
		},
		error: function(error) {
			console.log("Error attaching plugin... " + error);
			bootbox.alert("Error attaching plugin... " + error);
		},
		onmessage: function(msg, jsep) {
			console.log("Got a message (listener) : " + JSON.stringify(msg));
			var event = msg["videoroom"];
			if(event != undefined && event != null) {
				if(event === "attached") {
					// Subscriber created and attached
					console.log("Successfully attached to feed " + id + " (" + display + ") in room " + msg["room"]);
				} else {
					console.log(JSON.stringify(msg)); 
					if(msg["started"] !== undefined && msg["started"] !== null) {
						if (msg["started"] === "ok") {
							
						}
					}

				}
			}
			if(jsep !== undefined && jsep !== null) {
				// 拿到Janus Server的SDP
				console.log("Got Remote SDP (listener) : " + JSON.stringify(jsep));
				// Answer and attach
				janusObject.lisMPH.createAnswer({
					jsep: jsep,
					media: { 
						audioSend: false, 
						videoSend: false 
					},	
					success: function(jsep) {
						//拿到本地SDP,送到Janus Server
						console.log("Got Local SDP (listener) : " + JSON.stringify(jsep));
						var body = { 
							"request": "start", 
							"room": janusObject.roomId 
						};
						janusObject.lisMPH.send({"message": body, "jsep": jsep});
					},
					error: function(error) {
						console.log("WebRTC error:" + JSON.stringify(error));
						bootbox.alert("WebRTC error... " + error);
					}
				});
			}
		},
		onlocalstream: function(stream) {
			console.log("Got a local stream : " + JSON.stringify(stream));
			// The listener stream is recvonly, we don't expect anything here
		},
		onremotestream: function(stream) {
			janusObject.tStream = stream;
			if(localStreamIndex == null) {
				//拿到遠端的影像,儲存並顯示
				localStreamIndex = url;
				if($('#videoTeacher').length != 0) {
					attachMediaStream($('#videoTeacher').get(0), stream);
				}
				registerStudentOnCS();
			}
		},
		oncleanup: function() {
			console.log("Got a cleanup notification (remote feed " + id + ") : ");
		}
	});
}

function registerStudentOnCS () {
	console.log('registerStudentOnCS');
	var janusIP = serverList[0];
	var url = controlServer + '/' + 'registerStudentOnCS';
	var xhr = new createCORSRequest('POST', url);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	var params = "roomname=" + mRoomName
		+ "&janusIP=" + janusIP 
		+ "&userid=" + listOfJanus[janusIP].userId
		+ "&username=" + mUserName;

	if (!xhr) {
		bootbox.alert('CORS not supported');
		return;
	}
	xhr.onload = function() {
		console.log('Response from CORS request to ' + url + ': ' + xhr.responseText);
		var userNameDIV=document.getElementById("userNameDIV");
		userNameDIV.innerHTML = mUserName;

		var broadcastDIV=document.getElementById("broadcastDIV");
		broadcastDIV.innerHTML = 'Join course: "' + mRoomName + '"<br/>';
		broadcastDIV.innerHTML += 'Welcome, ' + mUserName + '<br/>';

		getQuestionList();
	};
	xhr.onerror = function() {
		bootbox.alert("Error:" + 'There was an error making the request.', function() {
			window.location.reload();
		});
	};
	xhr.send(params);
}

function unregisterStudentOnCS () {
	if(mIdentify == 'Student') {
		console.log('unregisterStudentOnCS');
		var janusIP = serverList[0];
		var url = controlServer + '/' + 'unregisterStudentOnCS';
		var xhr = new createCORSRequest('POST', url);
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		var params = "roomname=" + mRoomName
			+ "&janusIP=" + janusIP 
			+ "&userid=" + listOfJanus[janusIP].userId
			+ "&username=" + mUserName;
		if (!xhr) {
			bootbox.alert('CORS not supported');
			return;
		}
		xhr.onload = function() {
			console.log('Response from CORS request to ' + url + ': ' + xhr.responseText);
		};
		xhr.onerror = function() {
			bootbox.alert("Error:" + 'There was an error making the request.', function() {
				window.location.reload();
			});
		};
		xhr.send(params);
	}
}

function initializeViewButton () {
	$("#btn01").click(function (evt) {
		raiseQuestion();
	});

	$("#btn02").click(function (evt) {
		console.log(evt);
		bootbox.alert("This function is in development.", function() {
			//window.location.reload();
		});
	});

	$("#btn03").click(function (evt) {
		console.log(evt);
		bootbox.alert("This function is in development.", function() {
			//window.location.reload();
		});
	});
}

function raiseQuestion() {
	console.log('raiseQuestion');
	if (mIdentify == 'Teacher') {
		bootbox.alert("Student only.");
		return;
	}
	bootbox.confirm("Raise A Question?", function(result) {
		if(result == true){
			var janusIP = serverList[0];
			var url = controlServer + '/' + 'addQuestion';
			var xhr = new createCORSRequest('POST', url);
			xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			var params = "roomname=" + mRoomName
				+ "&username=" + mUserName;

			if (!xhr) {
				bootbox.alert('CORS not supported');
				return;
			}
			xhr.onload = function() {
				console.log('Response from CORS request to ' + url + ': ' + xhr.responseText);
				var data = JSON.parse(xhr.responseText);
				if (data['result'] == true) {
					var message = "raiseQuestion:" + mUserName;
					sendMessageToMain(message);
				} else {
					bootbox.alert("Already raise a question.");
				}
			};
			xhr.onerror = function() {
				bootbox.alert("Error:" + 'There was an error making the request.', function() {
					window.location.reload();
				});
			};
			xhr.send(params);
		}
	}); 
}

function getQuestionList() {
	console.log('getQuestionList');
	var janusIP = serverList[0];
	var url = controlServer + '/' + 'getQuestionList';
	var xhr = new createCORSRequest('POST', url);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	var params = "roomname=" + mRoomName;

	if (!xhr) {
		bootbox.alert('CORS not supported');
		return;
	}
	xhr.onload = function() {
		console.log('Response from CORS request to ' + url + ': ' + xhr.responseText);
		var data = JSON.parse(xhr.responseText);
		updateQuestionList(JSON.parse(data['questionList']));
	};
	xhr.onerror = function() {
		bootbox.alert("Error:" + 'There was an error making the request.', function() {
			window.location.reload();
		});
	};
	xhr.send(params);
}

function updateQuestionList(questionList){

	for(var i in questionList) {
		console.log(i);
		addToQuestionList(i);
	}
}
/*
	function raiseQuestion_v1() {
		if (mIdentify == 'Teacher') {
			bootbox.alert("Student only.");
			return;
		}
		bootbox.confirm("Raise A Question?", function(result) {
			if(result == true){
				var message = "raiseQuestion:" + mUserName;
				sendMessageToMain(message);
			}
		}); 
	}
*/

function sendMessageToMain (message) {
	var url = serverList[0];
	var janusObject = listOfJanus[url];
	var relaymessage = { 
		"request": "notifymessage",
		"userId" : janusObject.publisherId, 
		"message" : message
	};
	janusObject.pubMPH.send({
		"message": relaymessage, 
		success: function(result) {
		}
	});
}

function addToQuestionList (studentName) {
	var li = document.createElement("li");
	li.setAttribute("id", "li" + studentName);
	li.innerHTML = studentName;
	li.setAttribute("class", "list-group-item");
	if (mIdentify == 'Teacher') {
		li.addEventListener("click", function(){connectStudent(studentName)}, false);
	}
	var ul = document.getElementById('questionListUL');
	ul.appendChild(li);
}

var remotePeer = "";
function connectStudent(username) {
	if (remotePeer.length > 0) {  //already has a callin event
		bootbox.alert("Already in a call in event.");
		return;
	}
	var url = serverList[0];
	var janusObject = listOfJanus[url];
	remotePeer = username;
	$("#btn04").removeClass("hide");

	janusObject.oCPH.createOffer({
		// By default, it's sendrecv for audio and video...
		media: {
			audioSend : false,
			videoSend : false,
			data : false
		},
		success: function(jsep) {
			jsep["sdp"] = jsep["sdp"].replace(/sendrecv/g, "recvonly");
			console.log("Got SDP!" + JSON.stringify(jsep));
			var body = { "request": "call", "username": username };
			janusObject.oCPH.send({"message": body, "jsep": jsep});
		},
		error: function(error) {
			console.log("WebRTC error... " + JSON.stringify(error));
			bootbox.alert("WebRTC error... " + JSON.stringify(error));
		}
	});
}

function doHangup() {
	// Hangup a call
	var url = serverList[0];
	var janusObject = listOfJanus[url];
	if(janusObject.oCPH != null) {
		var hangup = { "request": "hangup" };
		janusObject.oCPH.send({"message": hangup});
		janusObject.oCPH.hangup();

		var btnHangup = document.getElementById('btn04');
		btnHangup.setAttribute("class", "hide");
		if (remotePeer.length > 0) {
			removeFromQuestionList(remotePeer);
			deleteQuestion(remotePeer);
			var message = "b:" + janusObject.userId + ":removeFromQuestionList:" + remotePeer;
			broadcastRoomMessage(message);
			remotePeer = "";
		}
	}
}

function deleteQuestion(studentName) {
	console.log('deleteQuestion');
	var janusIP = serverList[0];
	var url = controlServer + '/' + 'deleteQuestion';
	var xhr = new createCORSRequest('POST', url);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	var params = "roomname=" + mRoomName
		+ "&username=" + studentName;

	if (!xhr) {
		bootbox.alert('CORS not supported');
		return;
	}
	xhr.onload = function() {
	};
	xhr.onerror = function() {
		bootbox.alert("Error:" + 'There was an error making the request.', function() {
			window.location.reload();
		});
	};
	xhr.send(params);
}

function removeFromQuestionList (studentName) {
	var li = document.getElementById("li" + studentName);
	var questionListUL = document.getElementById("questionListUL");
	questionListUL.removeChild(li);
}

function broadcastRoomMessage (message) {
	var url = serverList[0];
	var janusObject = listOfJanus[url];
	var broadcastmessage = { 
		"request": "broadcastmessage",
		"message" : message
	};
	janusObject.pubMPH.send({
		"message": broadcastmessage, 
		success: function(result) {
		}
	});
}