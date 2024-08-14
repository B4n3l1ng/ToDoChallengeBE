const { todoPost, todoGet, todoDel, todoPatch } = require('../joi/validation');
const config = require('../db/config');
const knex = require('knex')(config.development);
const Boom = require('@hapi/boom');
const { failActionPayload, failActionResponse, failActionQuery, failActionParams } = require('../controllers/failAction');
const { unauthorizedResponse } = require('../joi/schemas');

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
        failAction: failActionPayload,
      },
      response: {
        failAction: failActionResponse,
        status: {
          201: todoPost.response,
          401: todoPost.unauthorized,
        },
      },
    },
    handler: async (request, h) => {
      const { description } = request.payload;
      const userId = request.auth.credentials.id;
      try {
        const user = await knex('User').where({ id: userId }).first();
        if (!user) {
          return Boom.unauthorized('You must be logged in.');
        }
        const newTodo = await knex('ToDo')
          .insert({ description, state: 'INCOMPLETE', createdAt: knex.fn.now(), completedAt: null, creatorId: userId })
          .returning(['id', 'description', 'state', 'createdAt', 'completedAt', 'creatorId']);
        return h.response({ newTodo: newTodo[0] }).code(201);
      } catch (error) {
        console.log(error);
        throw Boom.internal('Internal server error');
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
        failAction: failActionQuery,
      },
      response: {
        failAction: failActionResponse,
        status: {
          200: todoGet.response,
          401: unauthorizedResponse,
        },
      },
    },
    handler: async (request, h) => {
      const { filter = 'ALL', orderBy = 'CREATED_AT' } = request.query;
      const userId = request.auth.credentials.id;
      const databaseFilter = {};
      if (filter === 'INCOMPLETE') {
        databaseFilter.state = 'INCOMPLETE';
      } else if (filter === 'COMPLETE') {
        databaseFilter.state = 'COMPLETE';
      }
      try {
        const existingUser = await knex('User').where({ id: userId }).first();
        console.log('USER', existingUser);
        if (!existingUser) {
          return Boom.unauthorized('You must be logged in.');
        } else {
          databaseFilter.creatorId = userId;
        }
        const todos = await knex('ToDo')
          .where(databaseFilter)
          .orderBy(orderBy === 'DESCRIPTION' ? 'description' : orderBy === 'COMPLETED_AT' ? 'completedAt' : 'createdAt', 'asc');
        console.log({ todos });
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
        failAction: failActionParams,
      },
      response: {
        failAction: failActionResponse,
        status: {
          204: todoDel.response.success,
          401: todoDel.response.unauthorized,
          404: todoDel.response.notFound,
        },
      },
    },
    handler: async (request, h) => {
      const { id } = request.params;
      const userId = request.auth.credentials.id;
      try {
        const existingUser = await knex('User').where({ id: userId }).first();
        if (!existingUser) {
          return Boom.unauthorized('You must be logged in.');
        }
        const taskExists = await knex('ToDo').where({ id, creatorId: userId }).first();
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
        failAction: failActionPayload,
      },
      response: {
        failAction: failActionResponse,
        status: {
          202: todoPatch.response.success,
          400: todoPatch.response.badRequest,
          401: todoPatch.response.unauthorized,
          404: todoPatch.response.notFound,
        },
      },
    },

    handler: async (request, h) => {
      const { id } = request.params;
      const { payload } = request;
      const userId = request.auth.credentials.id;
      try {
        const existingUser = await knex('User').where({ id: userId }).first();
        if (!existingUser) {
          return Boom.unauthorized('You must be logged in.');
        }
        const taskExists = await knex('ToDo').where({ id, creatorId: userId }).first();
        if (taskExists) {
          if (taskExists.state === 'COMPLETE' && payload.description) {
            return Boom.badRequest(`You can't change the description of a completed task.`);
          }
          const [updatedTask] = await knex('ToDo')
            .where({ id, creatorId: userId })
            .first()
            .update({ ...payload, completedAt: payload.state === 'COMPLETE' ? knex.fn.now() : null }, [
              'id',
              'state',
              'description',
              'creatorId',
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
