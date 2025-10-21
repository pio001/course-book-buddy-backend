const serverless = require('serverless-http');
const app = require('../server.js');

const handler = serverless(app, { basePath: '/api' });

module.exports = (req, res) => handler(req, res);