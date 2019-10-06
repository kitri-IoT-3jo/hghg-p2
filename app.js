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
	let sess = req.session;
	res.render('index', {user:sess.nick});
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
    let email_domain = req.body.emailself;
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
app.get('/login', (req, res)=>{
	res.render('login/login_main', {isalert: false});
});
app.post('/login', (req, res)=>{
	let uid = req.body.userid;
	let q = `
		select user_pw, user_nickname
		from hghg_user
		where user_id = ?
	`;
	conn.query(q, [uid],(err, results, fields)=>{
		if(err){
			console.log(err);
			res.status(500).send('Internal Server Error');
		}
		let pw = req.body.userpw;
		if(pw == results[0].user_pw){
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
app.get('/find', (req, res)=>{
	res.render('login/find.ejs');
});

// Board set
app.get('/board', (req, res)=>{
	let sess = req.session;
	let page = req.query.page;
	let type = req.query.searchType;
	let text = req.query.searchText;
	if(page == undefined) page = 1;

	let value1 = new Array();
	let value2 = new Array();
	value1[0] = (page-1)*10;

	let get_binfo = `
		select board_id, nickname, subject, contents, hit,
			if(date_format(now(), '%Y%m%d')=date_format(regdate, '%Y%m%d'),
			date_format(regdate, '%H:%i'),
			date_format(regdate, '%Y.%m.%d.')) as date
		from (select @RNUM := @RNUM + 1 as rownum, t.*
		from (select * from board
	`;
	let get_pages = `
		select ceil(count(board_id)/10) as p
		from board
	`;
	if(text == undefined || text == ''){
		get_binfo += `
		order by board_id desc limit ?, 10) t, ( select @RNUM := 0 ) r) c
		`;
	} else{
		if(type == 'sub_con'){
			value1[2] = value1[0];
			value1[1] = '%'+text+'%';
			value1[0] = '%'+text+'%';
			value2[0] = '%'+text+'%';
			value2[1] = '%'+text+'%';
			
			get_binfo += `
			where subject like ?
			or contents like ?
			order by board_id desc limit ?, 10) t, ( select @RNUM := 0 ) r) c
			`;
			get_pages += ' where subject like ? or contents like ?';
		}
		else if(type == 'name'){
			value1[1] = value1[0];
			value1[0] = '%'+text+'%';
			value2[0] = '%'+text+'%';
			
			get_binfo += `
			where nickname like ?
			order by board_id desc limit ?, 10) t, ( select @RNUM := 0 ) r) c
			`;
			get_pages += ' where nickname like ?';
		}
	}
	conn.query(get_binfo, value1, (err, bresults, fields)=>{
		if(err){
			console.log(err);
			res.status(500).send('Internal Server Error');
		}
		conn.query(get_pages, value2, (err, presults, fields)=>{
			if(err){
				console.log(err);
				res.status(500).send('Internal Server Error');
			}
			res.render('board/board_main', {query:bresults, pages: presults[0].p, user:sess.nick, cpage:page, search:[type, text]});
		});
	});
});
// page num ë°›ê¸°
app.get('/board/write', (req, res)=>{
	let sess = req.session;
	if(sess.uid == undefined)
		res.redirect('/login');
	else
		res.render('board/write',{user:sess.nick});
});
app.post('/board/write', (req, res)=>{
	let sess = req.session;
	let i = sess.uid;
	let n = sess.nick;
	let s = req.body.subject;
	let str = req.body.contents;
	let c = str.replace(/(?:\r\n|\r|\n)/g, '<br/>');
	c = c.replace(/(\s)/g, '&nbsp;');

	let data = `
		insert into board (user_id, nickname, subject, contents, hit, regdate)
		values (?, ?, ?, ?, 0, now())
	`;

    conn.query(data, [i, n, s, c], (err, results) => {
        if (err) {
            console.log(err);
            res.status(500).send('Internal Server Error');
        }
        res.redirect('/board/' + results.insertId);
    });
});
app.get('/board/:num', (req, res)=>{
	let num = req.params.num;
	let sess = req.session;
	let vqstr = `
		select board_id, b.user_id as id, nickname, subject, contents, hit,
			date_format(regdate, '%Y.%m.%d. %H:%i') as date
		from board b, hghg_user h
		where b.user_id = h.user_id
		and board_id = ?
	`;
	let inc_hit = `
		update board
		set hit = hit + 1
		where board_id = ?
	`;
	let comments = `
		select comment_contents as comment, date_format(comment_time, '%Y.%m.%d. %H:%i') as date, user_nickname as nick
		from comments c, board b, hghg_user h
		where c.board_id = b.board_id
		and c.user_id = h.user_id
		and b.board_id = ?
	`;

	conn.query(inc_hit, [num],(err, results, fields)=>{
		if(err){
			console.log(err);
			res.status(500).send('Internal Server Error');
		}
		conn.query(vqstr, [num], (err, resultV, field)=>{
			if(err){
				console.log(err);
				res.status(500).send('Internal Server Error');
			}
			conn.query(comments, [num], (err, resultC, field)=>{
				if(err){
					console.log(err);
					res.status(500).send('Internal Server Error');
				}
				res.render('board/view', {article:resultV[0], comments:resultC, user:sess.nick, id:sess.uid});
			});
		});
	});
});
app.post('/board/:num', (req, res)=>{
	let num =req.params.num;
	let comment = req.body.cmt;
	let sess = req.session;
	let insert_cmt = `
		insert into comments (comment_contents, comment_time, board_id, user_id)
		values (?, now(), ?, ?);
	`;
	conn.query(insert_cmt, [comment, num, sess.uid], (err, results, fields)=>{
		if(err){
			console.log(err);
			throw err;
		}
		res.redirect('/board/'+num);
	});
});

app.get('/board/:num/delete', (req, res) => {
	let num = req.params.num;
	let board_del = `
		delete from board
		where board_id = ?
	`;

	conn.query(board_del, [num], (err, results, fields) => {
		if(err)
		{
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
		console.log(results[0]);
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
		if(err) {
			console.log(err);
			res.status(500).send('Internal Server Error!');
		}
		//res.render('board/write');
		res.redirect('/board/'+ req.params.num);
	});
});
app.get('/board_main/:page', (req, res)=>{
	let page = req.params.page;
	let qstr = `
		select board_id, user_nickname, subject, contents, hit,
			if(date_format(now(), '%Y%m%d')=date_format(regdate, '%Y%m%d'),
			date_format(regdate, '%H:%i'),
			date_format(regdate, '%Y.%m.%d.')) as date
		from board b, hghg_user u
		where b.user_id = u.user_id
		order by board_id desc
	`;
	let cnt = 10;
	let page_cnt = (page*cnt)-cnt;
	let page_group = page/10;
	let sess = req.session;
	conn.query(qstr, (err, results, fields)=>{
		if(err){
			console.log(err);
			res.status(500).send('Internal Server Error');
		}
		res.render('board/board_main', {query:results, user:sess.nick, page: page, cnt: 10, len: results.length-1, page_cnt: page_cnt, page_group: page_group});
		//conn.release();
	});
	//conn.end();
});

//서치서피서치

app.post('/board/search' , (req,res)=>{
	let ser = req.body.searchText;
	console.log('ser >>>>>>>>>>>>>>>>>>>>>>>> ' + ser);
	let sess = req.session;
	let board_search =`
		select board_id, user_nickname, subject, contents, hit,
			if(date_format(now(), '%Y%m%d')=date_format(regdate, '%Y%m%d'),
			date_format(regdate, '%H:%i'),
			date_format(regdate, '%Y.%m.%d.')) as date
		from board b, hghg_user u
		where b.user_id = u.user_id
		and subject like ?
		order by board_id desc
	`;
	ser = '%' + ser + '%';
	// ser = '%a%';

		conn.query(board_search, [ser] ,(err,results,fuleds)=>{
			if (err){
				console.log(err);
				res.status(500).send('검색에렁비니다');
			}
			let page = (results.length/10)+1;
			let cnt = 10;
			let page_cnt = (page*cnt)-cnt;
			let page_group = page/10;
			res.render('board/search' , { query : results, user:sess.nick , page: page, cnt: 10, len: results.length-1, page_cnt: page_cnt, page_group: page_group });
		});
});
