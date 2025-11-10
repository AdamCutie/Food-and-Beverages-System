// This file MUST be in CommonJS format
const path = require('path');

// This loads your .env variables BEFORE the app starts
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

module.exports = {
  apps: [
    {
      name: 'food-app-backend',
      script: 'src/server.js', // Your main app file
      interpreter: process.env.NVM_BIN + '/node', // Use the correct NVM node path
      env: {
        ...process.env, // Pass all loaded .env variables to your app
      },
    },
  ],
};
