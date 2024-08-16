# ToDoChallengeBE

## Overview

**ToDoChallengeBE** is the backend service for a to-do list application, built using Node.js, Hapi, Knex, Postgresql database and Redis. It provides a RESTful API to manage tasks, allowing users to create, update, delete, and retrieve to-do items.

## Features

- **Task Management**: Create, read, update, and delete tasks.
- **Database Integration**: Using Knex.js and a Postgresql connection.
- **Redis Integration**: Caching and data storage with Redis, JWT blacklisting.
- **Validation**: Input validation with Joi.
- **Environment Config**: Easy configuration using environment variables.

## Technologies Used

- **Node.js**
- **Hapi.js**
- **Knex.js** for Postgresql database connection and query building
- **Redis** for JWT blacklisting
- **Joi** for schema validation
- **Dotenv** for environment management

## Prerequisites

- **Node.js** (v14+)
- **Redis** server installed and running or Redis Labs connection

## Setup Instructions

1. Clone the repository:

   `git clone https://github.com/B4n3l1ng/ToDoChallengeBE.git`

2. Navigate to the project directory:
   `cd ToDoChallengeBE`
3. Install the dependencies:
   `npm install`
4. Create a `.env` file in the root directory and configure it according to the env.example file.

5. Start the application in developer mode with:
   `npm run dev`

## API Endpoints

- `GET /`: Redirects to /docs.
- `GET /docs`: Swagger generated documentation.
- `POST /users`: Creates a new user.
- `POST /login`: Logs in a user.
- `POST /logout`: Logs out a user.
- `GET /me`: Gets user information.
- `PATCH /me`: Updates user information.
- `POST /todos`: Create a new to-do item.
- `GET /todos`: Retrieve all to-do items.
- `PATCH /todo/{id}`: Update a specific to-do item by ID.
- `DELETE /todo/{id}`: Delete a specific to-do item by ID.
