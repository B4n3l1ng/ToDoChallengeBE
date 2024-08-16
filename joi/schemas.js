const Joi = require('joi');

// Common UUID schema
const uuid = Joi.string().length(36).example('70a134cd-66a3-42ea-8f60-cc2202ec2c71').description('Unique identifier');

// Common date schema
const date = Joi.date().example('2021-05-12T07:23:45.678Z').description('Timestamp');

// Reusable Error Response
const errorResponse = (statusCode, message, exampleMessage) =>
  Joi.object({
    statusCode: Joi.number().example(statusCode).required(),
    error: Joi.string().example(message).required(),
    message: Joi.string()
      .example(exampleMessage || `${message} message.`)
      .required(),
    attributes: Joi.any().optional(),
  });

// Specific Error Responses
const unauthorizedResponse = errorResponse(401, 'Unauthorized', 'Missing authentication').label('Unauthorized Response');
const notFoundResponse = errorResponse(404, 'Not Found', 'Task or user not found').label('Not Found Response');
const badRequestResponse = errorResponse(400, 'Bad Request', 'Invalid input or parameters').label('Bad Request Response');

// Reusable Todo Schema Parts
const todoState = Joi.string().valid('INCOMPLETE', 'COMPLETE').example('COMPLETE').description('Task state').label('Task state');
const todoDescription = Joi.string().min(1).example('Buy milk at the store.').description('Task description.');

//Todo Schema
const todo = Joi.object({
  id: uuid.required(),
  description: todoDescription.required(),
  state: todoState.required(),
  createdAt: date.required(),
  completedAt: date.allow(null).required().description('Date when the task was completed. Can be null.'),
  creatorId: uuid.required().description('Unique identifier of the user that created the task.'),
}).label('Task object');

//User Schema
const user = Joi.object({
  id: uuid.required(),
  name: Joi.string().required().example('John Smith').description("User's name."),
  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
    .example('johnsmith@gmail.com')
    .description("User's unique email."),
  password: Joi.string().required().description('Password with minimum 6 characters, 1 number, and one special character.'),
}).label('User object');

module.exports = {
  uuid,
  date,
  unauthorizedResponse,
  notFoundResponse,
  badRequestResponse,
  todoState,
  todoDescription,
  todo,
  user,
};
