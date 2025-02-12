import { CloudTasksClient } from '@google-cloud/tasks';
import 'dotenv/config';

const client = new CloudTasksClient();
const apiKey = process.env.API_KEY || '';
const project = process.env.PROJECT_ID;
const account = process.env.PROJECT_NUMBER;
const region = process.env.PROJECT_REGION;
const queue = 'task-reminders';
const serviceUrl = `https://${project}-${account}.${region}.run.app/send-notification`;

export const scheduleNotification = async (value, delaySeconds) => {
  const parent = client.queuePath(project, region, queue);
  const payload = JSON.stringify(value);
  const dueTimeInSeconds = Math.round(Date.now() / 1000) + delaySeconds;
  const taskName = `${value.message.replaceAll(
    ' ',
    '-',
  )}-${delaySeconds}`.toLowerCase();
  const taskPath = `${parent}/tasks/${taskName}`;

  const task = {
    name: taskPath,
    httpRequest: {
      httpMethod: 'POST',
      url: serviceUrl,
      body: Buffer.from(payload).toString('base64'),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    },
    scheduleTime: { seconds: dueTimeInSeconds },
  };

  console.log(
    `Tasks ${value.message}, is being scheduled in ${dueTimeInSeconds} seconds from now`,
  );
  const [createdTask] = await client.createTask({ parent, task });
  return createdTask;
};

export const getAllTasks = async () => {
  const parent = client.queuePath(project, region, queue);

  try {
    const [tasks] = await client.listTasks({ parent });
    return tasks;
  } catch (error) {
    console.error('Error retrieving tasks:', error);
  }
};

export const getTask = async (taskName) => {
  const taskPath = client.taskPath(project, region, queue, taskName);

  try {
    const [task] = await client.getTask({ name: taskPath });
    return task;
  } catch (error) {
    console.error('Error retrieving task:', error);
    return null;
  }
};

export const deleteTask = async (taskName) => {
  const taskPath = client.taskPath(project, region, queue, taskName);

  try {
    await client.deleteTask({ name: taskPath });
    return { message: `Task ${taskName} deleted` };
  } catch (error) {
    console.error('Error deleting task:', error);
  }
};
