const config = require('./config');
const knex = require('knex');

async function createTables(db) {
  // Creates the necessary Tables in the database
  try {
    const toDoTableExists = await db.schema.hasTable('ToDo'); // Check if the tables exist already
    const userTableExists = await db.schema.hasTable('User');
    if (!userTableExists) {
      // If they don't, create them
      await db.schema.createTable('User', (t) => {
        t.uuid('id').primary().defaultTo(db.raw('uuid_generate_v4()')); // id field, unique and defaults to uuid_v4
        t.string('email').unique().notNullable(); // email string, unique, required
        t.string('password').notNullable(); // encrypted password, string, required
        t.string('name').notNullable(); // user's name for display purposes, required
      });
      console.log('User table created successfully.'); // Feedback to know when User table is created
    }
    if (!toDoTableExists) {
      await db.schema.createTable('ToDo', (t) => {
        t.uuid('id').primary().defaultTo(db.raw('uuid_generate_v4()')); // id field, unique and defaults to uuid_v4
        t.string('description').notNullable(); // description field, string, required
        t.enu('state', ['INCOMPLETE', 'COMPLETE']).defaultTo('INCOMPLETE').notNullable(); // state field, either "COMPLETE" or "INCOMPLETE", required
        t.timestamp('createdAt').defaultTo(db.fn.now()).notNullable(); // createdAt field, timestamp of when the ToDo object was created, required
        t.timestamp('completedAt').nullable(); // completedAt field, timestamp of when the task was complete, can be null if task is Incomplete
        t.uuid('creatorId').references('id').inTable('User').onDelete('CASCADE').onUpdate('CASCADE').notNullable(); //creatorId field, references the id of the user who created it
      });
      console.log('Todo table created successfully.');
    }
  } catch (error) {
    throw error; // if any error occurs during table creation, throw it
  }
}

async function createConnection() {
  // creates the connection to the database
  let db;
  try {
    db = knex(config.development); // establishes connection with the development configuration
    await db.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'); // adds the uuid extension to the database functions
    await createTables(db); // calls the function above to create the necessary Tables
  } catch (error) {
    // in case of error with connection or table creation
    console.log('Error creating tables:', error.message);
    if (error.message.includes('database "todochallenge" does not exist')) {
      // check if the error was because the database doesn't exist, and switches the configuration to admin, to create said database and then create the necessary tables
      const adminDB = knex(config.admin);
      try {
        await adminDB.raw('CREATE DATABASE todochallenge');
        console.log('Database created successfully');

        // Reconnect to the newly created database
        db = knex(config.development);
        await db.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
        await createTables(db);
      } catch (createError) {
        console.log('Error creating database:', createError.message);
      } finally {
        await adminDB.destroy(); // destroy the admin connection to the database once it's been created
      }
    }
  } finally {
    if (db) {
      await db.destroy(); // destroy the normal connection, if it existed, once the tables have been created
    }
  }
}

createConnection();
