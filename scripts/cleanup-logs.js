const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, '../logs');
const MAX_AGE_DAYS = 30;

function cleanupOldLogs() {
  const now = Date.now();
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

  fs.readdir(LOGS_DIR, (err, files) => {
    if (err) {
      console.error('Error reading logs directory:', err);
      return;
    }

    files.forEach(file => {
      const filePath = path.join(LOGS_DIR, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`Error getting stats for ${file}:`, err);
          return;
        }

        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlink(filePath, err => {
            if (err) {
              console.error(`Error deleting ${file}:`, err);
            } else {
              console.log(`Deleted old log file: ${file}`);
            }
          });
        }
      });
    });
  });
}

if (require.main === module) {
  cleanupOldLogs();
}

module.exports = cleanupOldLogs; 