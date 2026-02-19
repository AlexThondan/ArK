import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { taskApi } from "../../api/hrmsApi";
import DataTable from "../../components/common/DataTable";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import { formatDate, resolveFileUrl } from "../../utils/format";

const EmployeeTasksPage = () => {
  const [state, setState] = useState({ loading: true, error: "", rows: [] });

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      const response = await taskApi.my({ limit: 50 });
      setState({ loading: false, error: "", rows: response.data || [] });
    } catch (error) {
      setState({ loading: false, error: error.message, rows: [] });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateStatus = async (taskId, status) => {
    try {
      await taskApi.updateStatus(taskId, {
        status,
        progress: status === "done" ? 100 : undefined
      });
      toast.success("Task updated");
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const uploadAttachment = async (taskId, file) => {
    if (!file) return;
    try {
      await taskApi.uploadAttachment(taskId, file);
      toast.success("Attachment uploaded");
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (state.loading) return <LoadingSpinner label="Loading tasks..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={loadData} />;

  return (
    <section className="page-grid">
      <header className="page-head">
        <h1>Task Management</h1>
      </header>

      <div className="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Due Date</th>
              <th>Attachment</th>
            </tr>
          </thead>
          <tbody>
            {state.rows.map((task) => (
              <tr key={task._id}>
                <td>{task.title}</td>
                <td>{task.priority}</td>
                <td>
                  <select
                    value={task.status}
                    onChange={(event) => updateStatus(task._id, event.target.value)}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done</option>
                  </select>
                </td>
                <td>{task.progress || 0}%</td>
                <td>{formatDate(task.dueDate)}</td>
                <td>
                  <label className="btn btn-outline">
                    Upload
                    <input
                      type="file"
                      hidden
                      onChange={(event) => uploadAttachment(task._id, event.target.files?.[0])}
                    />
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="card">
        <div className="card-head">
          <h3>Attachments</h3>
        </div>
        <DataTable
          rows={state.rows.flatMap((task) =>
            (task.attachments || []).map((item) => ({ ...item, task: task.title }))
          )}
          columns={[
            { key: "task", label: "Task" },
            { key: "name", label: "File" },
            {
              key: "fileUrl",
              label: "Download",
              render: (value) =>
                value ? (
                  <a href={resolveFileUrl(value)} target="_blank" rel="noreferrer">
                    Open
                  </a>
                ) : (
                  "-"
                )
            }
          ]}
        />
      </section>
    </section>
  );
};

export default EmployeeTasksPage;
