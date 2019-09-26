const express = require('express');
const bp = require('body-parser');
const session = require('express-session');
const app = express();

app.set('views', 'views');
app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(bp.urlencoded({extended: false}));
app.use(session({
	secret: 'hghgprojeCT',
	resave: false,
	saveUninitialized: true
}));

// Index page. Get for initial / Post for page after logined.
app.get('/', (req, res)=>{
	var sess = req.session;
	res.render('index', {user:sess.uid});
});

// Login set
app.get('/login', (req, res)=>{
	res.render('login/login_main', {title:'한끼함께 LOGIN'});
});
app.post('/login', (req, res)=>{
	var sess = req.session;
	sess.uid = req.body.userid;
	res.redirect('/');
});
app.get('/logout', (req, res)=>{
	var sess = req.session;
	if(sess.uid){
		req.session.destroy((err)=>{
			if(err)
				console.log(err);
			else
				res.redirect('/');
		});
	}
	else
		res.redirect('/');
});

// Board set
app.get('/board', (req, res)=>{
	var sess = req.session;
	res.render('community/board', {user:sess.uid});
});

app.listen(3000, ()=>{
	console.log('3000 port opened successfully!');
});