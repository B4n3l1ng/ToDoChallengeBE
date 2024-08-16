const redis = require('redis');

// Create a Redis client using the Redis connection details in .env
async function connectToRedis() {
  const client = redis.createClient({
    password: process.env.REDIS_PASS,
    socket: {
      host: process.env.REDIS_CLIENT,
      port: 17247,
    },
  });

  try {
    await client.connect(); //create the connection
  } catch (err) {
    console.error('Redis connection error:', err);
    throw err;
  }

  return client; // return the connection
}

async function blacklistToken(token) {
  const redisClient = await connectToRedis(); // create the connection through the function above

  try {
    await redisClient.set(token, 'blacklisted', { EX: 3600 }); // blacklist the token passed as an argument, stays blacklisted for one hour
  } catch (error) {
    console.error('Error blacklisting token:', error);
    throw error;
  } finally {
    await redisClient.quit(); // close the redis connection at the end
  }
}

module.exports = { connectToRedis, blacklistToken };
