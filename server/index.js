//keys.js in server folder will have the host name and other details
const keys = require('./keys');

// ------------- Express App Setup ------------------
const express = require('express');
//body-parser lib will parse incoming req. from react & turns the body of post req into json
const bodyParser = require('body-parser');
//cors helps to make calls from one domain (react) to different domain (express)
const cors = require('cors');     //cross origin resource sharing

const app = express();    // New express application
app.use(cors());
app.use(bodyParser.json());

// --------------- Postgres Client SetupS ------------------
// --> Postgres just stores the input in its DB.
const { Pool } = require('pg');
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
  ssl:
    process.env.NODE_ENV !== 'production'
      ? false
      : { rejectUnauthorized: false },
});

/*  OLD code to be replaced by next block below per tutor.  Changed on 05/22/24
pgClient.on('error', () => console.log('Lost PG connection'));
pgClient
  .query('CREATE TABLE IF NOT EXISTS values (number INT)')      
  .catch(err => console.log(err));        
*/

//Create a table called values (onetime step if the table does not exist already) for insertion of records
//Inserts a single value -- index looked up. This the comment for .query line
pgClient.on("connect", (client) => {
  client
    .query("CREATE TABLE IF NOT EXISTS values (number INT)")
    .catch((err) => console.error(err));    // <-- Interesting syntax.
});

// ------------- Redis Client Setup ----------------------
// --> Redis stores both the input (index) and calculated fib value in it.
//Retry to connect to redis every 1 sec, if disconnected.
const redis = require('redis');
const redisClient = redis.createClient({
  host: keys.redisHost,          // Create client object with host & port
  port: keys.redisPort,
  retry_strategy: () => 1000     // This arrow fn always returns 1000.
});
const redisPublisher = redisClient.duplicate();    // This dupication is redis specific.


// -----------  Express route handlers  --------------------
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
//hgetall = Look at the hash and get all it's values. hgetall also has a callback fn (err, values) in it.
// Here when async funtion responds, the callback function is invoked which sends the response with values.
app.get('/values/current', async (req, res) => {
  redisClient.hgetall('values', (err, values) => {
    res.send(values);
  });
});

//This below will get the input submitted in the form, and stores it to postgres and redis
// This is a post request. 
app.post('/values', async (req, res) => {    // This async callback invoked by worker after fib calc.
  const index = req.body.index;
  if (parseInt(index) > 40) {                // >40 will take a long time.
    return res.status(422).send('Index too high');     //422 = server unable to process because request has invalid data.
  }
  //We have not yet calc. the fib of index. Hence the msg. Worker will calc. and reset it in redis hash.
  redisClient.hset('values', index, 'Nothing yet!');
  redisPublisher.publish('insert', index);    // Publish a new msg to the worker process.
  pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);    //pg will just store the inputs
  res.send({ working: true });
});

app.listen(5000, err => {
  console.log('Server Listening on port 5000');
});
