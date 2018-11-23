'use strict';
const { _DEV_STRING, _TEST_STRING } = require('./private.js');
module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL || _DEV_STRING,
    debug: true, // http://knexjs.org/#Installation-debug
    pool: { min: 1, max: 2 }
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL
  },
  test: {
    client: 'pg',
    connection: process.env.TEST_DATABASE_URL || _TEST_STRING,
    pool: { min: 1, max: 2 }
  }
};
