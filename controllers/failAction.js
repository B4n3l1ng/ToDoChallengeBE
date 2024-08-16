const Boom = require('@hapi/boom');

// failAction function for an invalid request payload
function failActionPayload(response, h, error) {
  console.error('Payload validation failed:', error.message);
  throw Boom.badRequest(`Invalid request payload: ${error.message}`);
}

// failAction function for an invalid response
function failActionResponse(response, h, error) {
  console.error('Response validation failed:', error.message);
  throw Boom.internal('Internal Server Error');
}

// failAction function for invalid request query
function failActionQuery(response, h, error) {
  console.error('Query validation failed:', error.message);
  throw Boom.internal(`Invalid request payload: ${error.message}`);
}

// faiAction function for invalid request parameters
function failActionParams(response, h, error) {
  console.error('Parameters validation failed:', error.message);
  throw Boom.internal(`Invalid request parameters: ${error.message}`);
}

module.exports = { failActionPayload, failActionResponse, failActionQuery, failActionParams };
