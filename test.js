
readline = require('readline');
fs = require('fs');

var cmd = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
var data;
var filename = process.argv[2];
function readAndEval(filename)
{
	cmd.write("###open " + filename + ":\n");
	var data = fs.readFileSync(filename);
	var firsttime = true;
	cmd.write(data + "\n");
	try{
		eval.call(this,data.toString());
	}catch(e){
		//console.log(e.message);
		console.log(e.stack);
	}
	cmd.setPrompt(">");
	cmd.prompt();
	var buff = "";
	cmd.on('line', function(line)
	{
		if( line[line.length-1] == '\\')
		{
			buff += line.substr(0,line.length-1);
			cmd.setPrompt("\\ ");
			cmd.prompt();
		}
		else
		{
			buff += line;
			try{
				console.log(eval.call(this,buff));
			}catch(e){
				//console.log(e.message);
				console.log(e.stack);
			}
			buff = "";
			cmd.setPrompt("> ");
			cmd.prompt();
		}
	});
};
if(!filename)
	cmd.question("please input the file name to read.\n(or add as an argument like node test <filename>)\n", 
		readAndEval);
else
	readAndEval(filename);