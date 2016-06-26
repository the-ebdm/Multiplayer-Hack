var express = require('express');
var app = express();
var http = require('http').Server(app);
var path = require('path');
var io = require('socket.io')(http);

var users = {}; //stores users can be made persistant later if needed
var positions = {};
var userNumber = 1;

var canvas = {width: 640, height: 480};
var ballRadius = 10;

function vector(x, y){
  this.x = x;
  this.y = y;
  this.rotateByDeg = function(deg) {
    rad = toRadians(deg)
    ca = Math.cos(rad)
    sa = Math.sin(rad)
    this.x = ca*this.x - sa*this.y
    this.y = sa*this.x + ca*this.y
  }
  this.speed = function(){
    return Math.sqrt(Math.pow(this.x, 2)+Math.pow(this.y, 2))
  }
  this.normalise = function(){
    this.x = this.x / this.speed()
    this.y = this.y / this.speed()
  }
}

app.use("/public", express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
    res.sendfile('public/index.html');
});

app.get('/game', function (req, res) {
    res.sendfile('public/clientCode.html');
});

io.on('connection', function (socket) {
    var myNumber = userNumber++;
    var myName = 'user#' + myNumber;
    users[myName] = socket;
    positions[myName] = {
        alive: true,
        score: 1,
        x: (Math.random() * (canvas.width - (ballRadius * 2))) - ballRadius,
        y: (Math.random() * (canvas.height - (ballRadius * 2))) + ballRadius,
        ballRadius: ballRadius,
        color: rainbow(30, Math.random() * 30)
    };
    positions[myName].vec = new vector(Math.random() * 5, Math.random() * 5)

    socket.emit("id", myName);
    io.sockets.emit("message", myName + " connected");
    io.sockets.emit("positions", JSON.stringify(positions));

    socket.on('disconnect', function () {
        console.log(myName + ' disconnected');
        io.sockets.emit("message", myName + " disconnected");
        users[myName] = null
        delete positions[myName]
    });
    socket.on('message', function (msg) {
        sender = myName;
        console.log(sender + ': ' + msg);
        io.sockets.emit("message", sender + ': ' + msg);
    });
    socket.on('keys', function (key) {
        sender = positions[myName];
        if (key == "W") {
            if(sender.vec.speed() < 5){
              sender.vec.x = sender.vec.x * 2;
              sender.vec.y = sender.vec.y * 2;
            }
        }
        else if (key == "S") {
            sender.vec.x = sender.vec.x * 0.5;
            sender.vec.y = sender.vec.y * 0.5;
        }
        else if (key == "D") {
            sender.vec.rotateByDeg(15);
        }
        else if (key == "A") {
            sender.vec.rotateByDeg(-15)
        }
        io.sockets.emit("positions", JSON.stringify(positions));
    });
    socket.on('kick', function (user) {
        io.sockets.users[user].disconnect()
    });
});

//game processing

function tick() {
    Object.keys(positions).forEach(function(key, index){
      if(positions[key].alive == true){
        user = positions[key]
        user.x += user.vec.x;
        user.y += user.vec.y;
        if(user.y + user.vec.y < user.ballRadius || user.y + user.vec.y > canvas.height-user.ballRadius){
          user.vec.y = -user.vec.y
        }
        if(user.x + user.vec.x > canvas.width-user.ballRadius || user.x + user.vec.x < user.ballRadius){
          user.vec.x = -user.vec.x
        }
        collisionDetection(user);
      }
    });
    io.sockets.emit("positions", JSON.stringify(positions));
}

function collisionDetection(user) {
    Object.keys(positions).forEach(function (key, index) {
        p1 = user;
        p2 = positions[key];
        difx = p1.x - p2.x;
        dify = p1.y - p2.y;
        distance = Math.sqrt(difx * difx + dify * dify);
        if (p1 !== p2 && p1.alive == true && p2.alive == true) {
            if (distance < p1.ballRadius + p2.ballRadius) {
                io.sockets.emit("log", "collision between " + user + " & " + key);
                if (Math.abs(p1.vec.x) + Math.abs(p1.vec.y) > Math.abs(p2.vec.x) + Math.abs(p2.vec.y)) {
                    positions[key].alive = false;
                    positions[user].score += positions[key].score;
                    console.log(key + " is dead")
                }
                else {
                    positions[user].alive = false;
                    positions[key].score += positions[user].score;
                    console.log(user + " is dead")
                }
            }
        }
        io.sockets.emit("positions", JSON.stringify(positions));
      })
    }


//misc functions

function rainbow(numOfSteps, step) {
    // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
    // Adam Cole, 2011-Sept-14
    // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
    var r, g, b;
    var h = step / numOfSteps;
    var i = ~~(h * 6);
    var f = h * 6 - i;
    var q = 1 - f;
    switch (i % 6) {
        case 0:
            r = 1;
            g = f;
            b = 0;
            break;
        case 1:
            r = q;
            g = 1;
            b = 0;
            break;
        case 2:
            r = 0;
            g = 1;
            b = f;
            break;
        case 3:
            r = 0;
            g = q;
            b = 1;
            break;
        case 4:
            r = f;
            g = 0;
            b = 1;
            break;
        case 5:
            r = 1;
            g = 0;
            b = q;
            break;
    }
    var c = "#" + ("00" + (~~(r * 255)).toString(16)).slice(-2) + ("00" + (~~(g * 255)).toString(16)).slice(-2) + ("00" + (~~(b * 255)).toString(16)).slice(-2);
    return (c);
}

function toRadians(num){
  return num * (Math.PI/180)
}

function toDegrees(num){
  return num * (180/Math.PI)
}
setInterval(tick, 50);

http.listen(3000, function () {
    console.log("Running on 3000");
});
