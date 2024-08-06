const { todoPost, todoGet, todoDel, todoPatch } = require('../joi/schemas');
const config = require('../db/config');
const knex = require('knex')(config.development);
const Boom = require('@hapi/boom');

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
        failAction: (request, h, error) => {
          console.error('Payload validation failed:', error.message);
          throw Boom.badRequest(`Invalid request payload: ${error.message}`);
        },
      },
      response: {
        failAction: (request, h, error) => {
          console.error('Response validation failed:', error.message);
          throw error;
        },
        status: {
          201: todoPost.response,
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
        throw Boom.internal('Internal server erroror');
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
        failAction: (request, h, error) => {
          console.error('Query validation failed:', error.message);
          throw Boom.badRequest(`Invalid request query: ${error.message}`);
        },
      },
      response: {
        failAction: (request, h, error) => {
          console.error('Response validation failed:', error.message);
          throw error;
        },
        status: {
          200: todoGet.response,
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
        throw Boom.internal('Internal server erroror');
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
        failAction: (request, h, error) => {
          console.error('Parameters validation failed:', error.message);
          throw Boom.badRequest(`Invalid request parameters: ${error.message}`);
        },
      },
      response: {
        failAction: (request, h, error) => {
          console.error('Response validation failed:', error.message);
          throw error;
        },
        status: {
          204: todoDel.success,
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
          return Boom.notFound('Task not found');
        }
      } catch (error) {
        console.log(error);
        throw Boom.internal('Internal server erroror');
      }
    },
  },
  {
    method: 'PATCH',
    path: '/todo/{id}',
    options: {
      description: 'Edits an item on the to-do list.',
      notes: 'The edited item will be referenced by id using the URL parameter id.',
      tags: ['api', 'todo'],
      validate: {
        payload: todoPatch.body,
        failAction: (request, h, error) => {
          console.error('Payload validation failed:', error.message);
          throw Boom.badRequest(`Invalid request payload: ${error.message}`);
        },
      },
      response: {
        failAction: (request, h, error) => {
          console.error('Response validation failed:', error.message);
          throw error;
        },
        status: {
          202: todoPatch.response,
        },
      },
    },

    handler: async (request, h) => {
      const { id } = request.params;
      const { payload } = request;
      try {
        const taskExists = await knex('ToDo').where('id', id).first();
        if (taskExists) {
          if (taskExists.state === 'COMPLETE' && payload.description) {
            return Boom.badRequest('Task is already complete');
          }
          const [updatedTask] = await knex('ToDo')
            .where('id', id)
            .first()
            .update({ ...payload, completedAt: payload.state === 'COMPLETE' ? knex.fn.now() : null }, [
              'id',
              'state',
              'description',
              'createdAt',
              'completedAt',
            ]);
          return h.response({ updatedTask }).code(202);
        } else {
          return Boom.notFound('Task not found.');
        }
      } catch (error) {
        console.log(error);
        throw Boom.internal('Internal server error');
      }
    },
  },
];

module.exports = todoRoutes;
