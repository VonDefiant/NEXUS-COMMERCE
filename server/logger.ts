import winston from 'winston';
import 'winston-daily-rotate-file';

// Configuración de Rotación Diaria de Logs (crea un archivo nuevo cada día, y mantiene los de los últimos 14 días)
const fileTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/nexus-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d' // Borra logs más viejos que 14 días
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'nexus-core' },
  transports: [
    fileTransport,
    // En desarrollo o en Railway también queremos ver los logs en la terminal
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ level, message, timestamp, stack }) => {
            if (stack) {
              return `${timestamp} ${level}: ${message}\n${stack}`;
            }
            return `${timestamp} ${level}: ${message}`;
          }
        )
      )
    })
  ]
});
