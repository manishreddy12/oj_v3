'use strict';

// When LOG_FORMAT=json (set in Docker/K8s), emit newline-delimited JSON so
// Filebeat → Logstash → Elasticsearch can parse each field individually.
// In development (plain text) the original human-readable format is used.

const JSON_MODE = process.env.LOG_FORMAT === 'json';

class Logger {
  constructor(context = 'App') {
    this.context = context;
  }

  _emit(level, message, meta) {
    if (JSON_MODE) {
      const entry = {
        timestamp: new Date().toISOString(),
        level,
        service: process.env.SERVICE_NAME || 'codeview',
        context: this.context,
        message,
        ...(meta && { meta }),
      };
      const line = JSON.stringify(entry);
      if (level === 'ERROR') {
        process.stderr.write(line + '\n');
      } else {
        process.stdout.write(line + '\n');
      }
    } else {
      const timestamp = new Date().toISOString();
      const metaStr   = meta ? ` | ${JSON.stringify(meta)}` : '';
      const line      = `[${timestamp}] [${level}] [${this.context}] ${message}${metaStr}`;
      if (level === 'ERROR') {
        console.error(line);
      } else if (level === 'WARN') {
        console.warn(line);
      } else if (level === 'DEBUG') {
        console.debug(line);
      } else {
        console.log(line);
      }
    }
  }

  info(message, meta)  { this._emit('INFO',  message, meta); }
  warn(message, meta)  { this._emit('WARN',  message, meta); }
  error(message, meta) { this._emit('ERROR', message, meta); }

  debug(message, meta) {
    if (process.env.NODE_ENV !== 'production') {
      this._emit('DEBUG', message, meta);
    }
  }
}

module.exports = Logger;
