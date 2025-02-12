import { useEffect, useState } from "react";

// const API_KEY = import.meta.env.VITE_API_KEY as string
const LOCAL_STORAGE_API_KEY = "PUSHOVER_NOTIFIER_API_KEY";
const ENDPOINT_URL = import.meta.env.VITE_ENDPOINT_URL as string

type Task = {
  name: string;
  scheduleTime: {
    seconds: string;
  };
};

const App = () => {
  const [apiKey, setApiKey] = useState<string|null>();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (apiKey) {
      fetchTasks().then(response => {
        if (Array.isArray(response)) {
          setTasks(response)
        } else {
          localStorage.removeItem(LOCAL_STORAGE_API_KEY);
          setApiKey(null);
        }
    });
    }
  }, [apiKey]);

  useEffect(() => {
    let storageValue = localStorage.getItem(LOCAL_STORAGE_API_KEY);
    const apiKey = storageValue ? storageValue : prompt("Enter your API key:");
    if (apiKey) {
      localStorage.setItem(LOCAL_STORAGE_API_KEY, apiKey);
      setApiKey(apiKey);
    }
  }, []);

  const fetchTasks = async (): Promise<Task[]> => {
    const response = await fetch(`${ENDPOINT_URL}/tasks`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
    }});
    return response.json();
  };

  const deleteTask = async (taskName: string | undefined): Promise<any> => {
    if (taskName) {
      const response = await fetch(`${ENDPOINT_URL}/tasks/${taskName}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
      }});
      const result = await response.json();
      if (result && apiKey) {
        fetchTasks().then(setTasks);
      }
    }
  };

  return (
    <table>
      <thead>
        <tr>
          <th>Task Name</th>
          <th>Scheduled For</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => {
          const taskName = task.name.split("/").pop() || 'task-name-unknown'
          return (
            <tr key={task.name}>
              <td>{taskName.replaceAll('-', ' ').replace(/\d/g, '')}</td>
              <td>{formatDate(task.scheduleTime.seconds)}</td>
              <td><button onClick={() => deleteTask(taskName)}>Delete</button></td>
            </tr>
          )}
        )}
      </tbody>
    </table>
  );
};

const formatDate = (seconds: string): string => {
  const date = new Date(parseInt(seconds) * 1000);
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(",", "");
};

export default App;
