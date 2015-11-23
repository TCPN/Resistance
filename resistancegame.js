/*
	game={
		sendto:string<myName>
		status:enum{
			propose
			waitPropose
			afterPropose
			vote
			afterVote
			execute
			waitExecute
			AfterExecute
		}
		view.players:[
			<playerInfo>{
				name:string
				camp:string
				isLeader:bool
				inProposal:bool
				vote:bool
				specialIdentity:string(梅林,假梅林,刺客,偷窺者)
			}
		]
		showcamp
		campRed
		Leader
		Proposal
		showvote
		voteX
		
		Merlin
		
		round:int
		voteround:int
		roundrecordList:[
			<roundRecord>{
				proposals:[
					{
						chosens:[<name>:string]
						agrees:[<name>:string>]
						//disagree:[<name:string>]
					}
				]
				execution:{
					red:int
					//blue:int
				}
			}
		]
	}
	*/
Array.prototype.removeIndexOf=function(index){if(index<0 || index >= this.length)return;tmp = [];for(i = 0; i <= index; i++){tmp.push(this.shift())};r=tmp.pop();for(i = 0; i < index; i++){this.unshift(tmp.pop())};return r}
Array.prototype.remove=function(item){return this.removeIndexOf(this.indexOf(item))}

/*
"game": 
(this.gameCtrl == undefined ? undefined :
	{
		"view": this.gameCtrl.view(),
		{
		status             : viewStatus               (viewPoint),
		players            : viewPlayers              (viewPoint),
		roles              : viewRoles                (viewPoint),
		chairman           : viewChairman             (viewPoint),
		currentMission     : viewCurrentMission       (viewPoint),
		missionRequirement : viewMissionRequirement   (viewPoint),
		missionResult      : viewMissionResult        (viewPoint),
		proposeCount       : viewProposeCount         (viewPoint),
		proposed           : viewProposed             (viewPoint),
		votes              : viewVotes                (viewPoint),
		disruption         : viewDisruption           (viewPoint),
		fightResult        : viewFightResult          (viewPoint),
		winner             : viewWinner               (viewPoint)
		}
		"status": this.gameCtrl.getUserStatus(),
		"isChairman": this.gameCtrl.isChairmanNow(),
		"isBlue": this.gameCtrl.isBlue(),
		"isDispatched": this.gameCtrl.isDispatched(),
		"history": this.gameCtrl.getGameHistory(),
		"shouldShow": this.gameCtrl.shouldDisplayResult(),
		"lastVote": this.gameCtrl.getLastVoteResult(),
		"lastExecute": this.gameCtrl.getLastExecuteResult(),
		"lastPropose": this.gameCtrl.getLastProposal(),
	}
),
*/
myrole=
{
	"name":"Jaren",
	"isLeader":true,
	"camp":"red",
}
game=
{
	"status": "propose",
	"view":{
		"players":["TCPN","Liuseemin","Learning","Jaren","Shirley","David","Winnie","Shantina","Jessie"],
		"chairman":"Jaren",
		"votes":["O","X","O","O","O","X","X","O","O",],
	}
	"showvote":true,
	"campRed":["TCPN","Jaren","Liuseemin"],
	"proposal":["Learning","Jaren","David","Shirley"],
	"playerListLastModified":new Date(),
	
	"currentRound" : 3,
	"currentVote" : 3,
	
	"roundrecord":
	[
		{
			"needNumber": 3,
			"proposal":
			[
				{
					"leader":"Shantina",
					"list":["Shantina","Jaren","David"],
					"voteX":[],
				},
			],
			"resultblue": true
		},
		{
			"needNumber": 4,
			"proposal":
			[
				{
					"leader":"Jessie",
					"list":["Winnie","David","Liuseemin","Shirley"],
					"voteX":["TCPN","Learning","Jaren","Shantina","David"],
				},
				{
					"leader":"TCPN",
					"list":["Winnie","TCPN","Liuseemin","Shirley"],
					"voteX":["David","Learning"],
				},
			],
			"resultblue": false
		},
		{
			"needNumber": 4,
			"proposal":
			[
				{
					"leader":"Liuseemin",
					"list":["Winnie","Shantina","Liuseemin","Shirley"],
					"voteX":["TCPN","Learning","Jaren","Shirley","David","Winnie","Shantina","Jessie"],
				},
				{
					"leader":"Learning",
					"list":["Learning","Shirley","Shantina","Winnie"],
					"voteX":["TCPN","Shirley","Jaren","Liuseemin","Jessie","David"],
				},
				{
					"leader":"Jaren",
				},
			],
		},
		{
			"needNumber": 5,
		},
		{
			"needNumber": 5,
		},
	]
}
function displayPlayerList()
{
	pdom = document.getElementsByClassName("player");
	plen = game.view.players.length;
	p = game.view.players;
	for(i = 0; i < 10; i ++)
	{
		if(i < plen)
		{
			pdom[i].style.display = "flex";
			pdom[i].getElementsByClassName("name")[0].textContent = p[i];
			if(game.view.chairman == i)
				pdom[i].getElementsByClassName("name")[0].style.textShadow = "0 0 10px yellow,0 0 10px yellow,0 0 10px yellow";
			else
				pdom[i].getElementsByClassName("name")[0].style.textShadow = "";
			if(game.view.proposed.indexOf(p[i]) >= 0)
				pdom[i].getElementsByClassName("inproposal")[0].style.visibility = "visible";
			else
				pdom[i].getElementsByClassName("inproposal")[0].style.visibility = "hidden";
			switch(game.view.roles[i])
			{
				case "red":
					pdom[i].style.background = "lightcoral";
					break;
				case "blue":
					pdom[i].style.background = "skyblue";
					break;
				default:
					pdom[i].style.background = "lightgray";
					break;
			}
			if(game.shouldShow == "vote")
			{
				pdom[i].getElementsByClassName("vote")[0].style.visibility = "visible";
				pdom[i].getElementsByClassName("vote")[0].textContent = game.view.votes[i];
			}
			else
			{
				pdom[i].getElementsByClassName("vote")[0].style.visibility = "hidden";
				pdom[i].getElementsByClassName("vote")[0].textContent = "";
			}

		}
		else
			pdom[i].style.display = "none";
	}
}
function playerListShouldRefresh(gameMessage)
{
	if(gameMessage)
		return (gameMessage.playerListLastModified > game.playerListLastModified);
	return true;
}
function displayRoundRecord()
{
	rcdom = document.getElementById("roundinfo").children;
	rc = game.history;
	for(i = 0; i < 5; i ++)
	{
		if(rc.missions[i].missionResult == undefined)
		{
			rcdom[i].style.background = "lightgray";
		}
		else if(rc.missions[i].missionResult == true)
		{
			rcdom[i].style.background = "skyblue";
		}
		else
		{
			rcdom[i].style.background = "lightcoral";
		}
		
		if(rc.missions[i].acceptedProposal == undefined)
			rcdom[i].children[1].style.visibility = "hidden";
		else
		{
			rcdom[i].children[1].style.visibility = "visible";
			
			if(rc.missions[i].missionResult == undefined)
				rcdom[i].children[1].style.background = "yellow";
			else
			{
				rcdom[i].children[1].style.background = "gray";
			}
				
			rcdom[i].children[1].innerHTML = rc[i].proposal.length + "th vote";
		
		}
		rcdom[i].children[0].innerHTML = "Need<br/>" + rc.missionRequirements[i] + "<br/>agents";
	}
}
function displayProposePanel()
{
	pdom = document.getElementById("proposepanel").getElementsByTagName("div");
	plen = game.view.players.length;
	p = game.view.players;
	var rowCounter = 0;
	var firstRowTop = pdom[0].offsetTop;
	for(i = 0; i < 10; i ++)
	{
		if(i < plen)
		{
			pdom[i].style.display = "flex";
			pdom[i].textContent = p[i];
			pdom[i].style.flexGrow = "1";
			if(pdom[i].offsetTop == firstRowTop)
				rowCounter ++;
		}
		else
		{
			pdom[i].style.display = "none";
			pdom[i].textContent = "";
		}
	}
}
function displayResistanceGame(gameMessage)
{
	//game = gameMessage;
	/*
	if(!gameMessage)
		displayPlayerList();
	else if(playerListShouldRefresh(gameMessage))
	{
		console.log("refresh player list\n");
		game.view.players = gameMessage.view.players;
		displayPlayerList();
	}
	*/
	displayPlayerList();
	displayRoundRecord();
	
	switch(game.status)
	{
		
		case "Proposing": // you are leader
			document.getElementById("proposepanel").style.display="flex";
			document.getElementById("votepanel").style.display="none";
			document.getElementById("executemissionpanel").style.display="none";
			displayProposePanel();
			break;
		case "WaitForProposingFinish":
			break;
		case "afterPropose":
			break;
		case "vote":
			document.getElementById("proposepanel").style.display="none";
			document.getElementById("votepanel").style.display="flex";
			document.getElementById("executemissionpanel").style.display="none";
			break;
		case: "WaitForVoting"
			break;
		case "afterVote":
			break;
		case "Executing":
			document.getElementById("proposepanel").style.display="none";
			document.getElementById("votepanel").style.display="none";
			document.getElementById("executemissionpanel").style.display="flex";
			document.getElementById("executemissionpanel").children[1].style.display = ((myrole.camp == "red")?"flex":"none");
			break;
		case "WaitForExecutingFinish":
			break;
		case "AfterExecute":
			break;
		default:
			break;
	}
}
game.nextState=function()
{
	switch(game.status)
	{
		case "propose":
			game.status="vote";
			break;
		case "vote":
			game.status="execute";
			break;
		case "execute":
			game.status="propose";
			break;
		default:
			game.status="propose";
			break;
	}
	displayResistanceGame();
}
displayResistanceGame();