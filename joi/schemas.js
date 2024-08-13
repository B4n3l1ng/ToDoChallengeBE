const Joi = require('joi');

const todoState = Joi.string().valid('INCOMPLETE', 'COMPLETE').example('COMPLETE').description('Task state.').label('Task state');
const todoDescription = Joi.string().min(1).example('Buy milk at the store.').description('Task description.');

const todo = Joi.object({
  id: Joi.string().required().min(36).max(36).example('70a134cd-66a3-42ea-8f60-cc2202ec2c71').description('Unique identifier for Task entry.'),
  description: todoDescription.required(),
  state: todoState.required(),
  createdAt: Joi.date().required().example('2021-05-12T07:23:45.678Z').description('Date when the task was created.'),
  completedAt: Joi.date().allow(null).required().example('2021-05-13T11:23:45.678Z').description('Date when the task was completed. Can be null.'),
  creatorId: Joi.string()
    .required()
    .example('70a134cd-66a3-42ea-8f60-gc2232ec2c75')
    .description('Unique identifier of the user that created the task.'),
}).label('Task object');

const unauthorizedResponse = Joi.object({
  message: Joi.string().required().example('You must be logged in.').description('Error message.'),
}).label('Error Unauthorized response');

const todoGet = {
  query: Joi.object({
    filter: Joi.string()
      .valid('INCOMPLETE', 'COMPLETE', 'ALL')
      .allow(null)
      .example('COMPLETE')
      .description('Optional state to filter tasks by, if null defaults to ALL.'),
    orderBy: Joi.string()
      .valid('CREATED_AT', 'COMPLETED_AT', 'DESCRIPTION', null)
      .allow(null)
      .example('COMPLETED_AT')
      .description('Optional property to order the tasks in. Ascending. If null defaults to COMPLETED_AT.'),
  }).label('Todo query options'),
  response: Joi.object({
    todos: Joi.array().items(todo).label('Array of Tasks'),
  }).label('Task GET request success'),
  unauthorized: unauthorizedResponse,
};

const todoPost = {
  request: Joi.object({
    description: Joi.string().min(1).required().example('Buy milk at the store.').description('Task description.'),
  }).label('Task POST request payload'),
  response: Joi.object({
    newTodo: todo,
  }).label('Task POST request success'),
  unauthorized: unauthorizedResponse,
};

const notFoundResponse = Joi.object({
  statusCode: Joi.number().example(404).required(),
  error: Joi.string().example('Not Found').required(),
  message: Joi.string().example('Task not found.').required(),
}).label('Error Not found response');

const todoDel = {
  parameters: Joi.object({
    id: Joi.string().required().min(36).max(36).example('db28b3f7-13c2-4333-9c13-e6bb1bc5d107').description('Unique identifier of a task to delete.'),
  }),
  response: { success: undefined, notFound: notFoundResponse, unauthorized: unauthorizedResponse },
};

const todoPatch = {
  body: Joi.object({
    state: todoState,
    description: todoDescription,
  })
    .or('state', 'description')
    .label('Task PATCH request payload'),
  response: {
    success: Joi.object({ updatedTask: todo }).label('Task PATCH request success'),
    notFound: notFoundResponse,
    badRequest: Joi.object({
      statusCode: Joi.number().example(400).required(),
      error: Joi.string().example('Bad Request').required(),
      message: Joi.string().example('Task is already complete').required(),
    }).label('Error Bad request response'),
    unauthorized: unauthorizedResponse,
  },
};

const user = Joi.object({
  id: Joi.string().min(36).max(36).required().example('70a134cd-66a3-42ea-8f60-cc2202ec2c71').description('Unique identifier for User entry.'),
  name: Joi.string().required().example('John Smith').description("User's name. No need to be unique."),
  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
    .example('johnsmith@gmail.com')
    .description('Unique email provided by the user.'),
  password: Joi.string().required().description('Password provided by the user. Minimum of 6 characters, 1 number and one special character.'),
}).label('User object');

const userPost = {
  body: Joi.object({
    email: user.extract('email'),
    password: user.extract('password'),
    name: user.extract('name'),
  }).label('User POST payload'),
  success: Joi.object({
    message: Joi.string().required().description('Success message').example('User registered'),
  }).label('User POST request success'),
  badRequest: Joi.object({
    statusCode: Joi.number().example(400).required(),
    error: Joi.string().example('Bad Request').required(),
    message: Joi.string().example('Email is not a valid email.').required(),
  }).label('User POST bad request'),
};

const login = {
  body: Joi.object({
    email: user.extract('email'),
    password: user.extract('password'),
  }).label('Login POST request payload'),
  success: Joi.object({
    token: Joi.string().required().description('JSON Web Token containing the information of the logged in user.'),
  }).label('Login success'),
  unauthorized: Joi.object({
    statusCode: Joi.number().example(401).required(),
    error: Joi.string().example('Unauthorized').required(),
    message: Joi.string().example('Email or password incorrect.').required(),
  }).label('Login POST unauthorized'),
};

const logoutResponse = Joi.object({
  message: Joi.string().required().example('Logged out successfully'),
}).label('Logout response.');

const meGet = Joi.object({
  user: Joi.object({
    id: user.extract('id'),
    email: user.extract('email'),
    name: user.extract('name'),
  }),
}).label('GET me response');

module.exports = { todoPost, todoGet, todoDel, todoPatch, userPost, login, logoutResponse, meGet };
