function padString(str, reqlen, fill)
{
	while(str.length < reqlen)
		str = fill + str;
	return str;
}