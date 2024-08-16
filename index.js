require('dotenv').config();
const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const HapiSwagger = require('hapi-swagger');
const Pack = require('./package');
const inert = require('@hapi/inert');
const vision = require('@hapi/vision');
const laabr = require('laabr');
const validate = require('./controllers/users');
require('./db/index.js');

const todoRoutes = require('./routes/todo.routes');
const authRoutes = require('./routes/auth.routes');

const init = async () => {
  // create the server using Hapi with the options passed in env
  const server = Hapi.server({
    port: process.env.PORT || 5005,
    host: process.env.HOST || 'localhost',
    routes: {
      cors: {
        origin: [process.env.FRONTEND_URL], // sets up CORS to only accept responses from the URL passed in the .env
      },
    },
  });

  const swaggerOptions = {
    info: {
      title: 'ToDo API Documentation',
      version: Pack.version,
    },
    documentationPath: '/docs', // documentation with be served on /docs path
    grouping: 'tags', // groups documentation by the route tags
    tags: [
      { name: 'todos', description: 'Multiple task data' },
      { name: 'todo', description: 'Single task data' },
      { name: 'users', description: 'Authentication related data' },
    ],
  };

  await server.register([
    //registed the plugins necessary
    inert, // necessary plugin for swagger
    vision, // necessary plugin for swagger
    {
      plugin: laabr, // logger
      options: {},
    },
    {
      plugin: HapiSwagger, // swagger documentation plugin
      options: swaggerOptions,
    },
    Jwt, // JWT plugin
  ]);

  server.auth.strategy('jwt', 'jwt', {
    // JWT auth configuration
    keys: process.env.TOKEN_SECRET,
    verify: {
      aud: false, // no audiance verification
      iss: false, // no issuer verification
      sub: false, // no subject verification
      nbf: true, // not before verification enabled
      maxAgeSec: 14400, // maximum token age
      timeSkewSec: 15, // allows for 15 second difference in nbf verification
    },
    validate,
  });

  server.auth.default('jwt'); // sets JWT as the default auth strategy

  server.route({
    method: 'GET',
    path: '/',
    handler: (response, h) => {
      return h.redirect('/docs');
    },
  });
  server.route(todoRoutes); // binds the todoRoutes to the server
  server.route(authRoutes); // binds the authRoutes to the server

  await server.start(); // start the server
  console.log(`Server running on ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  // on any unhandled rejection, log the error and exit the process
  console.log(err);
  process.exit(1);
});

init();
