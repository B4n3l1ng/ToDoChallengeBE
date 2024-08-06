const { todoPost, todoGet, todoDel } = require('../joi/schemas');
const config = require('../db/config');
const knex = require('knex')(config.development);

const todoRoutes = [
  {
    method: 'POST',
    path: '/todos',
    options: {
      description: 'Creates a task.',
      notes: 'Creates a task item, using the information passed in the payload.',
      tags: ['api', 'todos'],
      validate: {
        payload: todoPost.request,
      },
      response: {
        failAction: 'log',
        status: {
          201: todoPost.response.success,
          500: todoPost.response.failure,
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
  {
    method: 'GET',
    path: '/todos',
    options: {
      description: 'Gets an array of task items.',
      notes: 'Gets an array of task items, depending on the query fields passed.',
      tags: ['api', 'todos'],
      validate: {
        query: todoGet.query,
      },
      response: {
        failAction: 'log',
        status: {
          200: todoGet.response.success,
          500: todoGet.response.failure,
        },
      },
    },
    handler: async (request, h) => {
      const { filter = 'ALL', orderBy = 'CREATED_AT' } = request.query;
      const databaseFilter = {};
      if (filter === 'INCOMPLETE') {
        databaseFilter.state = 'INCOMPLETE';
      } else if (filter === 'COMPLETE') {
        databaseFilter.state = 'COMPLETE';
      }
      try {
        const todos = await knex
          .select()
          .from('ToDo')
          .where(databaseFilter)
          .orderBy(orderBy === 'CREATED_AT' ? 'createdAt' : orderBy === 'COMPLETED_AT' ? 'completedAt' : 'description', 'asc');
        return h.response({ todos }).code(200);
      } catch (error) {
        console.log(error);
        return h.response({ message: 'Internal Server Error' + error.message }).code(505);
      }
    },
  },
  {
    method: 'DELETE',
    path: '/todo/{id}',
    options: {
      description: 'Deletes a task.',
      notes: 'Accepts a parameter, the id of the task, and deletes it from the database.',
      tags: ['api', 'todo'],
      validate: {
        params: todoDel.parameters,
      },
      response: {
        failAction: 'log',
        status: {
          204: todoDel.response.success,
          404: todoDel.response.notFound,
          500: todoDel.response.failure,
        },
      },
    },
    handler: async (request, h) => {
      const { id } = request.params;
      try {
        const taskExists = await knex('ToDo').where('id', id).first();
        if (taskExists) {
          await knex('ToDo').where('id', id).first().del();
          return h.response().code(204);
        } else {
          return h.response({ message: 'Task not found' }).code(404);
        }
      } catch (error) {
        console.log(error);
        return h.response({ message: 'Internal Server Error' + error.message }).code(500);
      }
    },
  },
];

module.exports = todoRoutes;
