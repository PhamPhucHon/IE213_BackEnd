// swagger.js
const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'IE213 Backend API',
    description: 'REST API documentation for the IE213 eyewear store backend.',
    version: '1.0.0'
  },
  host: 'localhost:5001',
  schemes: ['http'],
  consumes: ['application/json'],
  produces: ['application/json'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description: 'Nhập: Bearer &lt;token&gt;'
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  definitions: {}
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./app.js'];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log('✅ Swagger JSON generated!');
});
