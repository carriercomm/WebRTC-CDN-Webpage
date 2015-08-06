$(window).resize(function() {
	initializeView();
});

function initializeView () {
	var vw = window.innerWidth;
	var vh = window.innerHeight;

	var layout01 =  document.getElementById("layout01");
	var layoutvideo01 =  document.getElementById("layoutvideo01");
	var userNameDIV =  document.getElementById("userNameDIV");
	//var layoutchat01 =  document.getElementById("layoutchat01");
	//var layoutrule01 =  document.getElementById("layoutrule01");
	var divrule01 =  document.getElementById("divrule01");
	var layoutvideo02 =  document.getElementById("layoutvideo02");
	var layoutbroadcast01 =  document.getElementById("layoutbroadcast01");
	var broadcastDIV =  document.getElementById("broadcastDIV");
	var layoutquestion01 =  document.getElementById("layoutquestion01");
	var btn01 =  document.getElementById("btn01");
	var btn02 =  document.getElementById("btn02");
	var btn03 =  document.getElementById("btn03");
	var btn04 =  document.getElementById("btn04");
	var layoutline01 =  document.getElementById("layoutline01");

	layout01.style.top = vh * 0.03 + 'px';
	layout01.style.left = vw * 0.02 + 'px';
	layout01.style.height = vh * 0.94 + 'px';
	layout01.style.width = vw * 0.96 + 'px';

	layoutvideo01.style.top = vh * 0.04 + 'px';
	layoutvideo01.style.left = vw * 0.025 + 'px';
	//layoutvideo01.style.height = vh * 0.66 + 'px';
	layoutvideo01.style.height = vh * 0.92 + 'px';
	layoutvideo01.style.width = vw * 0.69 + 'px';

	if($('#videoTeacher').length != 0){
		var videoTeacher =  document.getElementById("videoTeacher");
		videoTeacher.style.top = vh * 0.04 + 'px';
		videoTeacher.style.left = vw * 0.025 + 'px';
		//videoTeacher.style.height = vh * 0.66 + 'px';
		videoTeacher.style.height = vh * 0.92 + 'px';
		videoTeacher.style.width = vw * 0.69 + 'px';
	}

	userNameDIV.style.top = vh * 0.04 + 'px';
	userNameDIV.style.left = vw * 0.03 + 'px'
	userNameDIV.style.height = vh * 0.04 + 'px';
	userNameDIV.style.width = vw * 0.64 + 'px';
	userNameDIV.style.fontSize = vh * 0.03 + 'px';
	/*
	layoutchat01.style.top = vh * 0.705 + 'px';
	layoutchat01.style.left = vw * 0.025 + 'px';
	layoutchat01.style.height = vh * 0.255 + 'px';
	layoutchat01.style.width = vw * 0.462 + 'px';

	layoutrule01.style.top = vh * 0.705 + 'px';
	layoutrule01.style.left = vw * 0.49 + 'px';
	layoutrule01.style.height = vh * 0.255 + 'px';
	layoutrule01.style.width = vw * 0.225 + 'px';

	divrule01.style.marginTop = "11.5%";
	divrule01.style.marginLeft ="3%";
	divrule01.style.height = vh * 0.172 + 'px';
	divrule01.style.width = vw * 0.21 + 'px';
	*/
	layoutvideo02.style.top = vh * 0.04 + 'px';
	layoutvideo02.style.left = vw * 0.72 + 'px';
	layoutvideo02.style.height = vh * 0.348 + 'px';
	layoutvideo02.style.width = vw * 0.255 + 'px';

	if($('#videoStudnet').length != 0){
		var videoStudnet =  document.getElementById("videoStudnet");
		videoStudnet.style.marginTop  = vh * 0.059 + 'px';
		videoStudnet.style.marginLeft  = vw * 0.006 + 'px';
		videoStudnet.style.height = vh * 0.277 + 'px';
		videoStudnet.style.width = vw * 0.243 + 'px';
	}
	
	layoutbroadcast01.style.top = vh * 0.393 + 'px';
	layoutbroadcast01.style.left = vw * 0.72 + 'px';
	layoutbroadcast01.style.height = vh * 0.15 + 'px';
	layoutbroadcast01.style.width = vw * 0.255 + 'px';

	broadcastDIV.style.top = vh * 0.45 + 'px';
	broadcastDIV.style.left = vw * 0.73 + 'px';
	broadcastDIV.style.height = vh * 0.085 + 'px';
	broadcastDIV.style.width = vw * 0.24 + 'px';

	layoutquestion01.style.top = vh * 0.548 + 'px';
	layoutquestion01.style.left = vw * 0.72 + 'px';
	layoutquestion01.style.height = vh * 0.05 + 'px';
	layoutquestion01.style.width = vw * 0.255 + 'px';

	btn01.style.top = vh * 0.548 + 'px';
	btn01.style.left = vw * 0.72 + 'px';
	btn01.style.height = vh * 0.05 + 'px';
	btn01.style.width = vw * 0.084 + 'px';

	btn02.style.top = vh * 0.548 + 'px';
	btn02.style.left = vw * 0.805 + 'px';
	btn02.style.height = vh * 0.05 + 'px';
	btn02.style.width = vw * 0.084 + 'px';

	btn03.style.top = vh * 0.548 + 'px';
	btn03.style.left = vw * 0.89 + 'px';
	btn03.style.height = vh * 0.05 + 'px';
	btn03.style.width = vw * 0.084 + 'px';

	layoutline01.style.top = vh * 0.603 + 'px';
	layoutline01.style.left = vw * 0.72 + 'px';
	layoutline01.style.height = vh * 0.357 + 'px';
	layoutline01.style.width = vw * 0.255 + 'px';

	var questionListDIV =  document.getElementById("questionListDIV");
	questionListDIV.style.marginTop  = vh * 0.058 + 'px';
	questionListDIV.style.marginLeft  = vw * 0.006 + 'px';
	questionListDIV.style.height = vh * 0.285 + 'px';
	questionListDIV.style.width = vw * 0.243 + 'px';

	btn04.style.top = vh * 0.61 + 'px';
	btn04.style.left = vw * 0.89 + 'px';
	btn04.style.height = vh * 0.04 + 'px';
	btn04.style.width = vw * 0.08 + 'px';
}
