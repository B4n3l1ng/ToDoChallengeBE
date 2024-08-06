const Joi = require('joi');

const todoState = Joi.string().valid('INCOMPLETE', 'COMPLETE').example('COMPLETE').description('Task state.').label('Task state');
const todoDescription = Joi.string().min(1).example('Buy milk at the store.').description('Task description.');

const todo = Joi.object({
  id: Joi.string().required().min(36).max(36).example('70a134cd-66a3-42ea-8f60-cc2202ec2c71').description('Unique identifier for Task entry.'),
  description: todoDescription.required(),
  state: todoState.required(),
  createdAt: Joi.date().required().example('2021-05-12T07:23:45.678Z').description('Date when the task was created.'),
  completedAt: Joi.date().allow(null).required().example('2021-05-13T11:23:45.678Z').description('Date when the task was completed. Can be null.'),
}).label('Task object');

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
  }).label('Get tasks success response'),
};

const todoPost = {
  request: Joi.object({
    description: Joi.string().min(1).required().example('Buy milk at the store.').description('Task description.'),
  }).label('Task creation payload'),
  response: Joi.object({
    newTodo: todo,
  }).label('Task creation success response'),
};

const todoDel = {
  parameters: Joi.object({
    id: Joi.string().required().min(36).max(36).example('db28b3f7-13c2-4333-9c13-e6bb1bc5d107').description('Unique identifier of a task to delete.'),
  }),
  success: undefined,
};

const todoPatch = {
  body: Joi.object({
    state: todoState,
    description: todoDescription,
  })
    .or('state', 'description')
    .label('Task Patch request body'),
  response: todo,
};

module.exports = { todoPost, todoGet, todoDel, todoPatch };
