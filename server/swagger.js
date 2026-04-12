// swagger.js
const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'My API',
    description: 'API Documentation for Text API project',
    version: '1.0.0'
  },
  host: 'localhost:5001',               // Đổi thành domain thật khi deploy
  schemes: ['http'],                    // Đổi thành 'https' nếu cần
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
const endpointsFiles = ['./server.js']; // 👈 Đường dẫn đến file chứa app Express

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log('✅ Swagger JSON generated!');
});