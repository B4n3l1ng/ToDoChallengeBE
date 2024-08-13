const config = require('../db/config');
const knex = require('knex')(config.development);
const { connectToRedis } = require('../redis/redis');

const validate = async (artifacts, request, h) => {
  const { decoded } = artifacts;
  let redisClient;
  try {
    redisClient = await connectToRedis();
    const isBlacklisted = await redisClient.get(artifacts.token);
    if (isBlacklisted) {
      return { isValid: false, credentials: null };
    }

    const existingUser = await knex('User').where({ id: decoded.payload.user }).first();

    if (existingUser) {
      return { isValid: true, credentials: { user: existingUser.name, id: existingUser.id } };
    } else {
      return { isValid: false, credentials: null };
    }
  } catch (error) {
    console.error('Error in validate function:', error);
    return { isValid: false, credentials: null };
  } finally {
    if (redisClient) {
      await redisClient.quit();
    }
  }
};

module.exports = validate;
