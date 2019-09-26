function page_logout(){
	var f = document.logout;
	f.userid.value = "#none";
	f.action = "/logout";
	f.method = "get";
	f.submit();
}