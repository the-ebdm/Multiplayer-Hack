var express = require('express')
var app = express();
var http = require('http').Server(app);
var path = require('path')
var io = require('socket.io')(http);
var victor = require('victor')

var users = {}; //stores users can be made persistant later if needed
var positions = {};
var userNumber = 1

var canvas = {width: 640, height: 240}
var ballRadius = 10

app.use("/clientScripts", express.static(path.join(__dirname, 'clientScripts')))

app.get('/', function(req, res){
  res.sendfile('public/index.html');
});

app.get('/game', function(req, res){
  res.sendfile('public/clientCode.html');
});

io.on('connection', function(socket){
  var myNumber = userNumber++;
  var myName = 'user#' + myNumber;
  users[myName] = socket;
  positions[myName] = {alive: true, score: 1, x:(Math.random()*(canvas.width-(ballRadius*2)))-ballRadius, y:(Math.random()*(canvas.height-(ballRadius*2)))+ballRadius, ballRadius: ballRadius, color: rainbow(30,Math.random()*30)}
  positions[myName].vec = new victor(Math.random()*5, Math.random()*5).norm()

  socket.emit("id", myName)
  io.sockets.emit("message", myName+" connected")
  io.sockets.emit("positions", JSON.stringify(positions));
  console.log(myName + ' connected and is at: ['+positions[myName].x+","+positions[myName].y+"]")

  socket.on('disconnect', function(){
    console.log(myName + ' disconnected');
    io.sockets.emit("message", myName+" disconnected")
    users[myName] = null
    delete positions[myName]
  });
  socket.on('message', function(msg){
    sender = myName;
    console.log(sender+': ' + msg);
    io.sockets.emit("message", sender+': ' + msg);
  });
  socket.on('keys', function(key){
    sender = positions[myName];
    console.log(myName+" pressed "+key)
    if(key == "W"){
      sender.vec.x = sender.vec.x * 1.1
      sender.vec.y = sender.vec.y * 1.1
    }
    else if (key == "S") {
      sender.vec.x = sender.vec.x * 0.9
      sender.vec.y = sender.vec.y * 0.9
    }
    else if (key == "D") {
      sender.vec.rotateByDeg(15)
      io.sockets.emit("log", "Victor thinks your pointing at: "+sender.vec.angleDeg());
    }
    else if (key == "A"){
      sender.vec.rotateByDeg(-15)
      io.sockets.emit("log", "Victor thinks your pointing at: "+sender.vec.angleDeg());
    }
    position = positions[myName].vec.x+","+positions[myName].vec.y;
    io.sockets.emit("positions", JSON.stringify(positions));
    socket.emit("pos", position);
  });
  socket.on('admin', function(data){
    vals = data.split(':')
    console.log(vals)
    if(vals[0] == "dx"){
      positions[myName].vec.x = parseFloat(vals[1])
    }
    else if(vals[0] == "dy"){
      positions[myName].vec.y = parseFloat(vals[1])
    }
    else if(vals[0] == "x"){
      positions[myName].x = parseFloat(vals[1])
    }
    else if(vals[0] == "y"){
      positions[myName].y = parseFloat(vals[1])
    }
  });
});

//game processing

function tick() {
  Object.keys(positions).forEach(function(key, index){
    if(positions[key].alive == true){
      user = key
      positions[user].x += positions[user].vec.x;
      positions[user].y += positions[user].vec.y;
      if(positions[user].y + positions[user].vec.y < positions[user].ballRadius || positions[user].y + positions[user].vec.y > canvas.height-positions[user].ballRadius){
        positions[user].vec.y = -positions[user].vec.y
      }
      if(positions[user].x + positions[user].vec.x > canvas.width-positions[user].ballRadius || positions[user].x + positions[user].vec.x < positions[user].ballRadius){
        positions[user].vec.x = -positions[user].vec.x
      }
      collisionDetection(user);
    }
  });
  io.sockets.emit("positions", JSON.stringify(positions));
}

function collisionDetection(user){
  Object.keys(positions).forEach(function(key, index){
    p1 = positions[user]
    p2 = positions[key]
    difx = p1.x - p2.x
    dify = p1.y - p2.y
    distance = Math.sqrt(difx * difx + dify * dify)
    if(p1 !== p2 && p1.alive == true && p2.alive == true){
      if(distance < p1.ballRadius + p2.ballRadius){
        io.sockets.emit("log", "collision between "+user+" & "+key);
        if(Math.abs(p1.vec.x) + Math.abs(p1.vec.y) > Math.abs(p2.vec.x) + Math.abs(p2.vec.y)){
          positions[key].alive = false;
          positions[user].score += positions[key].score
          console.log(key+" is dead")
        }
        else {
          positions[user].alive = false;
          positions[key].score += positions[user].score
          console.log(user+" is dead")
        }
      }
    }
  })
}

setInterval(tick, 50);

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
    switch(i % 6){
        case 0: r = 1; g = f; b = 0; break;
        case 1: r = q; g = 1; b = 0; break;
        case 2: r = 0; g = 1; b = f; break;
        case 3: r = 0; g = q; b = 1; break;
        case 4: r = f; g = 0; b = 1; break;
        case 5: r = 1; g = 0; b = q; break;
    }
    var c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
    return (c);
}

http.listen(3000, function() { console.log("Running on 3000"); });
