// import mongoose from 'mongoose';

// export const HealthController = {
//   ping: async (req, res) => {
//     const dbReady = mongoose.connection.readyState === 1;
//     res.json({
//       success: true,
//       data: {
//         server: 'online',
//         database: dbReady ? 'healthy' : 'disconnected',
//         time: new Date().toISOString(),
//       },
//     });
//   },
// };

import mongoose from 'mongoose';

export const HealthController = {
  ping: async (req, res) => {
    let dbStatus = 'Unknown';

    switch (mongoose.connection.readyState) {
      case 0:
        dbStatus = 'Database is not connected ❌';
        break;
      case 1:
        dbStatus = 'Database connection is healthy ✅';
        break;
      case 2:
        dbStatus = 'Database is connecting... ⏳';
        break;
      case 3:
        dbStatus = 'Database is disconnecting... ⚠️';
        break;
      default:
        dbStatus = 'Database status is unclear ⚡';
    }

    res.json({
      success: true,
      message: 'Server is running and responding 🚀',
      data: {
        server: 'online',
        database: dbStatus,
        checkedAt: new Date().toISOString(),
      },
    });
  },
};
