const config = require('../db/config');
const knex = require('knex')(config.development);

const validate = async (artifacts, request, h) => {
  const { decoded } = artifacts;
  try {
    const existingUser = await knex('User').where({ id: decoded.payload.user }).first();

    if (existingUser) {
      return { isValid: true, credentials: { user: existingUser.name, id: existingUser.id } };
    } else {
      return { isValid: false, credentials: null };
    }
  } catch (error) {
    console.error('Error in validate function:', error);

    return { isValid: false, credentials: null };
  }
};

module.exports = validate;
