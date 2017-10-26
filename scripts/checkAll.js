function checkAll(t)
{
	for (i = 0; i < t.length; i++)
		t[i].checked = true ;
}

function uncheckAll(f)
{
	for (i = 0; i < f.length; i++)
		f[i].checked = false ;
}

function songchu(s)
{
	var i =document.getElementById("lb");
	var string = '';
	for(a=0;a<s.length;a++)
	{
        if (s[a].checked)
		{
			string = s[a].value + string + '<br>';
		}	
	}
	return string;
}