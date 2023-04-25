require("dotenv").config();
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const redis = require("redis");
const PORT = process.env.PORT || 3000;

const client = redis.createClient({
  password: process.env.REDIS_PASSWORD,
  host: process.env.REDIS_HOSTNAME,
  port: process.env.REDIS_PORT
});

client.on('error', (err) => {
  console.error('Erro do Redis:', err);
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', async (socket) => {
  console.log('Novo usuário conectado');

  socket.on('chat message', (msg) => {
    console.log('Mensagem recebida:', msg);

    client.lpush('chat messages', msg, (err, reply) => {
      if (err) throw err;
      console.log('Mensagem salva no Redis');
    });

    io.emit('chat message', msg);
  });

  client.lrange('chat messages', 0, 9, (err, messages) => {
    if (err) throw err;
    console.log('Carregando as últimas 10 mensagens:', messages);
    socket.emit('chat message', messages.reverse());
  });

});

http.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}/`);
});
