module.exports = {
  apps: [{
    name: "flower-app",
    script: "server.js",
    env: {
      NODE_ENV: "production",
    },
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    error_file: "logs/error.log",
    out_file: "logs/out.log"
  }]
} 