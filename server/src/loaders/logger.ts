import winston from 'winston';
import { ConsoleTransportInstance } from 'winston/lib/winston/transports';

const transports: ConsoleTransportInstance[] = [];

if (!process.env.NODE_ENV || process.env.NODE_ENV == 'development') { transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.cli(),
        winston.format.splat(),
      )
    })
  )
} else {
  transports.push(
    new winston.transports.Console()
  )
}

const LoggerInstance = winston.createLogger({
  level: process.env.LOG_LEVEL || 'silly',
  levels: winston.config.npm.levels,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports
});

export default LoggerInstance;
