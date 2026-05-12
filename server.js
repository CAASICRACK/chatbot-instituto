const express = require('express');
const cors = require('cors');
const chatHandler = require('./chat.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // sirve el index.html desde /public

app.post('/api/chat', chatHandler);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
