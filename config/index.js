import dotenv from 'dotenv'

// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || 'development'

const envFound = dotenv.config()
if (envFound.error) {
  // This error should crash whole process

  throw new Error("⚠️  Couldn't find .env file  ⚠️")
}

export default {
  /**
   * Your favorite port
   */
  port: parseInt(process.env.PORT, 10),

  databaseHost: process.env.DB_HOST,
  databaseUser: process.env.DB_USER,
  databasePassword: process.env.DB_PASSWORD,
  database1: process.env.DB_NAME_1,
  database2: process.env.DB_NAME_2,
  database3: process.env.DB_NAME_3,

  /**
   * Your secret sauce
   */
  jwtSecret: process.env.JWT_SECRET,

  /**
   * Used by winston logger
   */
  logs: {
    level: process.env.LOG_LEVEL || 'silly',
  },
}
