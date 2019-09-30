function page_logout(){
	var f = document.logout;
	f.action = "/logout";
	f.method = "get";
	f.submit();
}