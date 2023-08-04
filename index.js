const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const https = require('https');
const Ruta = require('./metodos/insertar');
const app = express();
const router = express.Router();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.end('servidor arriba');
});
module.exports = router;
app.use('/api/Video', Ruta)

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
  secureProtocol: 'TLSv1_2_method'
};

const server = https.createServer(options, app);

const serverAddress = '10.148.224.111'; 

const port = 9990;

server.listen(port,serverAddress,  () => {
  console.log('Servidor HTTPS está arriba');
});
