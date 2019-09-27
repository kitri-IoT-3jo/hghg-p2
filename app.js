const express = require('express');
const bp = require('body-parser');
const session = require('express-session');
const app = express();
const mysql = require('mysql');
const conn = mysql.createConnection({
	host 	: '183.101.196.145',
	port 	: 3306,
	user 	: 'hghg',
	password: 'hghg',
	database: 'hghgp'
});

app.set('views', 'views');
app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(bp.urlencoded({extended: false}));
app.use(session({
	secret: 'hghgprojeCT',
	resave: false,
	saveUninitialized: true
}));
conn.connect((err)=>{
	if(err){
		console.log(err);
		throw err;
	}
	else
		console.log('DB connected!');
});

app.listen(3000, ()=>{
	console.log('3000 port opened successfully!');
});

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
app.get('/signup', (req, res)=>{
	var sess = req.session;
	res.render('login/signup', {user:sess.uid});
});

app.get('/login/signup', (req, res)=>{
	res.render('login/signup');
});
app.get('/login/find', (req, res)=>{
	res.render('login/find.ejs');
});

// Board set
// app.get('/board', (req, res)=>{
// 	var sess = req.session;
// 	res.render('board/board_main', {user:sess.uid});
// });
app.get('/board', (req, res)=>{
	let qstr = `
		select BOARD_id, user_id, subject, contents, hit,
			if(date_format(now(), '%Y%m%d')=date_format(regdate, '%Y%m%d'),
			date_format(regdate, '%H:%i'),
			date_format(regdate, '%Y.%m.%d.')) as date
		from board
		order by BOARD_id desc
	`;
	conn.query(qstr, (err, results, fields)=>{
		if(err){
			console.log(err);
			res.status(500).send('Internal Server Error');
		}
		res.render('board/board_main', {query:results});
		//conn.release();
	});
	//conn.end();
});
