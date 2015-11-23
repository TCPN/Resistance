
//var shuffle = require("./shuffle.js").shuffle;
function dupObjS(obj)
{
	return JSON.parse(JSON.stringify(obj));
}
function shuffle(array)
{
	if(array.constructor != Array)
		throw new Error("只能對array進行shuffle");
		
	N = array.length;
	newArray = [];
	for(; array.length > 0; )
	{
		var index = Math.floor( Math.random() * array.length );
		var item = array[index];
		array = array.slice(0,index).concat(array.slice(index + 1));
		newArray.push( item );
	}
	return newArray;
}
var test;
function Game(playerNumber)
{test = function(s){return eval(s);};
	if(!playerNumber || playerNumber < 2 || playerNumber > 6)
		throw new Error("遊戲人數必須是2~6人");
				
	/*	status:
	Init
	WaitAction
	WaitDoubt Action
	WaitProof Action
	WaitDoubt Counter
	WaitProof Counter
	WaitCounter
	WaitKill ProofFail ActionKeep
	WaitKill DoubtFail ActionKeep
	WaitKill ProofFail ActionStop
	WaitKill DoubtFail ActionStop
	WaitKill Exec
	WaitDrop Exec
	TurnEnd
	End
	*/
	
	var status = ["Init"];

	var players = new Array(playerNumber);
	var deck = [	"公爵","公爵","公爵",
					"殺手","殺手","殺手",
					"大使","大使","大使",
					"船長","船長","船長",
					"女爵","女爵","女爵",];
	var waiting = [];
	var actor;
	var counterer;
	var action;
	var counter;
	var doubter;
	var doubtee;
	var maybeCounter;
	var victim;
	var whoToDie;
	
	var winner;
	
	
	function Player(ID)
	{
		this.id = ID;
		Object.defineProperty(
		this,"id",{writable:false}
		);
		this.cards = [];
		this.deads = [];
		this.money = 0;
		Object.defineProperty(
		this,"isAlive",{get: function(){return this.deads.length < 2;}, enumerable: true}
		);
	}
	
	var pay = function(player, amount)
	{
		if(player.money >= amount)
			player.money -= amount;
		else
			throw new Error("沒有足夠的錢");
		GameCtrl.newmsg({event:"pay",player:player.id,amount:amount});
	}
	var earn = function(player, amount)
	{
		player.money += amount;
		GameCtrl.newmsg({event:"earn",player:player.id,amount:amount});
	}
	var findCard = function(player, card)
	{
		i = player.cards.indexOf(card);
		if(i < 0)
			throw new Error("沒有這張卡片");
		else
			return i;
	}
	var die = function(player, card)
	{
		player.cards.splice(findCard(player,card),1);
		player.deads.push(card);
		GameCtrl.newmsg({event:"die",player:player.id,card:card});
	}
	var drop = function(player, card)
	{
		player.cards.splice(findCard(player,card),1);
		deck.push(card);
		GameCtrl.newmsg({event:"drop",player:player.id,card:card});
	}
	var draw = function(player)
	{
		var card = deck.pop();
		player.cards.push(card);
		GameCtrl.newmsg({event:"draw",player:player.id,card:card});
	}
	var open = function(player,card)
	{
		findCard(player,card);
		GameCtrl.newmsg({event:"open",player:player.id,card:card});
	}
	var turnToNextActor = function()
	{
		actor = nextActor();
		GameCtrl.newmsg({event:"turnTo",player:actor.id});
	}
	var nextActor = function()
	{
		if(!actor)
			return players[0];
		alive = players.filter(function(p){return p.isAlive;});
		i = alive.indexOf(actor);
		return (alive[i+1] || alive[0]);
	}
	
	var notWaiting = function()
	{
		return (new Array(playerNumber).map(function(){return false}));
	}
	
	var actions = {
	"$+1"	:{name:   "$+1", cost: 0, needObject: false, claim:  null , counter:  null },
	"$+2"	:{name:   "$+2", cost: 0, needObject: false, claim:  null , counter: ["公爵"]},
	"coup"	:{name:  "coup", cost: 7, needObject:  true, claim:  null , counter:  null },
	"$+3"	:{name:   "$+3", cost: 0, needObject: false, claim: "公爵", counter:  null },
	"kill"	:{name:  "kill", cost: 3, needObject:  true, claim: "殺手", counter: ["女爵"]},
	"steal"	:{name: "steal", cost: 0, needObject:  true, claim: "船長", counter: ["船長","大使"]},
	"change":{name:"change", cost: 0, needObject: false, claim: "大使", counter:  null },
	};
	function run(response)
	{// DONE TODO wait裡面不應該有已經死掉的人
		if( response != undefined
			&& ( (!players[response.subjectID].isAlive)
			||   (! waiting[response.subjectID])
			||   (response.status.toString() != status.toString()) ) )
			throw new Error("目前你不能進行操作");
		if(status[0] == "Init")
		{
			deck = shuffle(deck);
			for(var i = 0; i < playerNumber; i ++)
			{
				players[i] = new Player(i);
				players[i].money = 2;
				draw(players[i]);
				draw(players[i]);
			}
			//actor = players[0];
			turnToNextActor();
			//ask(actor, "Action");
			waiting = players.map(function(p){return (p == actor)});
			status = ["WaitAction"];
			GameCtrl.informCtrls();
			return;
		}
		else if(status[0] == "WaitAction")
		{// DONE TODO 十塊錢以上的人必須政變
			if(!(response.action in actions))
				throw new Error("沒有這個行動");
			if(actions[response.action].needObject && response.victim == undefined)
				throw new Error("必須指定對象");
			if(actions[response.action].needObject && response.victim != undefined
				&& (! players[response.victim].isAlive || players[response.victim] == actor))
				throw new Error("不能指定這個對象");
			if(actor.money >= 10 && response.action != "coup")
				throw new Error("你有10塊錢以上，必須發動政變");
			pay(actor,actions[response.action].cost);
		
			//資料正確，行動成立
			action = actions[response.action];
			victim = players[response.victim];
			GameCtrl.newmsg({event:"action",action:response.action,victim:response.victim });
			if(action.claim != null) // has claimed
			{
				//ask("Doubt");
				waiting = players.map(function(p){return (p.isAlive && p != actor)});
				status = ["WaitDoubt","Action"];
				GameCtrl.informCtrls();
				return;
			}
			else
			{
				maybeCounter = undefined; // first time wait for counter for this action
				waiting = notWaiting();
				status = ["WaitCounter"];
				setTimeout(run,0);
				return;
			}
		}
		else if(status[0] == "WaitCounter") // 或許可以分成Counter和WaitCounter兩個state
		{
			if( !action.counter )
			{
				waiting = notWaiting();
				status = ["DoAction"];
				setTimeout(run,0);
				return;
			}
			else if( maybeCounter == undefined ) // first time wait for counter for this action
			{
				if(action == actions["$+2"])
				{
					maybeCounter = players.map(function(p){return (p.isAlive && p != actor)});
				}
				else if(action == actions["kill"] || action == actions["steal"])
				{
					maybeCounter = players.map(function(p){return (p.isAlive && p == victim)});
				}
			}
			else if(response) // a reply comes
			{
				if(response.counter == "放棄") // a no
				{
					maybeCounter[response.subjectID] = false;
				}
				else if(action.counter.indexOf(response.counter) < 0) // wrong counter
				{
					throw new Error("不適用這個反制行動");
				}
				else // a yes
				{
					//maybeCounter[response.subjectID] = false;
					
					counterer = players[response.subjectID];
					counter = response.counter;
					
					waiting = players.map(function(p){return (p.isAlive && p != counterer)});
					status = ["WaitDoubt","Counter"];
					GameCtrl.informCtrls();
					return;
				}
			}
			
			for(var i = 0; i < playerNumber; i ++) // is this neccesarry?
			{
				if(!players[i].isAlive)
					maybeCounter[i] = false;
			}
			
			if(maybeCounter.every(function(v){return (v == false)})) // all no
			{
				waiting = notWaiting();
				status = ["DoAction"];
				setTimeout(run,0);
				return;
			}
			else // some no
			{
				waiting = maybeCounter.concat([]);
				status = ["WaitCounter"];
				GameCtrl.informCtrls();
				return;
			}
		}
		else if(status[0] == "DoAction")
		{
			if(action == actions.kill || action == actions.coup)
			{
				if(victim.isAlive)
				{
					whoToDie = victim;
					waiting = players.map(function(p){return p == victim});
					status = ["WaitKill","DoAction"];
					GameCtrl.informCtrls();
					return;
				}
			}
			else if(action == actions.change)
			{
				draw(actor);
				draw(actor);
				waiting = players.map(function(p){return p == actor});
				status = ["WaitDrop","DoAction"];
				GameCtrl.informCtrls();
				return;
			}
			else if(action == actions.steal)
			{
				if(victim.money >= 2)
				{
					pay(victim,2);
					earn(actor,2);
				}
				else
				{// TODO 增加專門機制 ?
					earn(actor,victim.money);
					pay(victim,victim.money);
				}
			}
			else if(action == actions["$+1"])
				earn(actor,1);
			else if(action == actions["$+2"])
				earn(actor,2);
			else if(action == actions["$+3"])
				earn(actor,3);
			waiting = notWaiting();
			status = ["TurnEnd"];
			setTimeout(run,0);
			return;
		}
		else if(status[0] == "WaitDoubt")
		{
			if(response.doubt == false)
			{
				waiting[response.subjectID] = false;
			
				if(waiting.every(function(v){return v == false})) // all no
				{
					if(status[1] == "Action")
					{
						status = ["WaitCounter"];
					}
					else if(status[1] == "Counter")
					{
						status = ["TurnEnd"];
					}
					waiting = notWaiting();
					setTimeout(run,0);
					return;
				}
				else
				{
					GameCtrl.informCtrls();
					return;
				}
			}
			else if(response.doubt == true)
			{
				doubter = players[response.subjectID];
				if(status[1] == "Action")
				{
					doubtee = actor;
				}
				else if(status[1] == "Counter")
				{
					doubtee = counterer;
				}
				waiting = players.map(function(p){return p == doubtee});
				status[0] = "WaitProof";
				setTimeout(run,0);
				return;
			}
			return;
		}
		else if(status[0] == "WaitProof") // 拆兩半變成CheckProvable和WaitProof ? 或 前半移到WaitDoubt
		{
			var claim;
			if(status[1] == "Action")
			{
				claim = action.claim;
			}
			else if(status[1] == "Counter")
			{
				claim = counter;
			}
			
			if(doubtee.cards.indexOf(claim) < 0 /* lied */ || (response != undefined && response.proof == false) )
			{
				whoToDie = doubtee;
			}
			else if(response != undefined && response.proof == true)
			{
				open(doubtee,claim);
				drop(doubtee,claim);
				deck = shuffle(deck);
				draw(doubtee);
				whoToDie = doubter;
			}
			if( whoToDie != undefined)
			{
				status = ["WaitKill",(whoToDie == doubter ? "DoubtFail" : "ProofFail")].concat(status[1]);
				setTimeout(run,0);
			}
			else
			{
				GameCtrl.informCtrls();
			}
			return;
		}
		else if(status[0] == "WaitKill")
		{// DONE TODO 只剩一張的人不用選
			if(!response)
			{
				if(whoToDie.cards.length >= 2 )
				{
					waiting = players.map(function(p){return p == whoToDie;});
					GameCtrl.informCtrls();
					return;
				}
				else if(whoToDie.cards.length == 1 )
				{
					die(whoToDie,whoToDie.cards[0]);
				}
			}
			else
			{
				if(!response.die)
					throw new Error("必須選擇一張卡片");
				die(whoToDie,response.die);
			}
			whoToDie = undefined;
			if(	(status[1] == "ProofFail" && status[2] == "Counter") 
				 ||	(status[1] == "DoubtFail" && status[2] == "Action") )
			{
				status = ["WaitCounter"];
			}
			else
			{
				status = ["TurnEnd"];
			}
			waiting = notWaiting();
			setTimeout(run,0);
			return;
		}
		else if(status[0] == "WaitDrop")
		{
			if(!Array.prototype.isPrototypeOf(response.drops) || response.drops.length != 2)
				throw new Error("必須拋棄兩張");
			drop(actor,response.drops[0]);
			drop(actor,response.drops[1]);
			deck = shuffle(deck);
			waiting = notWaiting();
			status = ["TurnEnd"];
			setTimeout(run,0);
			return;
		}
		else if(status[0] == "TurnEnd")
		{
			counterer = undefined;
			action = undefined;
			counter = undefined;
			doubter = undefined;
			doubtee = undefined;
			maybeCounter = undefined;
			victim = undefined;
			whoToDie = undefined;
			
			alives = players.filter(function(p){return p.isAlive;});
			if(alives.length == 1)
			{
				winner = alives[0];
				waiting = notWaiting();
				status = ["End"];
				setTimeout(run,0);
				return;
			}
			else
			{
				actor = nextActor();
				waiting = players.map(function(p){return (p == actor);});
				status = ["WaitAction"];
				GameCtrl.informCtrls();
				return;
			}
		}
		else if(status[0] == "End")
		{
		}
		
	}
	
	
	function GameCtrl(role, playerID)
	{
		if(role == undefined || playerID == undefined)
			throw new Error("必須指定ctrl的role和ID");
		if(role == "player" && (playerID == undefined || playerID < 0 || playerID > 5))
			throw new Error("必須指定ctrl代表的player ID");
		if(role == "player")
		{
			oldc = GameCtrl.idToCtrl(playerID) ;
			if(oldc != undefined)
				return oldc;
		}
				
		var thisRole = role;
		var thisPlayerID = playerID;
		Object.defineProperty(this, "role", {get: function(){return thisRole}, enumerable: true});
		Object.defineProperty(this, "playerID", {get: function(){return thisPlayerID}, enumerable: true});
		
		// TODO: 讓user加入的機制
		this.user = null;
		Object.defineProperty(this, "name", 
			{	
				enumerable: true, 
				get: function()
				{
					if(this.user != undefined)
						return this.user.name;
					else
						return (thisRole + " " + thisPlayerID);
				} 
			}
		);
		Object.defineProperty(this, "inform", 
			{	
				enumerable: true, 
				get: function()
				{
					if(this.user != undefined)
						return function(){this.user.inform();};
					else
						return function(){};
				}
			}
		);
		
		
		this.lastGameStates;		
		this.getGameStates = function()
		{
			return this.lastGameStates = 
			{
				status: status.concat([]),
				players: function()
					{
						var ps = JSON.parse(JSON.stringify(players));
						for(i in ps)
						{
							if(ps[i].id != thisPlayerID  && thisRole != "admin")
								ps[i].cards.forEach(function(v,i,a){a[i]="unknown"});
						}
						return JSON.parse(JSON.stringify(ps));
					}(),
				deck: (deck != undefined ? (thisRole == "admin" ? deck.concat([]) : deck.concat([]).map(function(){return "unknown"})) : null),
				waiting: (waiting != undefined ? waiting.concat([]) : null ),
				actor: (actor != undefined ? actor.id : null ), 
				action: (action != undefined ? action.name : null ), 
				counterer: (counterer != undefined ? counterer.id : null ), 
				counter: counter, // card name
				doubter: (doubter != undefined ? doubter.id : null ), 
				doubtee: (doubtee != undefined ? doubtee.id : null ), 
				victim: (victim != undefined ? victim.id : null ),
				whoToDie: (whoToDie != undefined ? whoToDie.id : null ),
				winner: (winner != undefined ? winner.id : null ),
				
				myID: thisPlayerID,
				userName: GameCtrl.getPlayerNames(),
			}
		}
		
		var msgs = [];
		
		this.readallmsg = function() // for user
		{
			var r = msgs.concat([]);
			msgs = [];
			return r;
		}
		
		this.readmsg = function() // for user
		{
			return msgs.shift();
		}
		
		this.processmsg = function(newmsg) // for game
		{
			var modifiedmsg = JSON.parse(JSON.stringify(newmsg)); // duplicate msg
			
			// DONE TODO: modify the message, hide some information
			
			switch(modifiedmsg.event)
			{
				case "drop":
				case "draw":
					if(thisPlayerID != modifiedmsg.player)
						modifiedmsg.card = "unknown";
					break;
				case "pay":
				case "earn":
				case "die":
				case "open":
				case "turnTo":
				case "action":
					break;
			}
			
			msgs.push(modifiedmsg);
			// when recv new msg, update from game states
			// getGameStates();
		}
		
		this.input = function() // accept several <actionName>/<playerID>/<cardName>/<true/false>
		{
			// ??? 這裡也要再次檢查現在可不可以操作嗎
			// if(thisID != currentPlayer.id)
				// throw new Error("目前不是你的回合");
			// if(status != "WaitForDiscard")
				// throw new Error("目前不能進行動作");		
			
			function getFieldName(inputValue)
			{
				switch(inputValue)
				{
					case "$+1":case "$+2":case "coup":case "$+3":case "kill":case "steal":case "change":
						return "action";
					case "公爵":case "女爵":case "殺手":case "船長":case "大使":case "放棄":
						if(status[0] == "WaitCounter")
							return "counter";
						else if(status[0] == "WaitKill")
							return "die";
						else
							return "drops";
					case true: case false:
						if(status[0] == "WaitDoubt")
							return "doubt";
						else
							return "proof";
					case ((((typeof inputValue) == "number") && inputValue >= 0 && inputValue <= 5 ) ? inputValue : NaN):
						return "victim";
				}
				return undefined;
			}
			
			var response = {};
			
			for(var a in arguments)
			{
				var f = getFieldName(arguments[a]);
				if(f == "drops")
					response[f] = (response[f] || []).concat(arguments[a]);
				else
					response[f] = arguments[a];
			}
			response.status = status;
			response.subjectID = thisPlayerID;
			
			/* response form : {status: <statusArray>, subjectID: <playerID>, + // not input by user
			WaitAction	: + action: <actionName>, [victim: <playerID>]}
			WaitCounter	: + counter: <cardName>}
			WaitDoubt	: + doubt: <true/false>}
			WaitProof	: + proof: <true/false>}
			WaitKill	: + kill: <cardName>}
			WaitDrop	: + drops: <Array[cardName,cardName]>}
			*/
			
			try
			{
				run(response);
			}
			catch(e)
			{
				console.log("Error when controller[" + thisCtrlID + "].input() :");
				console.error(e);
				throw e;
			}
		}
		
		this.leave = function()
		{
		}
		
		if(role == "admin")
		{/*
			this.storedStates;
			this.storeStates = function(){this.storedStates = this.update();}
			this.setStatus = function(v){status = v;}
			this.setDeck = function(v){deck = v;}
			this.setCovered = function(v){covered = v;}
			this.setPlayers = function(v){players = v;}
			this.setWinner = function(v){winner = v;}
			this.setCurrentPlayer = function(v){currentPlayer = v;}
			this.getCurrentPlayer = function(){return currentPlayer;}
			this.getDeck = function(){return deck;}
			this.getCovered = function(){return covered;}
			this.getPlayers = function(){return players;}
			this.restoreStates = function(){
				this.setStatus(this.storedStates.status);
				this.setDeck(this.storedStates.deck);
				this.setCovered(this.storedStates.covered);
				this.setPlayers(this.storedStates.players);
				this.setCurrentPlayer(this.getPlayers()[this.storedStates.currentPlayerID]);
				this.setWinner(this.getPlayers()[this.storedStates.winner]);
			}*/
		}
		
		var thisCtrlID = GameCtrl.count;
		Object.defineProperty(this, "ctrlID", {get: function(){return thisCtrlID}, enumerable: true });
		GameCtrl.ctrls[thisCtrlID] = this;
		GameCtrl.count++;
	}
	GameCtrl.ctrls = [];
	GameCtrl.count = 0;
	GameCtrl.newmsg = function(msg)
	{
		for(var i in GameCtrl.ctrls)
		{
			GameCtrl.ctrls[i].processmsg(msg);
		}
	}
	GameCtrl.informCtrls = function()
	{
		for(var i in GameCtrl.ctrls)
		{
			GameCtrl.ctrls[i].inform();
		}
	}
	
	GameCtrl.idToCtrl = function(ID)
	{
		for(var i in GameCtrl.ctrls)
		{
			if(GameCtrl.ctrls[i].role == "player" && 
					GameCtrl.ctrls[i].playerID == ID)
				return GameCtrl.ctrls[i];
		}
		return undefined;
	}
	GameCtrl.idToName = function(ID)
	{
		var ctrl = GameCtrl.idToCtrl(ID);
		if(ctrl)
			return ctrl.name;
		return undefined;
	}
	GameCtrl.playerToName = function(player)
	{
		return GameCtrl.idToName(player.id);
	}
	GameCtrl.getPlayerNames = function()
	{
		return players.map(GameCtrl.playerToName);
	}
	
	this.getCtrl = function(role, ID)
	{
		return new GameCtrl(role, ID);
	}
	
	this.start = function()
	{
		if(status == "Init")
			run();
		else
			throw new Error("遊戲已經開始了");
	}
}