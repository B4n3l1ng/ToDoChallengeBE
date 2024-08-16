const { todoPost, todoGet, todoDel, todoPatch } = require('../joi/validation');
const config = require('../db/config');
const knex = require('knex')(config.development);
const Boom = require('@hapi/boom');
const { failActionPayload, failActionResponse, failActionQuery, failActionParams } = require('../controllers/failAction');
const { unauthorizedResponse, notFoundResponse } = require('../joi/schemas');

const todoRoutes = [
  {
    method: 'POST',
    path: '/todos',
    options: {
      description: 'Creates a task.',
      notes: 'Creates a task item, using the information passed in the payload.',
      tags: ['api', 'todos'],
      validate: {
        // request validation
        payload: todoPost.request,
        failAction: failActionPayload,
      },
      response: {
        //response validation
        failAction: failActionResponse,
        status: {
          201: todoPost.response,
          401: todoPost.unauthorized,
          404: notFoundResponse,
        },
      },
    },
    handler: async (request, h) => {
      // extract the description from the payload and the userId from the decoded token
      const { description } = request.payload;
      const userId = request.auth.credentials.id;
      try {
        const user = await knex('User').where({ id: userId }).first(); // attempt to find the user
        if (!user) {
          return Boom.notFound('User not found'); // if user doesn't exist, return Not Found
        }
        // creates the todo object, passing the information from the payload and the userId from the token
        const newTodo = await knex('ToDo')
          .insert({ description, state: 'INCOMPLETE', createdAt: knex.fn.now(), completedAt: null, creatorId: userId })
          .returning(['id', 'description', 'state', 'createdAt', 'completedAt', 'creatorId']);
        return h.response({ newTodo: newTodo[0] }).code(201); // returns the task information and Created
      } catch (error) {
        console.log(error);
        throw Boom.internal('Internal server error'); // return Internal Server Error if there is an error
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
        // request validation
        query: todoGet.query,
        failAction: failActionQuery,
      },
      response: {
        //response validation
        failAction: failActionResponse,
        status: {
          200: todoGet.response,
          401: unauthorizedResponse,
        },
      },
    },
    handler: async (request, h) => {
      // extracts the query information and the userId
      const { filter = 'ALL', orderBy = 'CREATED_AT' } = request.query;
      const userId = request.auth.credentials.id;
      const databaseFilter = {}; // empty object to save the query
      //change the state property depending on the query
      if (filter === 'INCOMPLETE') {
        databaseFilter.state = 'INCOMPLETE';
      } else if (filter === 'COMPLETE') {
        databaseFilter.state = 'COMPLETE';
      }
      try {
        const existingUser = await knex('User').where({ id: userId }).first(); // attempt to find the user from the token
        if (!existingUser) {
          return Boom.notFound('User not found.'); //returns Not Found if the user doesn't exist
        } else {
          databaseFilter.creatorId = userId; // if it exists, adds the creatorId to the filter
        }
        // queries the database according to the query and the user, changing the order of the tasks depending on the orderBy property of the request query
        const todos = await knex('ToDo')
          .where(databaseFilter)
          .orderBy(orderBy === 'DESCRIPTION' ? 'description' : orderBy === 'COMPLETED_AT' ? 'completedAt' : 'createdAt', 'asc');

        return h.response({ todos }).code(200); // returns the array of tasks of the user and OK
      } catch (error) {
        console.log(error);
        throw Boom.internal('Internal server erroror'); // return Internal Server Error if there is an error
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
        // request validation
        params: todoDel.parameters,
        failAction: failActionParams,
      },
      response: {
        // response validation
        failAction: failActionResponse,
        status: {
          204: todoDel.response.success,
          401: todoDel.response.unauthorized,
          404: todoDel.response.notFound,
        },
      },
    },
    handler: async (request, h) => {
      // extracts the task id and the user id from the params and the decoded token
      const { id } = request.params;
      const userId = request.auth.credentials.id;
      try {
        // checks if an user with that id exists, if it doesn't, return Not Found
        const existingUser = await knex('User').where({ id: userId }).first();
        if (!existingUser) {
          return Boom.notFound('User not found');
        }
        // Check if the task with that id exists, if it does, delete it and return No Content
        const taskExists = await knex('ToDo').where({ id, creatorId: userId }).first();
        if (taskExists) {
          await knex('ToDo').where('id', id).first().del();
          return h.response().code(204);
        } else {
          return Boom.notFound('Task not found'); // if it doesn't exist, return Not Found
        }
      } catch (error) {
        console.log(error);
        throw Boom.internal('Internal server error'); // return Internal Server Error if there is an error
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
        // request validation
        payload: todoPatch.body,
        params: todoPatch.parameters,
        failAction: failActionPayload,
      },
      response: {
        // response validation
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
      // extract task id from the parameters, payload from the request and userId from the decoded token
      const { id } = request.params;
      const { payload } = request;
      const userId = request.auth.credentials.id;
      try {
        // check if an user with the userId exists, if it doesn't, return Not Found
        const existingUser = await knex('User').where({ id: userId }).first();
        if (!existingUser) {
          return Boom.notFound('User not found');
        }
        // check if a task with that id and userId as creatorId exists
        const taskExists = await knex('ToDo').where({ id, creatorId: userId }).first();
        if (taskExists) {
          // if it does exist, and the state is already complete and description exists, returns Bad Request
          if (taskExists.state === 'COMPLETE' && payload.description) {
            return Boom.badRequest(`You can't change the description of a completed task.`);
          }
          // update the task with the information passed in the payload
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
          return h.response({ updatedTask }).code(202); // return the updated task and Accepted
        } else {
          return Boom.notFound('Task not found.'); // if task doesn't exist, return Not Found
        }
      } catch (error) {
        console.log(error);
        throw Boom.internal('Internal server error'); // return Internal Server Error if there is an error
      }
    },
  },
];

module.exports = todoRoutes;
