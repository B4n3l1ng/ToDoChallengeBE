const config = require('./config');
const knex = require('knex');

async function createTables(db) {
  try {
    const toDoTableExists = await db.schema.hasTable('ToDo');
    const userTableExists = await db.schema.hasTable('User');
    if (!userTableExists) {
      await db.schema.createTable('User', (t) => {
        t.uuid('id').primary().defaultTo(db.raw('uuid_generate_v4()'));
        t.string('email');
        t.string('password').nullable();
        t.string('name');
        t.string('oauth_provider').nullable(), t.string('oauth_id').nullable();
      });
      console.log('User table created successfully.');
    }
    if (!toDoTableExists) {
      await db.schema.createTable('ToDo', (t) => {
        t.uuid('id').primary().defaultTo(db.raw('uuid_generate_v4()'));
        t.string('description');
        t.enu('state', ['INCOMPLETE', 'COMPLETE']).defaultTo('INCOMPLETE');
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('completedAt').nullable();
        t.uuid('creatorId').references('id').inTable('User').onDelete('CASCADE').onUpdate('CASCADE').notNullable();
      });
      console.log('Todo table created successfully.');
    }
  } catch (error) {
    throw error;
  }
}

async function createConnection() {
  let db;
  try {
    db = knex(config.development);
    await db.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await createTables(db);
  } catch (error) {
    console.log('Error creating tables:', error.message);
    if (error.message.includes('database "todochallenge" does not exist')) {
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
        await adminDB.destroy();
      }
    }
  } finally {
    if (db) {
      await db.destroy();
    }
  }
}

createConnection();
