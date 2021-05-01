//keys.js in server folder will have the host name and other details
const keys = require('./keys');

// Express App Setup
const express = require('express');
//body-parser lib will parse incoming req. from react & turns the body of post req into json
const bodyParser = require('body-parser');
//cors helps to make calls from one domain (react) to different domain (express)
const cors = require('cors');     //cross version resource sharing

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgres Client Setup
const { Pool } = require('pg');
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort
});
pgClient.on('error', () => console.log('Lost PG connection'));

//Create a table (onetime step) for insertion of records
//Inserts a single value -- index looked up. This the comment for .query line
pgClient
  .query('CREATE TABLE IF NOT EXISTS values (number INT)')      
  .catch(err => console.log(err));        //Interesting syntax.

// Redis Client Setup
//Retry to connect to redis every 1 sec, if disconnected.
const redis = require('redis');
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate();

// Express route handlers

app.get('/', (req, res) => {
  res.send('Hi Pavan from server/index.js');
});

//This below logic will query postgres and retrieve all values that were ever submitted to postgres.
//async function is handling the req. here
app.get('/values/all', async (req, res) => {
  const values = await pgClient.query('SELECT * from values');

  res.send(values.rows);
});

//To get the values from redis. async fn
//Redis lib for node does not support promise. So we have to use the classic callback fn instead of await fn
//hgetall = Look at the hash and get all it's values
app.get('/values/current', async (req, res) => {
  redisClient.hgetall('values', (err, values) => {
    res.send(values);
  });
});

//This below will get the input submitted in the form, and stores it to postgres and redis
app.post('/values', async (req, res) => {
  const index = req.body.index;

  if (parseInt(index) > 40) {
    return res.status(422).send('Index too high');
  }

  //We have not yet calc. the fib of index. Hence the msg. Worker will calc. and reset it in redis hash.
  redisClient.hset('values', index, 'Nothing yet!');
  redisPublisher.publish('insert', index);
  pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

  res.send({ working: true });
});

app.listen(5000, err => {
  console.log('Server Listening on port 5000');
});
