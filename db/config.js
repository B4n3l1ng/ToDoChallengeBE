module.exports = {
  development: {
    // development configuration for database.
    client: 'pg',
    connection: {
      connectionString: process.env.DB_URI,
    },
  },
  admin: {
    // admin configuration for creation of Database and Tables
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
  },
};
