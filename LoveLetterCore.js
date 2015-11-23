function Game(playerNumber)
{
	if(!playerNumber || playerNumber < 2 || playerNumber > 4)
		throw new Error("遊戲人數必須在2~4人");
				
	var status = "Initializing";
	/* STATUS
	 * "Initializing"
	 * "RoundStart"
	 * "TurnStart"
	 * "WaitForDiscard"
	 * "ProcessingDiscard"
	 * "Ended"
	 */
	
	var currentPlayer;
	var players = [];	// Ctrl[]
	var deck = [];
	var covered = [];
	
	var winner;

	var msg = [];
	
	var fightResult = undefined;
	
	var gameHistory = undefined;
	var resultNeedDisplay = undefined;

	var shuffle = function(array)
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
	
	var firstPlayerInRound = function()
	{
	}
	var nextPlayerInTurn = function()
	{
		if(!currentPlayer)
			i = 0;
		i = currentPlayer.id;
		do
		{
			i = (i + 1) % playerNumber;
			if( !players[i].isOut )
				return players[i];
		}while(i != currentPlayer.id);
		// if run here, currentPlayer wins in fact
		return false;
	}
	
	function Player(ID)
	{
		//this.id = ID; //TODO: should be immutable, or only can get ,not set
		Object.defineProperty(this,"id",{value:ID,writable:false}); //TODO: should be immutable, or only can get ,not set
		this.cards = [];
		this.discards = [];
		this.isProtected = false;
		this.isOut = false;
		this.loves = 0;
	}
	var coverACard = function()
	{
		var popped = deck.pop();
		covered.push( popped );
		
		msg.push({event:"cover",value:popped});
	}
	var drawCard = function(player){ 
		 // if deck is empty, it should get the covered card
		 // player.cards.push( deck.pop() || covered );
		var drawn = deck.pop();
		if(drawn == undefined)
			drawn = covered.shift();  //事實上應該取最先蓋的牌
		player.cards.push( drawn );
		
		msg.push({event:"draw",player:player.id,value:drawn});
	}
	var haveCard = function(player,card){
		var idx = player.cards.indexOf(card);
		return idx >= 0;
	}
	var discard = function(player,card){
		var idx = player.cards.indexOf(card);
		player.cards.splice(idx,1);
		player.discards.push(card);
		
		msg.push({event:"discard",player:player.id,value:card});
	}
	var undoCurrentDiscard = function(){
		currentPlayer.cards.push( currentPlayer.discards.pop() );
	}
	var stopProtect = function(player){
		player.isProtected = false;
		msg.push({event:"noprotect",player:player.id});
	}
	var protect = function(player){
		player.isProtected = true;
		msg.push({event:"protect",player:player.id});
	}
	var out = function(player){
		discard(player, player.cards[0]);
		player.isOut = true;
		msg.push({event:"out",player:player.id});
	}
	var winLove = function(player){
		player.loves ++;
		msg.push({event:"winLove",player:player.id});
	}
	
	var run = function(response)
	{
		//response:{useCard: ,objectPlayer: ,guess: }
		if(status == "Initializing")
		{
			players = [];
			for(i = 0; i < playerNumber; i ++)
			{
				players[i] = new Player(i);
			}
			status = "RoundStart"; // TODO: 抽取更改狀態、定時、下一階段
			setTimeout(run,1);
			return;
		}
		else if(status == "RoundStart")
		{
			msg.push({event:"RoundStart", msg:"新的一局開始了！"});
			
			// init players 
			for(i in players)
			{
				players[i].cards = [];
				players[i].discards = [];
				players[i].isProtected = false;
				players[i].isOut = false;
			}
			// PREPARE DECK
			deck = [1,1,1,1,1,2,2,3,3,4,4,5,5,6,7,8];
			deck = shuffle(deck);
			covered = [];
			
			// cover cards
			coverACard();
			if(playerNumber == 2)
			{
				coverACard();
				coverACard();
			}
			// everyone draw 1 card
			for(i in players)
			{
				drawCard(players[i]);
			}
			
			// decide who first in this round
			// players[0]
			if(!currentPlayer)
				currentPlayer = players[0];
			// next from current
			//currentPlayer = players[ (currentPlayer.id + 1) % playerNumber ];
			// winner
			//currentPlayer = winner;
			// random
			//currentPlayer = players[ Math.floor( Math.random() * playerNumber ) ];
			
			status = "TurnStart";
			setTimeout(run,1);
			return;
		}
		else if(status == "TurnStart")
		{
			msg.push({event:"TurnStart", player:currentPlayer.id});
			
			stopProtect(currentPlayer);
			drawCard(currentPlayer);
			
			status = "WaitForDiscard";
			sendMsg();
			return;
		}
		else if(status == "WaitForDiscard")
		{
			status = "ProcessingDiscard";
			if(!response || !response.useCard)
			{
				status = "WaitForDiscard";
				msg = [{event: "error", msg: "至少要丟出一張卡片"}];
				sendMsg();
				return;
			}
			useCard = response.useCard;
			if( !haveCard(currentPlayer,useCard) )
			{
				status = "WaitForDiscard";
				msg = [{event: "error", msg: "你沒有這張卡片"}];
				sendMsg();
				return;
			}
			discard(currentPlayer,useCard);
			// 應該在一開始就檢查出牌的合法性嗎？
			
			
			// rule of 7
			if(currentPlayer.cards[0] == 7 && (useCard == 5 || useCard == 6))
			{
				undoCurrentDiscard();
				status = "WaitForDiscard";
				msg = [{event: "error", msg: "你必須丟棄7"}];
				sendMsg();
				return;
			}
			else if(useCard == 7)
			{
			}
			// rule of 8
			else if(useCard == 8)
			{
				out(currentPlayer);
			}
			// rule of 4
			else if(useCard == 4)
			{
				protect(currentPlayer);
			}
			else
			{
				if(response.objectPlayer == undefined || response.objectPlayer == null)
				{
					undoCurrentDiscard();
					status = "WaitForDiscard";
					msg = [{event: "error", msg: "必須有一個對象"}];
					sendMsg();
					return;
				}
				objectPlayer = players[response.objectPlayer];
				if(objectPlayer.isProtected || objectPlayer.isOut)
				{
					undoCurrentDiscard();
					status = "WaitForDiscard";
					msg = [{event: "error", msg: "你不能攻擊他"}];
					sendMsg();
					return;
				}
				else
				{
					// rule of 1
					if(useCard == 1)
					{
						if(!response.guess)
						{
							undoCurrentDiscard();
							status = "WaitForDiscard";
							msg = [{event: "error", msg: "必須做出猜測"}];
							sendMsg();
							return;
						}
						else if(response.guess == 1)
						{
							undoCurrentDiscard();
							status = "WaitForDiscard";
							msg = [{event: "error", msg: "你不能猜1"}];
							sendMsg();
							return;
						}
						else 
						{
							msg.push({event:"guess", player: objectPlayer.id, value:response.guess});
							if(response.guess == objectPlayer.cards[0])
							{
								out(objectPlayer);
							}
						}
					}
					// rule of 2
					else if(useCard == 2)
					{
						// PEEK
						msg.push({event:"peek", peeker:currentPlayer.id, peekee:objectPlayer.id, value:objectPlayer.cards[0]});
					}
					// rule of 3
					else if(useCard == 3)
					{
						msg.push({event:"compare", player1:currentPlayer.id, player2:objectPlayer.id, value1:currentPlayer.cards[0],value2:objectPlayer.cards[0]});
						if(currentPlayer.cards[0] > objectPlayer.cards[0])
						{
							out(objectPlayer);
						}
						else if(currentPlayer.cards[0] < objectPlayer.cards[0])
						{
							out(currentPlayer);
						}
					}
					// rule of 5
					else if(useCard == 5)
					{
						if(objectPlayer.cards[0] == 8)
						{
							out(objectPlayer);
						}
						else
						{
							discard(objectPlayer,objectPlayer.cards[0]);
							drawCard(objectPlayer);
						}
					}
					// rule of 6
					else if(useCard == 6)
					{
						msg.push({event:"swap", player1:currentPlayer.id, player2:objectPlayer.id});
						tmp = objectPlayer.cards[0];
						objectPlayer.cards[0] = currentPlayer.cards[0];
						currentPlayer.cards[0] = tmp;
					}
				}
			}
			//status = "CheckForRoundWinner";
			alive = players.filter(function(p){return (p.isOut == false);});
			if( alive.length == 1 || deck.length == 0)
			{
				var roundWinner;
				if(alive.length == 1)
				{
					roundWinner = alive[0];
				}
				else
				{
					var winners = [];
					for(i in alive)
					{
						if(winners.length == 0 || alive[i].cards[0] > winners[0].cards[0])
						{
							winners = [alive[i]];
						}
						else if(alive[i].cards[0] == winners[0].cards[0])
						{
							winners.push(alive[i]);
						}
					}
					var backtrace = 0;
					while(winners.length > 1)
					{
						backtrace ++;
						var max = 0;
						for(i in winners)
						{
							lastdiscard = winners[i].discards[winners[i].discards.length - backtrace];
							if(lastdiscard != undefined && lastdiscard > max);
								max = lastdiscard;
						}
						winners = winners.filter(function(w){return (w.discards[w.discards.length - backtrace] == max)});
					}
					roundWinner = winners[0];
				}
				if(roundWinner)
					winLove(roundWinner);
				// if (roundWinner.cards[0] == 8) winLove double ?
				
				// Check For Game Winner
				winGamePoint = 3; // OR OTHER STANDARDS
				winner = players.filter(function(p){return p.loves >= winGamePoint});
				if(winner.length == 0)
				{
					status = "RoundStart";
				}
				else
				{
					status = "End";
					if(winner.length == 1)
						msg.push({event: "End",winner:winner[0].id});
					else
						msg.push({event: "End",winner:winner.map(function(p){return p.id})});
				}
			}
			else
			{
				currentPlayer = nextPlayerInTurn();
				status = "TurnStart";
			}
			setTimeout(run,1);
			return;
		}
		else if(status == "End")
		{
			sendMsg();
			return;
		}
	}

	var sendMsg = function(ctrl)
	{
		if(!ctrl)
		{
			if(GameCtrl.ctrls)
				for(i in GameCtrl.ctrls)
				{
					sendMsg(GameCtrl.ctrls[i]);
				}
			msg = [];
		}
		else
		{
			var adjustmsg = JSON.parse(JSON.stringify(msg)); // duplicate msg
			for(i in adjustmsg)
			{
				switch(adjustmsg[i].event)
				{
				case "cover":
					if(ctrl.role != "admin" && ctrl.role != "judge")
					{
						adjustmsg[i].value = 0;
					}
				break;
				case "draw":
					if(!(ctrl.role == "player" && ctrl.playerID == adjustmsg[i].player) && ctrl.role != "admin")
					{
						adjustmsg[i].value = 0;
					}
				break;
				case "discard":
				break;
				case "noprotect":
				break;
				case "protect":
				break;
				case "out":
				break;
				case "winLove":
				break;
				case "peek":
					if( !(ctrl.role == "player" && 
							(ctrl.playerID == adjustmsg[i].peeker || ctrl.playerID == adjustmsg[i].peekee))
						&& ctrl.role != "admin")
					{
						adjustmsg[i].value = 0;
					}
				break;
				case "compare":
					if( !(ctrl.role == "player" && 
							(ctrl.playerID == adjustmsg[i].player1 || ctrl.playerID == adjustmsg[i].player2))
						&& ctrl.role != "admin")
					{
						adjustmsg[i].value1 = 0;
						adjustmsg[i].value2 = 0;
					}
				break;
				case "swap":
				break;

				case "RoundStart":
				break;
				case "TurnStart":
				break;
				case "End":
				break;

				case "error":
					if( !(ctrl.role == "player" && ctrl.playerID == currentPlayer.id) 
						&& ctrl.role != "admin")
						adjustmsg.splice(i,1);
				break;
				default:
					console.log("出現未處理的 msg event: " + JSON.stringify(adjustmsg[i]));
				}
			}
			if(adjustmsg.length != 0)
				ctrl.showmsg(adjustmsg);
		}
	}
	

	
	function GameCtrl(user, role, ID)
	{
		if(role == "player" && (ID == undefined || ID < 0 || ID > 3))
			throw new Error("必須指定ctrl代表的player ID");
		if(GameCtrl.idToCtrl(ID) != undefined)
			throw new Error("目前每個Player只能有一個Ctrl");
		
		this.name = "Player " + ID;
		this.user = undefined;
		if(user)
		{
			this.name = user.name;
			this.user = user;			
		}
		var thisrole = role;
		var thisID = ID;
		Object.defineProperty(this, "role", {get: function(){return thisrole}});
		Object.defineProperty(this, "playerID", {get: function(){return thisID}});
		this.lastGameStates;
		this.lastmsgs = [];
		
		
		this.update = function()
		{
			return this.lastGameStates = 
			{
				myID: thisID,
				currentPlayerID: (currentPlayer ? currentPlayer.id: undefined),
				userName: GameCtrl.getPlayerNames(),
				players: function()
				{
					var ps = [];
					for(i in players)
					{
						ps[i] = {};
						ps[i].id = players[i].id;
						ps[i].isProtected = players[i].isProtected;
						ps[i].isOut = players[i].isOut;
						ps[i].loves = players[i].loves;
						ps[i].discards = players[i].discards.concat([]);
						if(ps[i].id == thisID  || thisrole == "admin")
							ps[i].cards = players[i].cards.concat([]);
						else
							ps[i].cards = new Array(players[i].cards.length).fill(0);
					}
					return ps;
				}(),
				deck: (thisrole == "admin" ? deck.concat([]) : new Array(deck.length).fill(0)),
				covered: (thisrole == "admin" ? covered.concat([]) : new Array(covered.length).fill(0)),
				winner: (winner ? (winner.length==1 ? winner[0].id : winner.map(function(p){return p.id})): undefined),
				status: status,
			}
		}
		this.showmsg = function(newmsg)
		{
			this.lastmsgs = this.lastmsgs.concat(newmsg);
			if(this.user)
				this.user.notice(newmsg);
		}
		this.getPlayerNames = GameCtrl.getPlayerNames;
		
		this.doDiscard = function(response)
		{
			if(thisID != currentPlayer.id)
				throw new Error("目前不是你的回合");
			if(status != "WaitForDiscard")
				throw new Error("目前不能進行動作");
			try
			{
				run(response);
			}
			catch(e)
			{
				console.error(e);
				throw e;
			}
		}
		
		this.leave = function()
		{
		}
		
		if(role == "admin")
		{
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
			}
		}
		
		GameCtrl.ctrls[GameCtrl.count ++] = this;
	}
	GameCtrl.ctrls = [];
	GameCtrl.count = 0;
	GameCtrl.idToCtrl = function(ID)
	{
		for(i in GameCtrl.ctrls)
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
	
	this.getCtrl = function(user, role, ID)
	{
		if(role == "player")
		{
			oldc = GameCtrl.idToCtrl(ID) ;
			if(oldc != undefined)
				return oldc;
		}
		return new GameCtrl(user, role, ID);
	}
	
	this.start = function()
	{
		if(status == "Initializing")
		{
			run();
		}
		else
		{
			throw new Error("遊戲已經開始了");
		}
	}
}

exports.Game = Game;
