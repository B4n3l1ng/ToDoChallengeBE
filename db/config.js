module.exports = {
  development: {
    client: 'pg',
    connection: {
      connectionString: process.env.DB_URI,
    },
  },
  admin: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
  },
};
