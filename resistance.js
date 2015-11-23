function Authentication()
{
	var accountTable = {};
	this.login = function(account, password)
	{
		if(accountTable.hasOwnProperty(account) && (accountTable[account].password == password) && accountTable[account].login == false)
		{
			accountTable[account].login = true;
			return accountTable[account].data;
		}
		else
			return false
	}
	this.register = function(account, password, nickname)
	{
		if(account.length < 12)
		if(accountTable.hasOwnProperty(account))
		{
			return false;
		}
		else
		{
			accountTable[account] = {password: password, login: false, data: {nickname: nickname, image: undefined}};
			return true;
		}
	}
}
auth = new Authentication();

function UserController(user)
{
	this.user = user;
	user.controller = this;
}

function User(name_in)
{
	var name = name_in;
	var accountData = null;
	var account = null;
	this.login = function(account_in, password)
	{
		ad = auth.login(account_in, password);
		if(ad)
		{
			accountData = ad;
			account = account_in;
			name = ad.nickname;
		}
		else
		{
			alert("login failed!");
			return false;
		}
	}
	this.logout = function()
	{
		
	}