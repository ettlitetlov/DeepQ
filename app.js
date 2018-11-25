const qAgent = require('./qAgent');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const market = require("./market")
const io = require('socket.io')(http);
const port = 3000;

// Allow CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });


app.get('/api/market', (req, res) => {
    console.log("Sending res");
    res.send(market.marketPositions);
})

setInterval(function () {
    market.updateMarket();
    io.sockets.emit('market', market.marketPositions[0]);
  }, 10);
  
  io.on('connection', function (socket) {
    console.log('a user connected');
  });
  

http.listen(port, () => console.log(`Listening on port ${port}!`))

// Initialize agent
var myAgent = new qAgent([10, 12.0], ['Buy', 'Sell', 'Hold'], 0.6);
