const Joi = require('joi');
const { uuid, unauthorizedResponse, notFoundResponse, badRequestResponse, todoState, todoDescription, todo, user } = require('./schemas'); // Importing the reusable schemas

// GET route on path /todos validation
const todoGet = {
  query: Joi.object({
    filter: Joi.string()
      .valid('INCOMPLETE', 'COMPLETE', 'ALL')
      .allow(null)
      .example('COMPLETE')
      .description('Optional state to filter tasks by, defaults to ALL.'),
    orderBy: Joi.string()
      .valid('CREATED_AT', 'COMPLETED_AT', 'DESCRIPTION', null)
      .allow(null)
      .example('COMPLETED_AT')
      .description('Optional property to order the tasks by. Defaults to COMPLETED_AT.'),
  }).label('Task query options'),
  response: Joi.object({
    todos: Joi.array().items(todo).label('Array of Tasks'),
  }).label('/todos GET success'),
};

// POST route on path /todos
const todoPost = {
  request: Joi.object({
    description: todoDescription.required(),
  }).label('/todos POST payload'),
  response: Joi.object({
    newTodo: todo,
  }).label('/todos POST success'),
  unauthorized: unauthorizedResponse,
};

//DELETE route on path /todo/{id}
const todoDel = {
  parameters: Joi.object({
    id: uuid.required().description('Unique identifier of a task to delete.'),
  }),
  response: { success: undefined, notFound: notFoundResponse, unauthorized: unauthorizedResponse },
};

//PATCH route on path /todo/{id}
const todoPatch = {
  body: Joi.object({
    state: todoState,
    description: todoDescription,
  })
    .or('state', 'description')
    .label('/todo PATCH payload'),
  response: {
    success: Joi.object({ updatedTask: todo }).label('/todo PATCH success'),
    notFound: notFoundResponse,
    badRequest: badRequestResponse,
    unauthorized: unauthorizedResponse,
  },
};

//POST Route on path /users
const userPost = {
  body: Joi.object({ email: user.extract('email'), password: user.extract('password'), name: user.extract('name') })
  .label('/users POST payload'),
  success: Joi.object({
    message: Joi.string().required().description('Success message').example('User registered'),
  }).label('/users POST success'),
  badRequest: badRequestResponse,
};

//POST route on path /login
const login = {
  body: Joi.object({
    email: user.extract('email'),
    password: user.extract('password'),
  }).label('/login POST payload'),
  success: Joi.object({
    token: Joi.string().required().description('JWT for the logged-in user.'),
    user: Joi.object({
      id: uuid.required(),
      name: Joi.string().required().example('John Smith').description("User's name."),
      email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
        .example('johnsmith@gmail.com')
        .description("User's unique email."),
    }).label('User info'),
  }).label('/login POST success'),
  unauthorized: unauthorizedResponse,
};

//POST Route on path /logout
const logoutResponse = {
  success: Joi.object({
    message: Joi.string().required().example('Logged out successfully'),
  }).label('/logout POST success'),
  unauthorized: unauthorizedResponse,
};

//GET Route on path /me
const meGet = {
  success: Joi.object({
    user: Joi.object({
      email: user.extract('email'),
      name: user.extract('name'),
      id: user.extract('id'),
    }),
  }).label('/me GET success'),
  unauthorized: unauthorizedResponse,
};

//PATCH Route on path /me
const mePatch = {
  payload: Joi.object({
    newName: user.extract('name').example('John Smith').description("User's new name."),
    newPassword: user.extract('password').description('New password.'),
    currentPassword: user.extract('password'),
  }).label('/me PATCH payload'),
  unauthorized: unauthorizedResponse,
  notFound: notFoundResponse,
  badRequest: badRequestResponse,
  success: Joi.object({
    message: Joi.string().example('User update successful.').required().description('Success message.'),
  }).label('/me PATCH success'),
};

module.exports = { todoPost, todoGet, todoDel, todoPatch, userPost, login, logoutResponse, meGet, mePatch };
