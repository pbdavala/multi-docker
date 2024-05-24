//keys file will have the host name and port required for connection to redis.
const keys = require('./keys');
//Import a redis client
const redis = require('redis');

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000   //Retry to connect to redis every 1 sec, if disconnected.
});
const sub = redisClient.duplicate();  // sub --> subscription

function fib(index) {
  if (index < 2) return 1;
  return fib(index - 1) + fib(index - 2);   //Recursive solution.. Fn calls itself.
}

//watch Redis for any time we get a new value inserted into it, we run the callback fn.
sub.on('message', (channel, message) => {
  //calc the fib and insert into a hash "values", with the key-value pair of (message=index, fib(index))
  redisClient.hset('values', message, fib(parseInt(message)));
});

// sub subscribes for insert event into redisClient.
sub.subscribe('insert');
