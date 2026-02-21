import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Save, UploadCloud } from "lucide-react";
import { taskApi } from "../../api/hrmsApi";
import DataTable from "../../components/common/DataTable";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import useAuth from "../../hooks/useAuth";
import { formatDate, resolveFileUrl } from "../../utils/format";

const EmployeeTasksPage = () => {
  const { profile } = useAuth();
  const [state, setState] = useState({ loading: true, error: "", rows: [] });
  const [drafts, setDrafts] = useState({});

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      const response = await taskApi.my({ limit: 50 });
      const rows = response.data || [];
      setState({ loading: false, error: "", rows });
      setDrafts(
        rows.reduce((acc, row) => {
          acc[row._id] = {
            status: row.status || "todo",
            progress: row.progress || 0,
            checked: Boolean(row.employeeSubmission?.isChecked || row.status === "done"),
            updateNote: row.employeeSubmission?.updateNote || ""
          };
          return acc;
        }, {})
      );
    } catch (error) {
      setState({ loading: false, error: error.message, rows: [] });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveTask = async (taskId) => {
    try {
      const draft = drafts[taskId];
      await taskApi.updateStatus(taskId, {
        status: draft?.checked ? "done" : draft?.status || "todo",
        progress: draft?.checked ? 100 : Number(draft?.progress || 0),
        checked: Boolean(draft?.checked),
        updateNote: draft?.updateNote || ""
      });
      toast.success("Task updated");
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const toggleChecklist = async (taskId, checklistId, nextChecked) => {
    try {
      await taskApi.updateChecklist(taskId, { checklistId, isChecked: nextChecked });
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
        <div>
          <h1>Task Management</h1>
          {profile?.employeeId ? <p className="muted">Employee ID: {profile.employeeId}</p> : null}
        </div>
      </header>

      <div className="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>Done</th>
              <th>Task</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Checklist</th>
              <th>Update Note</th>
              <th>Due Date</th>
              <th>Attachment</th>
              <th>Submit</th>
            </tr>
          </thead>
          <tbody>
            {state.rows.map((task) => (
              <tr key={task._id}>
                <td>
                  <label className="round-check" title="Mark as completed">
                    <input
                      type="checkbox"
                      checked={Boolean(drafts[task._id]?.checked)}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [task._id]: {
                            ...(prev[task._id] || {}),
                            checked: event.target.checked,
                            status: event.target.checked ? "done" : prev[task._id]?.status || "in-progress",
                            progress: event.target.checked ? 100 : prev[task._id]?.progress || 60
                          }
                        }))
                      }
                    />
                    <span />
                  </label>
                </td>
                <td>
                  <strong>{task.title}</strong>
                  {task.description ? <p className="two-line">{task.description}</p> : null}
                </td>
                <td>
                  <select
                    value={drafts[task._id]?.status || task.status}
                    onChange={(event) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [task._id]: {
                          ...(prev[task._id] || {}),
                          status: event.target.value
                        }
                      }))
                    }
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done</option>
                  </select>
                </td>
                <td>
                  <div className="progress-edit">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={drafts[task._id]?.progress ?? task.progress ?? 0}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [task._id]: {
                            ...(prev[task._id] || {}),
                            progress: Number(event.target.value)
                          }
                        }))
                      }
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={drafts[task._id]?.progress ?? task.progress ?? 0}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [task._id]: {
                            ...(prev[task._id] || {}),
                            progress: Number(event.target.value)
                          }
                        }))
                      }
                    />
                  </div>
                </td>
                <td>
                  {task.checklists?.length ? (
                    <div className="checklist-list">
                      {task.checklists.map((item) => (
                        <label key={item._id} className="checklist-row">
                          <input
                            type="checkbox"
                            checked={Boolean(item.isChecked)}
                            onChange={(event) => toggleChecklist(task._id, item._id, event.target.checked)}
                          />
                          <span>{item.title}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <span className="muted">-</span>
                  )}
                </td>
                <td>
                  <textarea
                    className="inline-note"
                    placeholder="Add work update or blockers"
                    value={drafts[task._id]?.updateNote || ""}
                    onChange={(event) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [task._id]: {
                          ...(prev[task._id] || {}),
                          updateNote: event.target.value
                        }
                      }))
                    }
                  />
                </td>
                <td>{formatDate(task.dueDate)}</td>
                <td>
                  <label className="btn btn-outline">
                    <UploadCloud size={14} />
                    Upload
                    <input
                      type="file"
                      hidden
                      onChange={(event) => uploadAttachment(task._id, event.target.files?.[0])}
                    />
                  </label>
                </td>
                <td>
                  <button className="btn btn-primary" type="button" onClick={() => saveTask(task._id)}>
                    <Save size={14} />
                    Submit
                  </button>
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

      <section className="card gradient-card">
        <div className="card-head">
          <h3>Submission Guide</h3>
        </div>
        <div className="button-row">
          <CheckCircle2 size={16} />
          <p className="muted">
            Tick the round checkbox and checklist items when complete, add your update note, upload proof file if
            needed, and click submit.
          </p>
        </div>
      </section>
    </section>
  );
};

export default EmployeeTasksPage;
