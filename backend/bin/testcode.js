var mysql = require('mysql2');

var con = mysql.createConnection({
  host: "localhost",
  user: "tester",
  password: "g4ythd69",
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});