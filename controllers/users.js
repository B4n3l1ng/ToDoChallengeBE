const config = require('../db/config');
const knex = require('knex')(config.development);
const { connectToRedis } = require('../redis/redis');

// validate function for the hapi/jwt interaction
const validate = async (artifacts, request, h) => {
  const { decoded } = artifacts; // grabs the decoded information from the artifacts object
  let redisClient;
  try {
    redisClient = await connectToRedis(); // connects to the redis client
    const isBlacklisted = await redisClient.get(artifacts.token); //checks if the token has been blacklisted by the logout route

    if (isBlacklisted) {
      return { isValid: false, credentials: null }; // if it's blacklisted, return no credentials and isValid:false
    }

    const existingUser = await knex('User').where({ id: decoded.payload.user }).first(); // searches for the user in the database

    if (existingUser) {
      return { isValid: true, credentials: { user: existingUser.name, id: existingUser.id } }; // if it exists in the database, return the credentials and isValid:true
    } else {
      return { isValid: false, credentials: null }; // else, not valid and no credentials
    }
  } catch (error) {
    console.error('Error in validate function:', error);
    return { isValid: false, credentials: null }; //if there's an error contacting the database, or establishing a connection to redis, return no credentials and isValid:false
  } finally {
    if (redisClient) {
      await redisClient.quit(); // if a connection to redis was established, close it at the end
    }
  }
};

module.exports = validate;
