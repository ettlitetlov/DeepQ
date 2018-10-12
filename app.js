const qAgent = require('./qAgent');
const express = require('express');
const app = express();
const port = 3000;



app.get('/', (req, res) => res.send('Welcome to this empty node app'))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

// Initialize agent
var myAgent = new qAgent([10, 12.0], ['Buy', 'Sell', 'Hold'], 0.6);

console.log(myAgent.state);