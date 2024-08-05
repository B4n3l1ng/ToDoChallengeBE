require('dotenv').config();
const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');
const Pack = require('./package');
require('./db/index.js');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 5005,
    host: process.env.HOST || 'localhost',
  });

  const swaggerOptions = {
    info: {
      title: 'ToDo API Documentation',
      version: Pack.version,
    },
    documentationPath: '/docs',
  };

  await server.register([
    Inert,
    Vision,
    {
      plugin: HapiSwagger,
      options: swaggerOptions,
    },
  ]);

  server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      return h.response({ message: 'Hello World' }).code(200);
    },
  });

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();
