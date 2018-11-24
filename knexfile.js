'use strict';
require('dotenv').config();
module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL || process.env.LOCALHOST_DATABASE_URL,
    debug: true, // http://knexjs.org/#Installation-debug
    pool: { min: 1, max: 2 }
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL
  },
  test: {
    client: 'pg',
    connection: process.env.TEST_DATABASE_URL || process.env.LOCALHOST_TEST_DATABASE_URL,
    pool: { min: 1, max: 2 }
  }
};
