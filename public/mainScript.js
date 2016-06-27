var socket = io();
var position;
var positions;
var alive;
var id;
var MESSAGELIMIT = 20;

var poslog = {};
var MSGFADE = 5000;
var trail = false;
var tick = 1;
var drawing = null;

function attachHandlers() {
    $('.btn-start').on('click', init);
    //$('.btn-stop').on('click', halt);
    $('#chat').on('keypress', function(e){
        (e.which === 13) && sendChat();
    });
}

function setup() {
    attachHandlers();
    setInterval(clearOldMessages, MESSAGELIMIT);
}

function init() {
    //start game
    $('#banner').hide();
    $('#game').removeClass("hidden");
}

function sendChat() {
    var chatBox = $("#chat");
    sendMessage(chatBox.val());
    chatBox.val("");
}

function clearOldMessages() {
    var doomedMessages = $('#messages li').slice(MESSAGELIMIT);
    doomedMessages.fadeOut(MSGFADE).promise().then(function(){
        doomedMessages.detach();
    });
}

function sendMessage(msg) {
    socket.emit("message", msg);
}
function change(vari, val) {
    socket.emit("admin", vari + ":" + val)
}
socket.on('message', function (msg) {
    $('#messages').prepend('<li>' + msg + '</li>').children(':first');
});
socket.on('id', function (data) {
    id = data;
});
socket.on('positions', function (data) {
    positions = JSON.parse(data);
    position = positions[id];
    position.vec = new vector(position.vec.x, position.vec.y)
    $('#chatbox').css({
        'background-image': 'none',
        'border-color': position.color
    });
    $('.panel-heading').css({
        'background-image': 'none',
        'background-color': position.color
    });
    draw();
});
socket.on('log', function (msg) {
    console.dir(msg);
});
    var canvas = document.getElementById("battlefield");
    var ctx = canvas.getContext("2d");

    document.addEventListener("keydown", keyDownHandler, false);

    function keyDownHandler(e) {
        switch (e.keyCode) {
            case 65:
                socket.emit("keys", "A");
                console.log("A");
                break;
            case 87:
                socket.emit("keys", "W");
                console.log("W");
                break;
            case 68:
                socket.emit("keys", "D");
                console.log("D");
                break;
            case 83:
                socket.emit("keys", "S");
                console.log("S");
                break;
            default:
                break;
        }
    }


    function drawName() {
        ctx.font = "16px Arial";
        ctx.fillStyle = position.color;
        ctx.fillText(id + " - Score: " + position.score, 8, 20);
    }

    function drawDead() {
        ctx.font = "16px Arial";
        ctx.fillStyle = position.color;
        ctx.fillText("You're Dead: Game Over", canvas.width / 2, canvas.height / 2);
        document.title = "You're Dead";
        trail = false
    }

    function drawBalls() {
        Object.keys(positions).forEach(function (key, index) {
            if (positions[key].alive == true) {
                if (key == id) {
                    document.title = "Score: " + positions[id].score;
                }
                drawBall(key);
            }
            else if (key == id) {
                drawDead();
            }
        });
    }

    function drawTrail() {
        Object.keys(poslog).forEach(function (key) {
            ctx.beginPath();
            ctx.arc(poslog[key].x, poslog[key].y, 1, 0, Math.PI * 2);
            ctx.fillStyle = position.color;
            ctx.fill();
            ctx.closePath();
        });
    }

    function drawBall(user) {
        arrow(positions[user].color, positions[user].x, positions[user].y, positions[user].x + positions[user].vec.x, positions[user].y + positions[user].vec.y, positions[user].ballRadius)
        if (positions[user].y + positions[user].vec.y < positions[user].ballRadius || positions[user].y + positions[user].vec.y > canvas.height - positions[user].ballRadius) {
            positions[user].vec.y = -positions[user].vec.y
        }
        if (positions[user].x + positions[user].vec.x > canvas.width - positions[user].ballRadius || positions[user].x + positions[user].vec.x < positions[user].ballRadius) {
            positions[user].vec.x = -positions[user].vec.x
        }
        positions[user].x += positions[user].vec.x;
        positions[user].y += positions[user].vec.y;
    }

    function arrow(color, fromx, fromy, tox, toy, width) {
        var headlen = 20;   // length of head in pixels
        var angle = Math.atan2(toy - fromy, tox - fromx);
        ctx.beginPath();
        ctx.moveTo(fromx, fromy);
        ctx.lineTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.closePath();
    }

    function draw() {
        if (positions) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            poslog[tick] = {x: position.x, y: position.y};
            delete poslog[tick - 100];
            drawBalls();
            drawName();
            if (trail == true) {
                drawTrail();
            }
            position = positions[id];
            tick++;
        }
    }

    function direction(x, y) {
        var addDeg = 0;
        if (x < 0) {
            addDeg = y >= 0 ? 180 : 270;
        }
        else if (y <= 0) {
            addDeg = 360;
        }
        return Math.floor(Math.abs(Math.abs(Math.atan(y / x) * 180 / Math.PI) - addDeg));
    }

    function setSpeed(speed) {

    }

    socket.emit("keys", " ");
    setup();
