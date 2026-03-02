const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 8000;

let mysql = require('mysql');

let con = mysql.createConnection({
  host:"localhost",
  user:"root",
  password:"",
  database:"loyaltyCards"
})

con.connect(function(err){
  if(err){
    console.error("Eroare la conectare: " + err.message);
    return;
  }
  console.log("Conectat cu succes la baza de date MySQL!");
});

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CoffeeShop backend is running',
  });
});

app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not found',
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`CoffeeShop backend listening on port ${PORT}`);
});

