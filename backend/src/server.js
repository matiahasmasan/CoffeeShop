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

app.post('/api/login', (req, res) => {
  const { email, password} = req.body;

  const sql = "SELECT * FROM users WHERE email = ? AND password = ?";
  con.query(sql, [email, password], (err, result) => {
    if (err) return res.status(500).json({ mesaj: "Eroare la server" });

    if (result.length > 0) {
      res.json({ succes: true, mesaj: "Te-ai logat!", user: result[0] });
    } else {
      res.status(401).json({ succes: false, mesaj: "Email sau parola gresita" });
    }
  });
});

app.post('/api/register', (req, res) => {
  const { firstName, lastName, email, password, phone} = req.body;

  const sql = "INSERT INTO users (firstName, lastName, email, password, phone) VALUES (?, ?, ?, ?, ?)";
  con.query(sql, [firstName, lastName, email, password, phone], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Eroare la înregistrare. Posibil email duplicat." });
    }
    
    res.status(201).json({ 
      success: true,
      message: "Utilizator creat cu succes!",
      id: result.insertId
     });
  });
});



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

