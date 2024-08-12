const Boom = require('@hapi/boom');

function failActionPayload(response, h, error) {
  console.error('Payload validation failed:', error.message);
  throw Boom.badRequest(`Invalid request payload: ${error.message}`);
}

function failActionResponse(response, h, error) {
  console.error('Response validation failed:', error.message);
  throw Boom.internal('Internal Server Error');
}

function failActionQuery(response, h, error) {
  console.error('Query validation failed:', error.message);
  throw Boom.internal(`Invalid request payload: ${error.message}`);
}

function failActionParams(response, h, error) {
  console.error('Parameters validation failed:', error.message);
  throw Boom.internal(`Invalid request parameters: ${error.message}`);
}

module.exports = { failActionPayload, failActionResponse, failActionQuery, failActionParams };
