import { useEffect, useState } from "react";

const API_KEY = import.meta.env.VITE_API_KEY as string
const ENDPOINT_URL = import.meta.env.VITE_ENDPOINT_URL as string

type Task = {
  name: string;
  scheduleTime: {
    seconds: string;
  };
};

const fetchTasks = async (): Promise<Task[]> => {
  const response = await fetch(`${ENDPOINT_URL}/tasks`, {
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
  }});
  return response.json();
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

const App = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetchTasks().then(setTasks);
  }, []);


const deleteTask = async (taskName: string | undefined): Promise<any> => {
  if (taskName) {
    const response = await fetch(`${ENDPOINT_URL}/tasks/${taskName}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
    }});
    const result = await response.json();
    console.log(result);
    if (result) {
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
          const taskName = task.name.split("/").pop()
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

export default App;
