const { todoPostRequest, todoPostResponses } = require('../joi/schemas');
const config = require('../db/config');
const knex = require('knex')(config.development);

const todoRoutes = [
  {
    method: 'POST',
    path: '/todos',
    options: {
      description: 'Creates a todo.',
      notes: 'Creates a todo item, using the information passed in the payload.',
      tags: ['api'],
      validate: {
        payload: todoPostRequest,
      },
      response: {
        failAction: 'log',
        status: {
          201: todoPostResponses.success,
          500: todoPostResponses.failure,
        },
      },
    },
    handler: async (request, h) => {
      const { description } = request.payload;
      try {
        const newTodo = await knex('ToDo')
          .insert({ description, state: 'INCOMPLETE', createdAt: knex.fn.now(), completedAt: null })
          .returning(['id', 'description', 'state', 'createdAt', 'completedAt']);
        return h.response({ newTodo: newTodo[0] }).code(201);
      } catch (error) {
        console.log(error);
        return h.response({ message: 'Internal Server Error' + error.message }).code(505);
      }
    },
  },
];

module.exports = todoRoutes;
