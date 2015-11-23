// Test Code 2

			
user = document.getElementById("user");
next = document.getElementById("next");
leave = document.getElementById("leave");

newuser = document.getElementById("newuser");
enter = document.getElementById("enter");

people = ["TCPN","LER","Liu","Nancy","吳興良哥","Shirley","Shantina","Winnie","正馨","Jessie"]
codes = [
a = function(){
			newuser.value = people[stepCount];
			enter.click();
},a,a,a,a,a,a,a,a,a,
function(){
			next.click();
			document.getElementById("newRoomName").value = "Come & Fight!?";
			document.getElementById("newRoom").click();
},
b= function(){
			next.click();
			document.getElementById("room_1").click();
},b,b,b,b,b,b,b,b,
function(){
			document.getElementById("startGame").click();
},
]
stepCount = 0;
var autoRun;
autoRun = setInterval(function(){
	codes[stepCount]();
	stepCount++;
	if(stepCount >= codes.length)
		clearInterval(autoRun);
}
, 100);