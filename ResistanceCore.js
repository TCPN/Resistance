function Game(inputPlayerList)
{
	var playersToJoin = inputPlayerList.filter(function(i){return (i != "Admin" && i != "Judge" && i != "Spectator");});
	if(!inputPlayerList || inputPlayerList.constructor != Array || inputPlayerList.length < 5 || inputPlayerList.length > 10)
		throw new Error("遊戲人數必須在5~10人");
				
	var players = undefined;				// string[]
	var roles = undefined;					// string[]
	var chairman = undefined;				// int
	var currentMission = undefined;			// int
	var missionRequirement = undefined;
	var missionResult = undefined;


	var proposeCount = undefined;
	var proposed = undefined;
	var votes = undefined;
	var disruption = undefined;
	var fightResult = undefined;
	var winner = undefined;

	var status = "NotSetUpYet";
	/* STATUS
	 * "NotSetUpYet"
	 * "ReadyToStart"
	 * "WaitForProposing"
	 * "WaitForVoting"
	 * "WaitForExecuting"
	 * "Ended"
	 */
	
	var gameHistory = undefined;
	var lastVotesResult = undefined;
	var lastExecutionResult = undefined;
	var resultNeedDisplay = undefined;


	var RedNumberByRule = function(playerNumber)
	{
		switch(playerNumber)
		{
			case 5:
			case 6:
				return 2;
			case 7:
			case 8:
			case 9:
				return 3;
			case 10:
				return 4;
			default:
				throw new Error("遊戲人數必須在5~10人");
				break;
		}
	}

	var RolesByRule = function(playerNumber)
	{
		redN = RedNumberByRule(playerNumber);
		list = [];
		for(i = 0; i < playerNumber; i++)
		{
			if(i < redN)
				list.push("red");
			else
				list.push("blue");
		}
		return list;
	}

	var missionRequirementByRule = function(playerNumber)
	{
		switch(playerNumber)
		{
			case 5:
				return [2,3,2,3,3];
			case 6:
				return [2,3,4,3,4];
			case 7:
				return [2,3,3,4,4];
			case 8:
			case 9:
			case 10:
				return [3,4,4,5,5];
			default:
				throw new Error("遊戲人數必須在5~10人");
				break;
		}
	}

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

	
	var start = function()
	{
		missionResult = new Array(5);
		prepareForMission();
	}

	
	// start setting up game
	missionRequirement = missionRequirementByRule( playersToJoin.length );
	roles = shuffle( RolesByRule( playersToJoin.length ) );
	players = shuffle( playersToJoin );
	status = "ReadyToStart";
	
	gameHistory = new GameHistory(players, missionRequirement, RedNumberByRule(players.length));
	
	function GameHistory(players_i, missionRequirement_i, redNumber_i)
	{
		this.players = players_i;
		this.missionRequirements = missionRequirement_i;
		this.redNumber = redNumber_i;
		this.missions = new Array(5);
		//this.gameResult = undefined;
		this.gameResult = undefined;
	}
	function MissionHistory(/*requirement*/)
	{
		//this.missionRequirement = requirement;
		this.proposals = [];
		this.acceptedProposal = undefined;
		this.executionResult = undefined;
		//this.missionResult = undefined;
		this.missionResult = undefined;
	}
	function ProposalRecord(chairman_i){
		this.chairman = chairman_i;
		this.proposal = undefined;
		this.votes = undefined;
		this.voteResult = undefined;
	}
	
	
	var prepareForMission = function()
	{
		nextMission();
		proposeCount = 0;
		
		gameHistory.missions[currentMission] = new MissionHistory();
		
		startPropose();
	}

	var startPropose = function()
	{
		nextChairman();
		proposeCount ++;
		status = "WaitForProposing";
		proposed = [];
		
		gameHistory.missions[currentMission].proposals.push( new ProposalRecord( getPlayerNameByIndex(chairman) ) );
		
		informAll();
	}

	var getPlayerIndexByID = function(playerID)
	{
		return players.indexOf(playerID);
	}

	
	var propose = function(playerIndex)
	{
		if(proposed.length < missionRequirement[currentMission])
		{
			if(proposed.indexOf(playerIndex) < 0)
			{
				proposed.push(playerIndex);
			}
			else
			{
				throw new Error("已經提名了");
			}
		}
		else
		{
			throw new Error("提名人數滿了");
		}
		informAll();
	}

	var cancelPropose = function(playerIndex)
	{
		i = proposed.indexOf(playerIndex);
		if(i < 0)
			throw new Error("並不在提名當中");
		proposed = proposed.slice(0,i).concat(proposed.slice(i+1));
		informAll();
	}
	
	var finishPropose = function()
	{
		if(proposed.length == missionRequirement[currentMission])
		{
		
			gameHistory.missions[currentMission].proposals[proposeCount-1].proposal = proposed.map(getPlayerNameByIndex);
			resultNeedDisplay = "propose";
			
			startVote();
		}
		else
			throw new Error("請選擇恰好"+missionRequirement[currentMission]+"個人");
	}

	/*
	var getProposedNames = function()
	{
		var a = [];
		for(var i = 0; i < proposed.length; i ++)
			a.push(players[proposed[i]]);
		return a;
	}
	*/
	var getPlayerNameByIndex = function(index){return players[index];}
	var votesToString = function(isAgree){return (isAgree ? "O" : "X" );}
	var executionToString = function(disrupted){return (disrupted ? "Disrupted" : "Completed");}
	
	var getVoteWithName = function()
	{
		var a = {};
		for(var i = 0; i < votes.length; i ++)
			a[players[i]] = votesToString(votes[i]);
		return a;
	}
	
	
	var startVote = function()
	{
		status = "WaitForVoting";
		votes = new Array(players.length);
		informAll();
	}


	var vote = function(playerIndex, voted)
	{
		if(status != "WaitForVoting")
			return;
		votes[playerIndex] = !!voted;
		inform(players[playerIndex]);
		
		if(isVoteComplete())
		{
			finishVote();
		}
	}

	var isVoteComplete = function()
	{
		for(i = 0; i < votes.length; i++)
		{
			if(votes[i] == undefined)
				return false;
		}
		return true;
	}

	var voteMostAgree = function()
	{
		agreeCount = 0;
		for(i in votes)
		{
			if(votes[i])
				agreeCount ++;
		}
		if(agreeCount > (votes.length / 2))
			return true;
		else
			return false;
	}

	
	var startExecute = function()
	{
	
		gameHistory.missions[currentMission].acceptedProposal = proposed.map(getPlayerNameByIndex);
		
		status = "WaitForExecuting";
		disruption = new Array(missionRequirement[currentMission]);
		informAll();
	}

	var execute = function(playerIndex, doDisrupt)
	{
		if(status != "WaitForExecuting")
			return;
		proposedIndex = proposed.indexOf(playerIndex);
		if(proposedIndex >= 0)
		{
			if(roles[playerIndex] == "red")
				disruption[proposedIndex] = !!doDisrupt;
			else
			{
				disruption[proposedIndex] = false;
				if(!!doDisrupt)
				{
					throw new Error("好人不能破壞任務！");
				}
			}
			
			if(isExecuteComplete())
			{
				finishExecute();
			}
		}
		else
		{
			throw new Error("你並沒有被票選通過");
		}
		inform(players[playerIndex]);
	}

	var isExecuteComplete = function()
	{
		for(i = 0; i < disruption.length; i++)
		{
			if(disruption[i] == undefined)
				return false;
		}
		return true;
	}

	var isMissionDisrupted = function()
	{
		disruptCount = 0;
		for(i in disruption)
		{
			if(disruption[i])
				disruptCount ++;
		}
		if(players.length >= 7 && currentMission == 3)
		{
			if(disruptCount >= 2)
				return true;
			else
				return false;
		}
		else
		{
			if(disruptCount >= 1)
				return true;
			else
				return false;
		}
	}

	var finishExecute = function()
	{
		if(status != "WaitForExecuting")
			return;
		
		gameHistory.missions[currentMission].executionResult = disruption.map(executionToString).sort();
		lastExecutionResult = gameHistory.missions[currentMission].executionResult;
		resultNeedDisplay = "execute";
			
		missionFinishWithResult(!isMissionDisrupted());
		disruption = undefined;
	}

	var nextChairman = function()
	{
		if(chairman == undefined)
		{
			chairman = 0;
		}
		else
		{
			chairman = (chairman + 1) % players.length;
		}
	}

	var finishVote = function()
	{
		if(status != "WaitForVoting")
			return;
		
		lastVotesResult = votes.concat([]);
		gameHistory.missions[currentMission].proposals[proposeCount-1].votes = lastVotesResult;
		gameHistory.missions[currentMission].proposals[proposeCount-1].voteResult = voteMostAgree() ? "Accepted" : "Rejected";
		resultNeedDisplay = "vote";
			
		if(voteMostAgree())
		{
			startExecute();
		}
		else
		{
			if(proposeCount < 5)
			{
				startPropose();
			}
			else
			{
				missionFinishWithResult(false); // mission go fail
			}
		}
		votes = undefined;
	}

	var nextMission = function()
	{
		if(currentMission == undefined)
		{
			currentMission = 0;
		}
		else
		{
			currentMission = (currentMission + 1);
		}
	}

	var missionFinishWithResult = function(isSuccess)
	{
		if(!isSuccess) // should be a Boolean
		{
			missionResult[currentMission] = false;
		}
		else
		{
			missionResult[currentMission] = true;
		}
		
		gameHistory.missions[currentMission].missionResult = (missionResult[currentMission] ? "blue" : "red" );
		
		updateFightResult();
		if(fightShouldContinue())
		{
			prepareForMission();
		}
		else
		{
			fightFinish();
		}
	}

	var updateFightResult = function()
	{
		blueWinCount = 0;
		redWinCount = 0;
		for(i = 0; i < 5; i ++)
		{
			if(missionResult[i] != undefined)
			{
				if(missionResult[i] == true)
					blueWinCount ++;
				else
					redWinCount ++;
			}
		}
		if(blueWinCount >= 3)
		{
			fightResult = "blue";
		}
		if(redWinCount >= 3)
		{
			fightResult = "red";
		}
		/*
		else
		{
			return undefined;
		}
		*/
	}

	var fightShouldContinue = function()
	{
		if(fightResult == undefined)
			return true;
		else
			return false;
	}

	var fightFinish = function()
	{
		if(fightResult == "blue")
		{
			winner = "blue";
		}
		else
		{
			winner = "red";
		}
		
		gameHistory.gameResult = winner+" won";
		
		status = "Ended";
		informAll();
	}

	
	
	var getGameStatesString = function(viewPoint)
	{
		return {
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
	}

	var getUnkownArray = function(number)
	{
		var hidden = [];
		for(i = 0; i < number; i ++)
			hidden.push("unknown");
		return hidden;
	}

	var viewStatus = function(viewPoint){
		return status;
	}
	var viewPlayers = function(viewPoint){
		return players;
	}
	var viewRoles = function(viewPoint){
		if(roles == undefined)
			return undefined;
			
		if(viewPoint == "Admin" || viewPoint == "Judge" || status == "Ended")
			return roles.concat([]);
		if(viewPoint == "Spectator")
			return getUnkownArray(roles.length);
		var idx = getPlayerIndexByID(viewPoint);
		if(roles[idx] == "red")
			return roles.concat([]);
		else
		{
			var hiddenRoles = getUnkownArray(roles.length);
			hiddenRoles[idx] = roles[idx];
			return hiddenRoles;
		}
	}
	var viewChairman = function(viewPoint){
		return chairman;
	}
	var viewCurrentMission = function(viewPoint){
		return currentMission;
	}
	var viewMissionRequirement = function(viewPoint){
		return missionRequirement;
	}
	var viewMissionResult = function(viewPoint){
		return missionResult;
	}
	var viewProposeCount = function(viewPoint){
		return proposeCount;
	}
	var viewProposed = function(viewPoint){
		return proposed;
	}
	var viewVotes = function(viewPoint){
		if(votes == undefined)
			return undefined;
		if(viewPoint == "Admin")
			return votes;
		else
		{
			var a = new Array(votes.length);
			return a;
		}
	}
	var viewDisruption = function(viewPoint){
		if(disruption == undefined)
			return undefined;
		if(viewPoint == "Admin")
			return disruption;
		else
		{
			var a = new Array(disruption.length);
			return a;
		}
	}
	var viewFightResult = function(viewPoint){
		return fightResult;
	}
	var viewWinner = function(viewPoint){
		return winner;
	}
	
	var controlers = [];
	var inform = function(user)
	{
		controlers.forEach(
			function(c){
				if(c.getUser() == user)
					c.inform();
			}
		);
	}
	var informAll = function()
	{
		controlers.forEach(
			function(c){
				try{c.inform();}
				catch(e){
					console.log(e.message);
					console.log(e.stack);
				}
			});
		//for(i in controlers){
		//	controlers[i].inform();
		//}
	}
	this.getControler = function(user, informFunc)
	{
		if(informFunc == undefined)
			throw new Error("Need a callback function to inform");
		if(user == undefined)
			user = "Spectator";
		return new GameControler(user, informFunc);
	}

	
	function GameControler(user, informFunc)
	{
		var controlerUser = user;
		var useridx = getPlayerIndexByID(user);
		if( useridx < 0 && user != "Admin" && user != "Judge" && user != "Spectator" )
			throw new Error("Invalid User");
		
		controlers.push(this);
		this.inform = informFunc;
		
		this.setInformFunc = function(newInformFunc){this.inform = newInformFunc;}
		this.getUser = function(){return controlerUser;}
		this.isPlaying = function(){return (useridx >= 0);}
		this.isChairmanNow = function(){return (this.view().chairman == useridx);}
		this.isBlue = function(){return (roles[useridx] == "blue");}
		this.isDispatched = function(){return (viewStatus(controlerUser) == "WaitForExecuting" && proposed.indexOf(useridx) >= 0);}
		this.getUserStatus = function()
		{
			var sta = viewStatus(controlerUser);
			if(sta == "ReadyToStart")
			{
				return "WaitForStart";
			}
			else if(sta == "WaitForProposing")
			{
				if(useridx == chairman)
					return "Proposing";
				else
					return "WaitForProposingFinish";
			}
			else if(sta == "WaitForVoting")
			{
				if(useridx >= 0 && votes[useridx] == undefined)
					return "Voting";
				else
					return "WaitForVotingFinish";
			}
			else if(sta == "WaitForExecuting")
			{
				if(useridx >= 0 && proposed.indexOf(useridx) >= 0 && disruption[proposed.indexOf(useridx)] == undefined)
					return "Executing";
				else
					return "WaitForExecutingFinish";
			}
			else if(sta == "Ended")
			{
				if(useridx >= 0)
				{
					if(roles[useridx] == winner)
						return "Win";
					else
						return "Lose";
				}
				else
					return "End";
			}
		}
		
		this.getGameHistory = function()
		{
			return JSON.parse(JSON.stringify(gameHistory));
		}
		this.shouldDisplayResult = function(){ return resultNeedDisplay; }
		this.getLastVoteResult = function(){ return lastVotesResult; }
		this.getLastExecuteResult = function(){ return lastExecutionResult; }
		this.getLastProposal = function(){ return proposed.map(getPlayerNameByIndex); }
		
		//this.setUpGame = setUpGame;
		this.view = function()
		{
			lastView = getGameStatesString( controlerUser );
			return lastView;
		}
		this.lastView = undefined;
		if( useridx < 0 && user != "Admin")
			return;
		
		this.proposeToggle = function(proposal)
		{
			if(useridx != chairman)
				throw new Error("你不是領袖");
			var proposalIndex = getPlayerIndexByID( proposal );
			if(proposed.indexOf( proposalIndex ) < 0)
				propose(proposalIndex);
			else
				cancelPropose(proposalIndex);
			//inform();
		}
		this.propose = function(proposal)
		{
			if(useridx != chairman)
				throw new Error("你不是領袖");
			propose( getPlayerIndexByID( proposal ) );
			//inform();
		}
		this.cancelPropose = function(proposal)
		{
			if(useridx != chairman)
				throw new Error("你不是領袖");
			cancelPropose( getPlayerIndexByID( proposal ) );
			//inform();
		}
		this.proposeDone = function()
		{
			if(useridx != chairman)
				throw new Error("你不是領袖");
			finishPropose();
			//inform();
		}
		
		this.vote = function(ticket)
		{
			vote( useridx, ticket );
			//inform();
		}
		this.execute = function(doDisrupt)
		{
			execute( useridx, doDisrupt );
			//inform();
		}
		
		this.leave = function()
		{
		}
	}
	
	start();
}

exports.Game = Game;
