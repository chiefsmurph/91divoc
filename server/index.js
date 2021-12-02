const port = process.env.PORT || 3000;

const express = require('express');
const SocketIO = require('socket.io');
const app = express();

const getHighestLowest = require('./get-highest-lowest');

const server = app.listen(port, () => {
    console.log('[INFO] Listening on *:' + port);
});
    
const io = SocketIO(server, {
    handlePreflightRequest: (req, res) => {
        console.log(req.headers.origin)
        const headers = {
            "Access-Control-Allow-Headers": "Content-Type, Authorization, Pragma",
            "Access-Control-Allow-Origin": req.headers.origin, //or the specific origin you want to give access to,
            "Access-Control-Allow-Credentials": true
        };
        res.writeHead(200, headers);
        res.end();
    }
});

io.on('connection', async client => {
    const ip = (client.handshake.headers['x-forwarded-for'] || client.handshake.address.address || '').split(',')[0];
    const userAgent = client.request.headers['user-agent'];
    console.log(`new connection: ${ip} (${userAgent}`);

    client.on('getHighestLowest', async cb => {
        cb(await getHighestLowest());
    });
});