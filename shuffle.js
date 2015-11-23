

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


function removeItem(array, item)
{
	if(array.constructor != Array)
		throw new Error("只能對array進行removeItem");
	
	var i = this.indexOf(item);
	if(i < 0)
		throw new Error("沒有這個項目");
	else
		return this.splice(i,1);
}

function dupObjS(obj)
{
	return JSON.parse(JSON.stringify(obj));
}

exports.shuffle = shuffle;