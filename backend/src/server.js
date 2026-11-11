const { port } = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

const start = async () => {
  await connectDB();
  app.listen(port, () => console.log(`API listening on port ${port}`));
};

start().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
