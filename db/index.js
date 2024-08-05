const config = require('./config');
const knex = require('knex');

async function createTables(db) {
  try {
    const toDoTableExists = await db.schema.hasTable('ToDo');
    if (!toDoTableExists) {
      await db.schema.createTable('ToDo', (t) => {
        t.uuid('id').primary().defaultTo(db.raw('uuid_generate_v4()'));
        t.string('description');
        t.enu('state', ['INCOMPLETE', 'COMPLETE']).defaultTo('INCOMPLETE');
        t.timestamp('createdAt').defaultTo(db.fn.now());
        t.timestamp('completedAt').nullable();
      });
      console.log('Table created successfully');
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
