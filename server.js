#!/bin/env node
var server = require("http").createServer(handler);
var io = require("socket.io")(server);
var fs = require("fs");
var url = require("url");
var createUser = require("./WaitForGame").createUser;

if(process.env.OPENSHIFT_NODEJS_PORT == null)
{
	server.listen(80);
}
else
{
	server.listen(process.env.OPENSHIFT_NODEJS_PORT, process.env.OPENSHIFT_NODEJS_IP);
}

route = {
	"/resistance" 			: "/ResistanceUI.html",
	"/favicon.ico" 			: "/resistance icon.png",
	"/socket.io.test" 		: "/socketiotest.html",
	"/uitest" 				: "/UItest.html",
	"/resistance/rule" 		: "/Rule.html",
	"/resistance/legend" 	: "/Legend.html",
	"/resistance/flow" 		: "/flow.png",
	
	"/test/LoveLetter" 		: "/LoveLetterCoreTest.html",
	"/test/LoveLetter.js" 	: "/LoveLetterCore.js",
	"/test/Coup" 			: "/CoupCoreTest.html",
	"/test/Coup.js" 		: "/CoupCore.js",
}

function handler (req, res) {
	var pathname = url.parse(req.url).pathname;
	var returnPage = route[pathname];
	console.log("look for " + pathname + " : return " + returnPage);
	if(returnPage == undefined)
	{
		res.writeHead(404);
		res.end("Page not found");
		return;
	}
	fs.readFile(__dirname + returnPage,
	function (err, data) {
		if (err) {
			console.log(err);
			res.writeHead(500);
			return res.end("Error loading " + pathname);
		}
		res.writeHead(200, {"Content-Type": "text/html"});
		res.end(data);
	});
}

io.on('connection', createUser);