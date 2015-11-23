
function Robot(room, gameCtrlor)
{
	this.room = room;
	this.gamename = gameCtrlor.getUser();
	var players = gameCtrlor.view().players;
	var MR = gameCtrlor.view().missionRequirement;
	
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
	var IsProposing = false;
	var gameInformHandler = function()
	{	
		switch(gameCtrlor.getUserStatus())
		{
			case "Proposing":
				if(IsProposing)
				{;}
				else
				{
					IsProposing = true;
					console.log("Proposing");
					console.log("Propose:"+gameCtrlor.getUser());
					gameCtrlor.propose(gameCtrlor.getUser());
						console.log("Propose:"+gameCtrlor.getUser()+" done");
					var fp = players.filter(function(p){return p!=gameCtrlor.getUser()});
					console.log(fp);
					var pp = shuffle(fp);
					console.log(pp);
					for(var i = 0; i < MR[gameCtrlor.view().currentMission] - 1; i ++)
					{
						console.log(i);
						console.log(pp);
						console.log(pp[i]);
						console.log("Propose:"+pp[i]);
						try{gameCtrlor.propose(pp[i]);}catch(e){}
						console.log("Propose:"+pp[i]+" done");
					}
					console.log("Propose done?");
					try{gameCtrlor.proposeDone();}catch(e){}
					console.log("Propose done");
					IsProposing = false;
				}
				break;
			case "Voting":
				console.log("Voting");
				gameCtrlor.vote(true);
				console.log(true);
				break;
			case "Executing":
				console.log("Executing");
				gameCtrlor.execute(false);
				console.log(false);
				break;
			
			case "WaitForStart":
			case "WaitForProposingFinish":
			case "WaitForVotingFinish":
			case "WaitForExecutingFinish":
			case "Win":
			case "Lose":
			case "End":
			default:
				console.log("wait");
				break;
		}
	};
	gameCtrlor.setInformFunc(gameInformHandler);
	gameInformHandler();
}

exports.Robot = Robot;