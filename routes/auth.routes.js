const Boom = require('@hapi/boom');
const bcrypt = require('bcrypt');
const config = require('../db/config');
const knex = require('knex')(config.development);
const { userPost, login } = require('../joi/schemas');
const SALT_ROUNDS = 12;
const Jwt = require('@hapi/jwt');
const { failActionPayload, failActionResponse } = require('../controllers/failAction');

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
        failAction: failActionPayload,
      },
      response: {
        failAction: failActionResponse,
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
  {
    method: 'POST',
    path: '/login',
    options: {
      auth: false,
      tags: ['api', 'users'],
      description: 'Login a user',
      notes: 'Logs in a user with the provided credentials.',
      validate: {
        payload: login.body,
        failAction: failActionPayload,
      },
      response: {
        failAction: failActionResponse,
        status: {
          200: login.success,
          401: login.unauthorized,
        },
      },
    },
    handler: async (request, h) => {
      const { email, password } = request.payload;
      try {
        const user = await knex('User').where({ email }).first();
        console.log('user', user);
        if (!user) {
          console.log('invalid email');
          return Boom.unauthorized('Invalid email or password');
        }
        const isValid = bcrypt.compareSync(password, user.password);
        if (!isValid) {
          console.log('invalid password');
          return Boom.unauthorized('Invalid email or password');
        }
        const token = Jwt.token.generate({ user: user.id }, { key: process.env.TOKEN_SECRET, algorithm: 'HS256' });
        return h.response({ token }).code(200);
      } catch (error) {
        console.log(error);
        return Boom.internal('Internal server error');
      }
    },
  },
];

module.exports = authRoutes;
