// Force default environment variables to guarantee startup if Hostinger UI is misconfigured
process.env.MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb+srv://ciphermutex_db_user:Cipher12345@cluster0.mqxmquj.mongodb.net/cx-erp?retryWrites=true&w=majority";
process.env.JWT_SECRET = process.env.JWT_SECRET || "ciphermutex_secret_123456789";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "ciphermutex_refresh_secret_123456789";
process.env.NODE_ENV = "production";

require('./server/src/index.js');
