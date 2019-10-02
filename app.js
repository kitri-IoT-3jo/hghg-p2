const express = require('express');
const bp = require('body-parser');
const session = require('express-session');
const app = express();
const mysql = require('mysql');
const conn = mysql.createConnection({
    host: '183.101.196.145',
    port: 3306,
    user: 'hghg',
    password: 'hghg',
    database: 'hghgp'
});

app.set('views', 'views');
app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(bp.urlencoded({ extended: false }));
app.use(session({
    secret: 'hghgprojeCT',
    resave: false,
    saveUninitialized: true
}));
conn.connect((err) => {
    if (err) {
        console.log(err);
        throw err;
    } else
        console.log('DB connected!');
});

app.listen(3000, () => {
    console.log('3000 port opened successfully!');
});

// Index page. Get for initial / Post for page after logined.
app.get('/', (req, res) => {
    let sess = req.session;
    res.render('index', { user: sess.nick });
});
app.post('/', (req, res) => {
    let new_id = `
    	insert into hghg_user (user_id, user_pw, user_name, user_nickname, email_id, email_domain)
		values (?, ?, ?, ?, ?, ?);
    `;
    let user_id = req.body.userid;
    let user_pw = req.body.userpwd;
    let user_name = req.body.username;
    let user_nickname = req.body.nickname;
    let email_id = req.body.emailid;
    let email_domain = req.body.emaildomain;
    let data = [user_id, user_pw, user_name, user_nickname, email_id, email_domain];
    console.log(data);
    conn.query(new_id, data, (err, results, fields)=>{
		if(err){
			console.log(err);
			res.status(500).send('Internal Server Error');
		}
		res.redirect('/');
	});
});

// Login set
app.get('/login', (req, res) => {
    res.render('login/login_main', { isalert: false });
});

app.post('/login', (req, res)=>{
	let uid = req.body.userid;
	let q = `
		select count(user_id) as cnt, user_pw, user_nickname
		from hghg_user
		where user_id = ?
	`;
	conn.query(q, [uid],(err, results, fields)=>{
		if(err){
			console.log(err);
			res.status(500).send('Internal Server Error');
		}
		let pw = req.body.userpw;

		if(results[0].cnt == 1 && pw == results[0].user_pw){
			let sess = req.session;
			sess.uid = uid;
			sess.nick = results[0].user_nickname;
			res.redirect('/');
		}
		else
			res.render('login/login_main', {isalert:true});
	});
});

app.get('/logout', (req, res) => {
    let sess = req.session;
    if (sess.uid) {
        req.session.destroy((err) => {
            if (err)
                console.log(err);
            else
                res.redirect('/');
        });
    } else
        res.redirect('/');
});
app.get('/signup', (req, res) => {
	let sess = req.session;
    let get_id = `
    	select user_id
    	from hghg_user
    `;
    let ids = new Array();
    conn.query(get_id, (err, results, fields)=>{
    	if(err){
    		console.log(err);
    		throw err;
    	}
    	for(var i = 0; i < results.length; i++)
    		ids.push(results[i].user_id);

    	res.render('login/signup', { ids: ids, user: sess.nick });
    });
});
app.get('/find', (req, res) => {
    res.render('login/find.ejs');
});

// Board set
// app.get('/board', (req, res)=>{
// 	var sess = req.session;
// 	res.render('board/board_main', {user:sess.uid});
// });
app.get('/board', (req, res) => {
    let qstr = `
		select board_id, user_nickname, subject, contents, hit,
			if(date_format(now(), '%Y%m%d')=date_format(regdate, '%Y%m%d'),
			date_format(regdate, '%H:%i'),
			date_format(regdate, '%Y.%m.%d.')) as date
		from board b, hghg_user u
		where b.user_id = u.user_id
		order by board_id desc
	`;
	let sess = req.session;
	conn.query(qstr, (err, results, fields)=>{
		if(err){
			console.log(err);
			res.status(500).send('Internal Server Error');
		}
		res.render('board/board_main', {query:results, user:sess.nick});
		//conn.release();
	});
	//conn.end();
});
app.get('/board/write', (req, res)=>{
	let sess = req.session;
	if(sess.uid == undefined)
		res.redirect('/login');
	else
		res.render('board/write',{user:sess.nick});
});
app.post('/board/write', (req, res)=>{
	let n = req.session.uid;
	let s = req.body.subject;
	let str = req.body.contents;
	let c = str.replace(/(?:\r\n|\r|\n)/g, '<br/>');
	c = c.replace(/(\s)/g, '&nbsp;');
	
	let data = `
		insert into board (user_id, subject, contents, hit, regdate)
		values (?, ?, ?, 0, now())
	`;

    conn.query(data, [n, s, c], (err, results) => {
        if (err) {
            console.log(err);
            res.status(500).send('Internal Server Error');
        }
        res.redirect('/board/' + results.insertId);
    });
});
app.get('/board/:num', (req, res) => {
    let num = req.params.num;
    let sess = req.session;
    let vqstr = `
		select board_id, b.user_id as id, user_nickname, subject, contents, hit,
			date_format(regdate, '%Y.%m.%d. %H:%i') as date
		from board b, hghg_user u
		where b.user_id = u.user_id
		and board_id = ?
	`;
    let inc_hit = `
		update board
		set hit = hit + 1
		where board_id = ?
	`;

    conn.query(inc_hit, [num], (err, results, fields) => {
        if (err) {
            console.log(err);
            res.status(500).send('Internal Server Error');
        }
        conn.query(vqstr, [num], (err, result, field) => {
            if (err) {
                console.log(err);
                res.status(500).send('Internal Server Error');
            }
            res.render('board/view', { article: result[0], user: sess.nick, id: sess.uid });
        });
    });
});

app.get('/board/:num/delete', (req, res) => {
    let num = req.params.num;
    let board_del = `
		delete from board
		where board_id = ?
	`;

    conn.query(board_del, [num], (err, results, fields) => {
        if (err) {
            console.log(err);
            res.status(500).send('Internal Server Error!');
        }
        res.redirect('/board');
    });
});

app.get('/modify/:num', (req, res) => {
    let num = req.params.num;
    let sess = req.session;
    let ex_contents = `
		select board_id, user_id, subject, contents, hit,
		date_format(regdate, '%Y.%m.%d. %H:%i') as date
		from board
		where board_id = ?
	`;
	conn.query(ex_contents, [num], (err, results, fields) => {
		if(err)
		{
			console.log(err);
			res.status(500).send('Internal Server Error!');
		}
		res.render('board/modify', {article: results[0], user:sess.nick});
	});
});

app.post('/modify/:num', (req, res) => {
    let values = [req.body.subject, req.body.contents, req.params.num];
    let board_update = `
		update board
		set subject = ?, contents = ?
		where board_id = ?`;

    conn.query(board_update, values, (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send('Internal Server Error!');
        }
        //res.render('board/write');
        res.redirect('/board/' + req.params.num);
    });
});