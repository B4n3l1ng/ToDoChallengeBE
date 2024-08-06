require('dotenv').config();
const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');
const Pack = require('./package');
const laabr = require('laabr');
require('./db/index.js');

const todoRoutes = require('./routes/todo.routes');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 5005,
    host: process.env.HOST || 'localhost',
    routes: {
      cors: {
        origin: [process.env.FRONTEND_URL],
      },
    },
  });

  const swaggerOptions = {
    info: {
      title: 'ToDo API Documentation',
      version: Pack.version,
    },
    documentationPath: '/docs',
    grouping: 'tags',
    tags: [
      { name: 'todos', description: 'Multiple task data' },
      { name: 'todo', description: 'Single task data' },
    ],
  };

  await server.register([
    {
      plugin: laabr,
      options: {},
    },
    Inert,
    Vision,
    {
      plugin: HapiSwagger,
      options: swaggerOptions,
    },
  ]);

  server.route(todoRoutes);

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();
