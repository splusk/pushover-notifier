import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import bodyParser from 'body-parser';
import axios from 'axios';
import { DateTime } from 'luxon';
import {
  deleteTask,
  getTask,
  getAllTasks,
  scheduleNotification,
} from './scheduler.js';
import 'dotenv/config';
import { logToCloud } from './logger.js';

const apiKey = process.env.API_KEY || '';
const pushoverConfig = {
  token: process.env.PUSHOVER_TOKEN_KEY || '',
  user: process.env.PUSHOVER_USER_KEY || '',
};

const app = express();
app.use(bodyParser.json());
app.use(cors());

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

app.get('/api/_health', (_, res) => {
  res.status(200).send('OK');
});

app.post('/api/schedule', authenticate, async (req, res) => {
  const { message, htmlMessage, dueDate } = req.body;
  if (!message || !dueDate) {
    return res.status(400).json({ error: 'message and dueDate are required' });
  }
  const dueDateUtc = DateTime.fromISO(dueDate, {
    zone: 'Europe/Berlin',
  }).toUTC();
  const delaySeconds = Math.round(
    (new Date(dueDateUtc).getTime() - Date.now()) / 1000,
  );

  if (delaySeconds < 0) {
    return res.status(400).json({ error: 'Due date must be in the future' });
  }

  const response = await scheduleNotification(
    { message, htmlMessage },
    delaySeconds,
  );
  if (response && response.name && response.scheduleTime) {
    return res.status(200).json({
      message: 'Task scheduled successfully',
      taskName: response.name,
      scheduledTime: response.scheduleTime,
    });
  }
  return res
    .status(500)
    .send({ message: 'Failed to create task', error: response.details });
});

app.post('/api/send-notification', authenticate, async (req, res) => {
  try {
    const taskData = req.body;

    if (!taskData || !taskData.message) {
      return res.status(400).json({ error: 'Invalid task data' });
    }

    await sendPushoverNotification(taskData);
    res.status(200).json({ message: 'Notification sent' });
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

app.get('/api/tasks', authenticate, async (_, res) => {
  try {
    const tasks = await getAllTasks();
    return res.status(200).json(tasks);
  } catch (error) {
    logToCloud(`Failed to get all tasks: ${error}`, 'ERROR');
    return res.status(500).send('Failed to get all task');
  }
});

app.get('/api/tasks/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400).send('ID is required');
    return;
  }

  try {
    const task = await getTask(id);
    return res.status(200).json(task);
  } catch (error) {
    logToCloud(`Failed to get task: ${error}`, 'ERROR');
    return res.status(500).send('Failed to get task');
  }
});

app.delete('/api/tasks/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400).send('ID is required');
    return;
  }

  try {
    const response = await deleteTask(id);
    return res.status(200).json(response);
  } catch (error) {
    logToCloud(`Failed to delete task: ${error}`, 'ERROR');
    return res.status(500).send('Failed to delete key');
  }
});

const sendPushoverNotification = async (data) => {
  try {
    const response = await axios.post(
      'https://api.pushover.net/1/messages.json',
      {
        token: pushoverConfig.token,
        user: pushoverConfig.user,
        title: 'Task Reminder',
        message: data.htmlMessage ? data.htmlMessage : data.message,
        html: data.htmlMessage ? 1 : 0,
      },
    );
    logToCloud('Pushover notification sent', 'INFO');
    return response.data;
  } catch (err) {
    logToCloud(`Failed to send Pushover notification: ${err}`, 'ERROR');
    return err;
  }
};

// Server React App
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  logToCloud(`Server running on port ${PORT}`, 'INFO');
});
