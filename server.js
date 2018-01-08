var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');

var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));
var messages = [];
var sockets = [];
var timeoutCooldown = 5000;
var unsubscribeCooldown = {};
var canvases = {
  "0": {
    "inUse": false,
    "drawerName": "",
    "image": "GWR-Superheroes-SUPERMAN.svg",
    "originalImage": "GWR-Superheroes-SUPERMAN.svg",
  },
  "1": {
    "inUse": false,
    "drawerName": "",
    "image": "Wonder_Woman_(DC_Super_Hero_Girls).png",
    "originalImage": "Wonder_Woman_(DC_Super_Hero_Girls).png"
  },
  "2": {
    "inUse": false,
    "drawerName": "",
    "image": "GWR-Superheroes-SUPERMAN.svg",
    "originalImage": "GWR-Superheroes-SUPERMAN.svg"
  },
  "3": {
    "inUse": false,
    "drawerName": "",
    "image": "Wonder_Woman_(DC_Super_Hero_Girls).png",
    "originalImage": "Wonder_Woman_(DC_Super_Hero_Girls).png"
  },
  "4": {
    "inUse": false,
    "drawerName": "",
    "image": "GWR-Superheroes-SUPERMAN.svg",
    "originalImage": "GWR-Superheroes-SUPERMAN.svg"
  },
  "5": {
    "inUse": false,
    "drawerName": "",
    "image": "Wonder_Woman_(DC_Super_Hero_Girls).png",
    "originalImage": "Wonder_Woman_(DC_Super_Hero_Girls).png"
  }
};

io.on('connection', function(socket) {

  socket.emit('canvases', canvases);


  sockets.push(socket);

  socket.on('disconnect', function() {
    sockets.splice(sockets.indexOf(socket), 1);
  });

  function timeoutUseCanvas(drawRequest) {
    unsubscribeCooldown[drawRequest.canvasId] = setTimeout(function() {
      canvases[drawRequest.canvasId].inUse = false;
      broadcast('canvases', canvases);
    }, timeoutCooldown);
  }

  socket.on('startDrawing', function(drawRequest) {
    if (drawRequest.userName !== canvases[drawRequest.canvasId].drawerName && !canvases[drawRequest.canvasId].inUse) {
      timeoutUseCanvas(drawRequest);
      canvases[drawRequest.canvasId].inUse = true;
      canvases[drawRequest.canvasId].drawerName = drawRequest.userName;
      canvases[drawRequest.canvasId].image = drawRequest.image;
      broadcast('canvases', canvases);
    }
    else if (drawRequest.userName === canvases[drawRequest.canvasId].drawerName) {
      clearTimeout(unsubscribeCooldown[drawRequest.canvasId]);
      canvases[drawRequest.canvasId].inUse = true;
      canvases[drawRequest.canvasId].drawerName = drawRequest.userName;
      canvases[drawRequest.canvasId].image = drawRequest.image;
      timeoutUseCanvas(drawRequest);
      broadcast('canvases', canvases);
    }
  });

  socket.on('clearDrawing', function(drawRequest) {
    if (drawRequest.userName !== canvases[drawRequest.canvasId].drawerName && !canvases[drawRequest.canvasId].inUse) {
      clearTimeout(unsubscribeCooldown[drawRequest.canvasId]);
      canvases[drawRequest.canvasId].drawerName = drawRequest.userName;
      canvases[drawRequest.canvasId].image = canvases[drawRequest.canvasId].originalImage;
      canvases[drawRequest.canvasId].inUse = false;
      broadcast('resetPaint', { id: drawRequest.canvasId, image: canvases[drawRequest.canvasId].image, drawerName: canvases[drawRequest.canvasId].drawerName });
    }
    else if (drawRequest.userName === canvases[drawRequest.canvasId].drawerName) {
      clearTimeout(unsubscribeCooldown[drawRequest.canvasId]);
      canvases[drawRequest.canvasId].drawerName = drawRequest.userName;
      canvases[drawRequest.canvasId].image = canvases[drawRequest.canvasId].originalImage;
      canvases[drawRequest.canvasId].inUse = false;
      broadcast('resetPaint', { id: drawRequest.canvasId, image: canvases[drawRequest.canvasId].image, drawerName: canvases[drawRequest.canvasId].drawerName });
    }
  });

  socket.on('drawing', function(drawRequest) {
    if (drawRequest.userName === canvases[drawRequest.canvasId].drawerName && canvases[drawRequest.canvasId].inUse) {
      clearTimeout(unsubscribeCooldown[drawRequest.canvasId]);
      canvases[drawRequest.canvasId].image = drawRequest.image;
      timeoutUseCanvas(drawRequest);
      broadcast('canvasPaint', { id: drawRequest.canvasId, image: canvases[drawRequest.canvasId].image, drawerName: canvases[drawRequest.canvasId].drawerName });
    }
  });


});

function broadcast(event, data) {
  sockets.forEach(function(socket) {
    socket.emit(event, data);
  });
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
