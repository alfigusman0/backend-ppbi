var mysql = require('mysql2');

//- Connection configuration
var db_config = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: false,
  connectionLimit: 10000,
  maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 10000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 100,
  debug: false,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

var database = mysql.createPool(db_config);

database.on('acquire', function (connection) {
  console.log('Connection %d acquired', connection.threadId);
});

database.on('connection', function (connection) {
  connection.query('SET SESSION auto_increment_increment=1')
});

database.on('enqueue', function () {
  console.log('Waiting for available connection slot');
});

database.on('release', function (connection) {
  console.log('Connection %d released', connection.threadId);
});

database.on('error', function (err) {
  console.log(err.code); // 'ER_BAD_DB_ERROR'
});
module.exports = database;