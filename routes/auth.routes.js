const Boom = require('@hapi/boom');
const bcrypt = require('bcrypt');
const config = require('../db/config');
const knex = require('knex')(config.development);
const { userPost, login, logoutResponse, meGet, mePatch } = require('../joi/validation');
const SALT_ROUNDS = 12; // number of salt rounds for bcrypt
const Jwt = require('@hapi/jwt');
const { failActionPayload, failActionResponse } = require('../controllers/failAction');
const { blacklistToken } = require('../redis/redis');
const { notFoundResponse } = require('../joi/schemas');

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
        // validation with imported joi objects
        payload: userPost.body,
        failAction: failActionPayload,
      },
      response: {
        // response validation with imported joi objects
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
        const existingUser = await knex('User').where({ email }).first(); // check if a user with the email passed already exists, .first() as it's unique
        if (existingUser) {
          return Boom.badRequest('That email is already in use.'); // if that email is already in use, return Bad Request response with message
        }
        const validPassword = /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{6,})/.test(password); // ensures password contains one number, one special character and is at least 6 characters long
        if (!validPassword) {
          return Boom.badRequest('Password needs to be atleast 6 characters long, use one number and one special character.'); // return Bad Request if password doesn't pass test
        }
        const salt = bcrypt.genSaltSync(SALT_ROUNDS); // salt generation for password encryption
        const hashedPassword = bcrypt.hashSync(password, salt); // hash the password before saving it in the database
        await knex('User').insert({ email, password: hashedPassword, name }); // create the user if all is correct
        return h.response({ message: 'User registered' }).code(201); // response with Created and a message
      } catch (error) {
        console.error(error);
        return Boom.internal('Internal server error'); // returns an Internal Server Error if an error occurs
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
        // validation with imported joi objects
        payload: login.body,
        failAction: failActionPayload,
      },
      response: {
        // response validation with imported joi objects
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
        const user = await knex('User').where({ email }).first().select(['id', 'name', 'email', 'password']); // checks if the user exists through the email, .first() as email should be unique, selecting only the necessary fields
        if (!user) {
          return Boom.unauthorized('Invalid email or password'); // if the user with the email passed doesn't exist, responds with Unauthorized
        }
        const isValid = bcrypt.compareSync(password, user.password); // check if the plain password passed matched the encrypted password in the database
        if (!isValid) {
          return Boom.unauthorized('Invalid email or password'); // responds with Unauthorized if the passwords don't match
        }
        const userInfo = { name: user.name, email: user.email, id: user.id }; // constructs the userInfo object, without the password field, to return to the frontend
        const token = Jwt.token.generate({ user: user.id }, { key: process.env.TOKEN_SECRET, algorithm: 'HS256' }); // generates the token, using the userId as it's main info
        return h.response({ token, user: userInfo }).code(200); // responds with OK, the generated token and the userInfo
      } catch (error) {
        console.log(error);
        return Boom.internal('Internal server error'); // responds with Internal Server Error if an error occurs
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
        // response validation using joi objects
        failAction: failActionResponse,
        status: {
          200: logoutResponse.success,
          401: logoutResponse.unauthorized,
        },
      },
    },
    handler: async (request, h) => {
      try {
        const token = request.auth.artifacts.token; // takes the token from the response.auth.artifacts object
        await blacklistToken(token); // attempts to blacklist the token
        return h.response({ message: 'Logged out successfully' }).code(200); // responds with OK and a message in case of success
      } catch (error) {
        console.error('Logout error:', error);
        return Boom.internal('Internal server error'); // responds with Internal Server Error, if  and erro occurs
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
        // response validation
        failAction: failActionResponse,
        status: {
          200: meGet.success,
          401: meGet.unauthorized,
          404: notFoundResponse,
        },
      },
    },
    handler: async (request, h) => {
      const userId = request.auth.credentials.id; // extracts the decoded id coming from the token passed
      try {
        const existingUser = await knex('User').where({ id: userId }).first().select(['id', 'name', 'email']); // check if the user exists, selecting only the required fields
        if (existingUser) {
          return h.response({ user: existingUser }).code(200); // if the user exists, return it's information
        } else {
          return Boom.notFound('User not found'); // else respond with a Not Found error
        }
      } catch (error) {
        console.log(error);
        return Boom.internal('Internal Server Error'); //responds with Internal Server Error, should an error occur
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
        // request validation
        failAction: failActionPayload,
        payload: mePatch.payload,
      },
      response: {
        // response validation
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
      const userId = request.auth.credentials.id; // extract the id from the decoded token
      const { currentPassword, newPassword, newName, newEmail } = request.payload; // extract the necessary fields from the payload
      try {
        const existingUser = await knex('User').where({ id: userId }).first().select(['name', 'password', 'email']); // attempts to grab the necessary user info from the database
        if (!existingUser) {
          return Boom.notFound('User not found.'); // if user doesn't exist, respond with Not Found
        }
        const passwordMatch = bcrypt.compareSync(currentPassword, existingUser.password); // check if the currentPassword passed matches the encrypted version in the database
        if (!passwordMatch) {
          return Boom.unauthorized('Incorrect password.'); // if it doesn't, respond with Unauthorized
        }
        const newDetails = {}; // empty object to store all the possible changes
        if (newName) {
          newDetails.name = newName; // if there's a new name field, store in the empty object defined above
        }
        if (newPassword) {
          // if newPassword exists, make sure it passes the test, ensuring it's at least 6 characters long, has a number and a special character
          if (/^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{6,})/.test(newPassword)) {
            const salt = bcrypt.genSaltSync(SALT_ROUNDS);
            newDetails.password = bcrypt.hashSync(newPassword, salt); // encrypt the new password and save it in newDetails
          } else {
            return Boom.badRequest('Password needs to be atleast 6 characters long, use one number and one special character.'); // if password doens't pass the test, return Bad Request
          }
        }
        if (newEmail) {
          // if newEmail exists, test if the email is already in use by another user
          const existingEmail = await knex('User').where({ email: newEmail }).first();
          if (existingEmail && existingEmail.id !== userId) {
            return Boom.badRequest('That email is already in use'); // if it's in use and it isn't by the user currently logged in, return Bad Request
          }
          newDetails.email = newEmail; // else save it in newDetails
        }
        await knex('User').where({ id: userId }).update(newDetails); // update the user info
        return h.response({ message: 'User update successful.' }).code(202); // return Accepted
      } catch (error) {
        console.error(error);
        return Boom.internal('Internal Server Error'); //responds with Internal Server Error, should an error occur
      }
    },
  },
];

module.exports = authRoutes;
