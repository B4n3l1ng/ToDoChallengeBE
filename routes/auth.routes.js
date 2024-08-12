const Boom = require('@hapi/boom');
const bcrypt = require('bcrypt');
const config = require('../db/config');
const knex = require('knex')(config.development);
const { userPost } = require('../joi/schemas');
const SALT_ROUNDS = 12;

const authRoutes = [
  {
    method: 'POST',
    path: '/users',
    options: {
      auth: false,
      description: 'Creates a user.',
      notes: 'Creates a user in the database, using the information passed on the body of the request.',
      tags: ['api', 'users'],
      validate: {
        payload: userPost.body,
        failAction: (request, h, error) => {
          console.error('Payload validation failed:', error.message);
          throw Boom.badRequest(`Invalid request payload: ${error.message}`);
        },
      },
      response: {
        failAction: (request, h, error) => {
          console.error('Response validation failed:', error.message);
        },
        status: {
          200: userPost.success,
          400: userPost.badRequest,
        },
      },
    },
    handler: async (request, h) => {
      const { email, password, name } = request.payload;
      try {
        const existingUser = await knex('User').where({ email }).first();
        if (existingUser) {
          return Boom.badRequest('That email is already in use.');
        }
        const validPassword = /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{6,})/.test(password);
        if (!validPassword) {
          return Boom.badRequest('Password needs to be atleast 6 characters long, use one number and one special character.');
        }
        const salt = bcrypt.genSaltSync(SALT_ROUNDS);
        const hashedPassword = bcrypt.hashSync(password, salt);
        const createdUser = await knex('User').insert({ email, password: hashedPassword, name });
        return h.response({ message: 'User registered' }).code(201);
      } catch (error) {
        console.log(error);
        return Boom.internal('Internal server error');
      }
    },
  },
];

module.exports = authRoutes;
