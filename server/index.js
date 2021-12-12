const port = process.env.PORT || 3000;

const fs = require('fs/promises');
const express = require('express');
const SocketIO = require('socket.io');
const app = express();

const getHighestLowestWorld = require('./get-highest-lowest-world');
const getHighestLowestStates = require('./get-highest-lowest-states');
const getStateData = require('./get-state-data');
const getWorldData = require('./get-world-data');

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

app.get('/state-data.json', async (req, res) => res.json(await getStateData()));
app.get('/world-data.json', async (req, res) => res.json(await getWorldData()));


const intervalCache = (asyncFn, refreshInterval = 60) => {
    let lastChange;
    let cachedVal;
    const watchers = [];
    const refreshCache = async () => {
        console.log('INTERVAL CACHE REFRESHING');
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newVal = await asyncFn();
        lastChange = Date.now();
        if (JSON.stringify(newVal) !== JSON.stringify(cachedVal)) {
            console.log('cache value changed');
            watchers.forEach(fn => 
                fn({
                    ...newVal,
                    lastChange
                })
            );
        }
        cachedVal = newVal;
    };
    setInterval(refreshCache, refreshInterval * 1000 * 60);
    refreshCache();
    const response = () => ({
        /// TODO: we know its an object ... for now?
        ...cachedVal,
        lastChange,
    });
    response.onChange = fn => {
        watchers.push(fn);
    };
    return response;
};


const cachedWorld = intervalCache(getHighestLowestWorld, 60);
cachedWorld.onChange(newWorld => io.emit('highestLowestWorld', newWorld));

const cachedStates = intervalCache(getHighestLowestStates, 110);
cachedStates.onChange(newStates => io.emit('highestLowestStates', newStates));

const increaseAndUpdateCounter = async () => {
    const file = './data/number-of-visits.json';
    delete require.cache[require.resolve(file)];
    const current = require(file);
    console.log({ current})
    const next = Number(current) + 1;
    await fs.writeFile(file, JSON.stringify(next));
    return next;
};

io.on('connection', async client => {
    const ip = (client.handshake.headers['x-forwarded-for'] || client.handshake.address.address || '').split(',')[0];
    const userAgent = client.request.headers['user-agent'];
    console.log(`new connection: ${ip} (${userAgent}`);

    client.emit('highestLowestWorld', cachedWorld());
    client.emit('highestLowestStates', cachedStates());
    io.emit('counter', await increaseAndUpdateCounter());
});