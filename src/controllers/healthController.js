import mongoose from 'mongoose';

export const HealthController = {
  ping: async (req, res) => {
    const dbReady = mongoose.connection.readyState === 1;
    res.json({
      success: true,
      data: {
        server: 'online',
        database: dbReady ? 'healthy' : 'disconnected',
        time: new Date().toISOString(),
      },
    });
  },
};