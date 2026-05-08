import { createServer } from 'http';
import app from './app';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import sequelize from './config/db';
import './models'; // Load models for association
import { initSocket } from './utils/socket';

dotenv.config();

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

const startServer = async () => {
  try {
    // Connect to Database
    await connectDB();

    // Sync Models with database
    await sequelize.sync();
    console.log('Database synced successfully');

    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
