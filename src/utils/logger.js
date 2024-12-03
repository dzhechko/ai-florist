const winston = require('winston');
require('winston-daily-rotate-file');

const DEBUG = process.env.DEBUG === 'true';

// Форматирование логов
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
  })
);

// Настройка транспортов
const transports = [
  // Ротация файлов логов
  new winston.transports.DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true
  }),
  new winston.transports.DailyRotateFile({
    filename: 'logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true
  })
];

// Добавляем вывод в консоль при DEBUG = true
if (DEBUG) {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );
}

// Создаем логгер
const logger = winston.createLogger({
  level: DEBUG ? 'debug' : 'info',
  format: logFormat,
  transports
});

// Функция для логирования с учетом DEBUG режима
const log = {
  error: (message, meta = {}) => {
    logger.error(message, meta);
  },
  warn: (message, meta = {}) => {
    logger.warn(message, meta);
  },
  info: (message, meta = {}) => {
    logger.info(message, meta);
  },
  debug: (message, meta = {}) => {
    if (DEBUG) {
      logger.debug(message, meta);
    }
  },
  http: (message, meta = {}) => {
    logger.http(message, meta);
  }
};

module.exports = log; 