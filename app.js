const express = require('express');
const bodyParser = require('body-parser');
const Rcon = require('rcon');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(cors({
  origin: process.env.FRONTEND_URL,
}));

app.use(bodyParser.json());

const rconConfig = {
  host: process.env.MC_HOST,
  port: process.env.MC_PORT,
  password: process.env.MC_PASSWORD,
};


/*
Endpoint POST /rcon
FR :Permet d'envoyer une commande RCON au serveur Minecraft
EN : Allow to send a RCON command to the Minecraft server

Request body example:
{
  "command": "say Hello world!"
}

Response:
{
  "response": "Hello world!"
}
*/

app.post('/rcon', (req, res) => {
  const conn = new Rcon(process.env.MC_HOST, process.env.MC_PORT, process.env.MC_PASSWORD);
  const { command } = req.body;

  let responseSent = false;

  conn.on('auth', () => {
    console.log('Authenticated');
    conn.send(command);
  }).on('response', (str) => {
    if (!responseSent) {
      console.log('Response:', str);
      res.json({ response: str });
      responseSent = true;
    }
  }).on('end', () => {
    if (!responseSent) {
      console.warn('Connection closed');
      res.status(500).json({ error: 'Connection closed unexpectedly' });
      responseSent = true;
    }
  }).on('error', (err) => {
    if (!responseSent) {
      console.error('Error:', err);
      res.status(500).json({ error: err.message });
      responseSent = true;
    }
  });

  conn.connect();
});

/*
Endpoint GET /mc/getPlayers
FR : Permet de récupérer la liste des joueurs connectés au serveur Minecraft et le nombre maximum de joueurs
EN : Allow to get the list of players connected to the Minecraft server and the maximum number of players

Response example:
{
  "players": ["Player1", "Player2"],
  "maxPlayers": "20"
}
*/

app.get('/mc/getPlayers', (req, res) => {
  const conn = new Rcon(process.env.MC_HOST, process.env.MC_PORT, process.env.MC_PASSWORD);

  conn.on('auth', () => {
    // console.log('Authenticated');
    conn.send('list');
  }).on('response', (str) => {
    // console.log('Response:', str);
    try {
      const players = str.split(':')[1].split(',').map((player) => player.trim());
      const maxPlayers = str.split(' ')[7];
      res.json({ players, maxPlayers });
      conn.disconnect();
    }
    catch (error) {
      console.error('Error:', error);
      const maxPlayers = str.split(' ')[7];
      res.json({
        players: [], maxPlayers
      });
      // console.warn('No players found');
      // console.warn({ players: [], maxPlayers });
      conn.disconnect();
    }
  }).on('end', () => {
    conn.disconnect();
    console.log('Connection closed');
  }).on('error', (err) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
    conn.disconnect();
  });

  conn.connect();
});

app.listen(port, () => {
  console.log(`RCON server listening`);
});

