const Boom = require('@hapi/boom');
const bcrypt = require('bcrypt');
const config = require('../db/config');
const knex = require('knex')(config.development);
const { userPost, login, logoutResponse, unauthorizedResponse, meGet, mePatch } = require('../joi/validation');
const SALT_ROUNDS = 12;
const Jwt = require('@hapi/jwt');
const { failActionPayload, failActionResponse } = require('../controllers/failAction');
const { blacklistToken } = require('../redis/redis');

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
        await knex('User').insert({ email, password: hashedPassword, name });
        return h.response({ message: 'User registered' }).code(201);
      } catch (error) {
        console.error(error);
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
      description: 'Login a user.',
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
        const user = await knex('User').where({ email }).first().select(['id', 'name', 'email', 'password']);
        if (!user) {
          return Boom.unauthorized('Invalid email or password');
        }
        const isValid = bcrypt.compareSync(password, user.password);
        if (!isValid) {
          console.log('invalid password');
          return Boom.unauthorized('Invalid email or password');
        }
        const userInfo = { name: user.name, email: user.email, id: user.id };
        const token = Jwt.token.generate({ user: user.id }, { key: process.env.TOKEN_SECRET, algorithm: 'HS256' });
        return h.response({ token, user: userInfo }).code(200);
      } catch (error) {
        console.log(error);
        return Boom.internal('Internal server error');
      }
    },
  },
  {
    method: 'POST',
    path: '/logout',
    options: {
      tags: ['api', 'users'],
      description: 'Logs out a user.',
      notes: 'Blacklists the JWT passed in the headers, and informs the frontend to delete it from local storage.',
      response: {
        failAction: failActionResponse,
        status: {
          200: logoutResponse.success,
          401: logoutResponse.unauthorized,
        },
      },
    },
    handler: async (request, h) => {
      try {
        const token = request.auth.artifacts.token;
        await blacklistToken(token);
        return h.response({ message: 'Logged out successfully' }).code(200);
      } catch (error) {
        console.error('Logout error:', error);
        return Boom.internal('Internal server error');
      }
    },
  },
  {
    method: 'GET',
    path: '/me',
    options: {
      tags: ['api', 'users'],
      description: 'Returns the details of the authenticated user.',
      response: {
        failAction: failActionResponse,
        status: {
          200: meGet.success,
          401: meGet.unauthorized,
        },
      },
    },
    handler: async (request, h) => {
      const userId = request.auth.credentials.id;
      try {
        const existingUser = await knex('User').where({ id: userId }).first().select(['id', 'name', 'email']);
        return h.response({ user: existingUser }).code(200);
      } catch (error) {
        console.error('Error in /me handler:', error); // Log the specific error
        return Boom.internal('Internal Server Error');
      }
    },
  },
  {
    method: 'PATCH',
    path: '/me',
    options: {
      tags: ['api', 'users'],
      description: 'Changes user details.',
      validate: {
        failAction: failActionPayload,
        payload: mePatch.payload,
      },
      response: {
        failAction: failActionResponse,
        status: {
          202: mePatch.success,
          400: mePatch.badRequest,
          401: mePatch.unauthorized,
          404: mePatch.notFound,
        },
      },
    },
    handler: async (request, h) => {
      const userId = request.auth.credentials.id;
      const { currentPassword, newPassword, newName } = request.payload;
      try {
        const existingUser = await knex('User').where({ id: userId }).first().select(['name', 'password']);
        if (!existingUser) {
          return Boom.notFound('User not found.');
        }
        const passwordMatch = bcrypt.compareSync(currentPassword, existingUser.password);
        console.log('db password', existingUser.password);
        if (!passwordMatch) {
          return Boom.unauthorized('Incorrect password.');
        }
        const newDetails = {};
        if (newName) {
          newDetails.name = newName;
        }
        if (newPassword) {
          if (/^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{6,})/.test(newPassword)) {
            const salt = bcrypt.genSaltSync(SALT_ROUNDS);
            newDetails.password = bcrypt.hashSync(newPassword, salt);
          } else {
            return Boom.badRequest('Password needs to be atleast 6 characters long, use one number and one special character.');
          }
        }
        await knex('User').where({ id: userId }).update(newDetails);
        return h.response({ message: 'User update successful.' }).code(202);
      } catch (error) {
        console.error(error);
        return Boom.internal('Internal Server Error');
      }
    },
  },
];

module.exports = authRoutes;
