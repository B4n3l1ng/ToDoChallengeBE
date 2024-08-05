const Joi = require('joi');

const newTodo = Joi.object({
  id: Joi.string().required().example('70a134cd-66a3-42ea-8f60-cc2202ec2c71').description('Unique identifier for Task entry.'),
  description: Joi.string().min(1).required().example('Buy milk at the store.').description('Task description.'),
  state: Joi.string().required().valid('INCOMPLETE', 'COMPLETE').example('COMPLETE').description('Task state').label('State Property Possibilities'),
  createdAt: Joi.date().required().example('2021-05-12T07:23:45.678Z)').description('Date when the task was created.'),
  completedAt: Joi.date().allow(null).required().example('2021-05-13T11:23:45.678Z').description('Date when the task was completed. Can be null.'),
}).label('Task Object');

const todoPostRequest = Joi.object({
  description: Joi.string().min(1).required().example('Buy milk at the store.').description('Task description.'),
}).label('Task Creation Payload');

const todoPostResponses = {
  success: Joi.object({
    newTodo,
  }).label('Task Creation Success Response'),
  failure: Joi.object({
    message: Joi.string().required().example('Internal Server Error').description('Message with failure reason.'),
  }).label('Task Creation Failure Response'),
};

module.exports = { todoPostRequest, todoPostResponses };
