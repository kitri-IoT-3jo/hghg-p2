var create = false;
window.onload = function() {
    var dID = 1;
    document.getElementById("create").onclick = function() {
        var id = 'user_id' + (dID++);

        //left cards
        var text = document.createElement('input');
        text.setAttribute('type', 'text');
        text.setAttribute('class', 'tmp');
        text.setAttribute('placeholder', '제목 입력');

        //right cards
        var date = document.createElement('input');
        date.setAttribute('type', 'text');
        date.setAttribute('class', 'tmp');
        date.setAttribute('placeholder', '날짜 입력');

        var btn = document.createElement('input');
        btn.setAttribute('type', 'button');
        btn.setAttribute('class', 'tmp');
        btn.setAttribute('value', 'ㅎㄲㅎㄲ!');
        btn.setAttribute('onclick', 'makenew(\'hghg_' + id + '\')');

        //main div
        var hghg = document.createElement('div');
        hghg.setAttribute('class', 'hghg');
        hghg.setAttribute('id', 'hghg_' + id);
        hghg.appendChild(text);
        hghg.appendChild(date);
        hghg.appendChild(btn);

        var cbtn = document.getElementById('create');
        document.getElementById('hg').removeChild(cbtn);
        document.getElementById('hg').appendChild(hghg);
    }
}

function makenew(divID) {
    var main = document.getElementById(divID);
    var text = main.childNodes[0];
    var date = main.childNodes[1];
    var btn = main.childNodes[2];

    //left cards
    var title = document.createElement('div');
    title.setAttribute('class', 'hcard');
    var th = document.createElement('h4');
    th.innerText = text.value;
    title.appendChild(th);

    var member = document.createElement('div');
    member.setAttribute('class', 'hcard');
    var host = document.createElement('div');
    host.setAttribute('class', 'member');
    var himg = document.createElement('img');
    var prof = document.createElement('img');
    var name = document.createElement('h4');
    himg.setAttribute('src', '../img/host.png');
    prof.setAttribute('src', '../img/profile.png');
    name.setAttribute('class', 'member_name');
    name.innerText = '이름';
    host.appendChild(himg);
    host.appendChild(prof);
    host.appendChild(name);
    member.appendChild(host);

    var lcs = document.createElement('div');
    lcs.setAttribute('class', 'leftcards');
    lcs.appendChild(title);
    lcs.appendChild(member);

    //right cards
    var time = document.createElement('div');
    time.setAttribute('class', 'hcard');
    var clock = document.createElement('h4');
    var alarm = document.createElement('img');
    clock.innerText = date.value;
    clock.setAttribute('class', 'alarms');
    alarm.setAttribute('class', 'alarms');
    alarm.setAttribute('src', '../img/alarm.png');
    time.appendChild(clock);
    time.appendChild(alarm);

    var buttons = document.createElement('div');
    buttons.setAttribute('class', 'hcard');
    var list = document.createElement('ul');
    list.setAttribute('type', 'none');
    var a = document.createElement('li');
    var b = document.createElement('li');
    var c = document.createElement('li');
    var join = document.createElement('input');
    var exit = document.createElement('input');
    var chat = document.createElement('img');
    join.setAttribute('type', 'button');
    join.setAttribute('value', '참가하기');
    exit.setAttribute('type', 'button');
    exit.setAttribute('value', '나가기');
    chat.setAttribute('src', '../img/chat.png');
    chat.setAttribute('class', 'chat_img');
    a.appendChild(join);
    b.appendChild(exit);
    c.appendChild(chat);
    list.appendChild(a);
    list.appendChild(b);
    list.appendChild(c);
    buttons.appendChild(list);

    var rcs = document.createElement('div');
    rcs.setAttribute('class', 'rightcards');
    rcs.appendChild(time);
    rcs.appendChild(buttons);

    main.removeChild(text);
    main.removeChild(date);
    main.removeChild(btn);
    main.appendChild(lcs);
    main.appendChild(rcs);
}