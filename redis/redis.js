const redis = require('redis');

// Create a Redis client using the Redis Labs connection details
async function connectToRedis() {
  const client = redis.createClient({
    password: process.env.REDIS_PASS,
    socket: {
      host: process.env.REDIS_CLIENT,
      port: 17247,
    },
  });

  try {
    await client.connect();
  } catch (err) {
    console.error('Redis connection error:', err);
    throw err;
  }

  return client;
}

async function blacklistToken(token) {
  const redisClient = await connectToRedis();

  try {
    await redisClient.set(token, 'blacklisted', { EX: 3600 });
    console.log('Token blacklisted');
  } catch (error) {
    console.error('Error blacklisting token:', error);
    throw error;
  } finally {
    await redisClient.quit();
  }
}

module.exports = { connectToRedis, blacklistToken };
