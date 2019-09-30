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

// Index page. Get for initial / Post for page after logined.
app.get('/', (req, res)=>{
	let sess = req.session;
	res.render('index', {user:sess.uid});
});

// Login set
app.get('/login', (req, res)=>{
	res.render('login/login_main', {title:'한끼함께 LOGIN'});
});
app.post('/login', (req, res)=>{
	let sess = req.session;
	sess.uid = req.body.userid;
	res.redirect('/');
});
app.get('/logout', (req, res)=>{
	let sess = req.session;
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
	let sess = req.session;
	res.render('login/signup', {user:sess.uid});
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
	let sess = req.session;
	conn.query(qstr, (err, results, fields)=>{
		if(err){
			console.log(err);
			res.status(500).send('Internal Server Error');
		}
		res.render('board/board_main', {query:results, user:sess.uid});
		//conn.release();
	});
	//conn.end();
});
app.get('/write', (req, res)=>{
	let sess = req.session;
	if(sess.uid == undefined)
		res.redirect('/login');
	else
		res.render('board/write',{user:sess.uid});
});
app.post('/post', (req, res)=>{
	let n = req.session;
	let s = req.body.subject;
	let str = req.body.contents;
	str = str.replace(/(?:\r\n|\r|\n)/g, '<br />');
	let c = str;
	let data = `
		insert into board (user_id, subject, contents, hit, regdate)
		values (?, ?, ?, 0, now())
	`;
	conn.query(data, [n,s,c], (err, results, fields)=>{
		if(err){
			console.log(err);
			res.status(500).send('Internal Server Error');
		}
		res.redirect('/board/'+results.insertId);
	});
});
app.get('/board/:num', (req, res)=>{
	let num = req.params.num;
	let vqstr = `
		select board_id, user_id, subject, contents, hit,
			date_format(regdate, '%Y.%m.%d. %H:%i') as date
		from board
		where board_id = ?
	`;
	let inc_hit = `
		update board
		set hit = hit + 1
		where board_id = ?
	`;

	conn.query(vqstr, [num],(err, results, fields)=>{
		if(err){
			console.log(err);
			res.status(500).send('Internal Server Error');
		}
		conn.query(inc_hit, [num], (err, results, fields)=>{
			if(err){
				console.log(err);
				res.status(500).send('Internal Server Error');
			}
		})
		res.render('board/view', {article:results[0]});
		//conn.release();
	});
});

app.listen(3000, ()=>{
	console.log('3000 port opened successfully!');
});