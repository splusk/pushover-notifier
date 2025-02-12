import { Logging } from '@google-cloud/logging';

const logging = new Logging();
const logger = logging.log('pushover-notifier-logger');

export const logToCloud = (message, severity) => {
  if (logger) {
    const metadata = { resource: { type: 'global' }, severity };
    const entry = logger.entry(metadata, message);
    logger.write(entry);
  } else {
    console.log(message);
  }
};
