import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Save, UploadCloud } from "lucide-react";
import { taskApi } from "../../api/hrmsApi";
import DataTable from "../../components/common/DataTable";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import ProgressPie3D from "../../components/charts/ProgressPie3D";
import StatusBadge from "../../components/common/StatusBadge";
import useAuth from "../../hooks/useAuth";
import { formatDate, resolveFileUrl } from "../../utils/format";

const clampProgress = (value) => {
  const parsed = Number(value || 0);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.min(100, parsed));
};

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
        progress: draft?.checked ? 100 : clampProgress(draft?.progress || 0),
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

  const summaryStats = useMemo(() => {
    const buckets = { todo: 0, "in-progress": 0, blocked: 0, done: 0 };
    const now = Date.now();
    const dueLimit = now + 7 * 24 * 60 * 60 * 1000;
    let dueSoon = 0;
    state.rows.forEach((task) => {
      const key = buckets[task.status] !== undefined ? task.status : "todo";
      buckets[key] += 1;
      const dueTs = task.dueDate ? new Date(task.dueDate).getTime() : 0;
      if (dueTs && dueTs >= now && dueTs <= dueLimit) {
        dueSoon += 1;
      }
    });
    const total = state.rows.length;
    const completionRate = total ? Math.round((buckets.done / total) * 100) : 0;
    return { total, dueSoon, blocked: buckets.blocked, completed: buckets.done, completionRate };
  }, [state.rows]);

  const focusTasks = useMemo(() => {
    const priorityRank = { critical: 1, high: 2, medium: 3, low: 4 };
    return [...state.rows]
      .filter((task) => task.status !== "done")
      .sort((a, b) => {
        const rankDiff = (priorityRank[a.priority] || 5) - (priorityRank[b.priority] || 5);
        if (rankDiff !== 0) return rankDiff;
        const dueA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dueB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        if (dueA !== dueB) return dueA - dueB;
        return (b.progress || 0) - (a.progress || 0);
      })
      .slice(0, 3);
  }, [state.rows]);

  if (state.loading) return <LoadingSpinner label="Loading tasks..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={loadData} />;

  const totalTasks = state.rows.length;
  const completedCount = state.rows.filter((task) => task.status === "done").length;
  const blockedCount = state.rows.filter((task) => task.status === "blocked").length;
  const inProgressCount = state.rows.filter((task) => task.status === "in-progress").length;
  const todoCount = state.rows.filter((task) => task.status === "todo").length;
  const avgProgress = totalTasks
    ? Math.round(state.rows.reduce((sum, task) => sum + (task.progress || 0), 0) / totalTasks)
    : 0;

  return (
    <section className="page-grid">
      <header className="page-head">
        <div>
          <h1>Task Management</h1>
          {profile?.employeeId ? <p className="muted">Employee ID: {profile.employeeId}</p> : null}
        </div>
      </header>

      <section className="card task-hero-card">
        <div className="task-hero-grid">
          <article className="task-hero-stat">
            <span className="task-hero-label">Total tasks</span>
            <strong>{totalTasks}</strong>
            <p className="muted">{`${completedCount} done • ${blockedCount} blocked`}</p>
          </article>
          <article className="task-hero-stat">
            <span className="task-hero-label">Pending & in progress</span>
            <strong>{inProgressCount + todoCount}</strong>
            <p className="muted">{`${todoCount} to do • ${inProgressCount} in progress`}</p>
          </article>
          <article className="task-hero-stat">
            <span className="task-hero-label">Avg. progress</span>
            <strong>{`${avgProgress}%`}</strong>
            <p className="muted">Ongoing health</p>
          </article>
        </div>
      </section>

      <section className="card task-focus-card">
        <div className="card-head">
          <div>
            <h3>Focus Tasks</h3>
            <p className="muted">
              {focusTasks.length
                ? `Top ${focusTasks.length} open assignments with the highest priority (due soon: ${summaryStats.dueSoon} tasks).`
                : "No urgent tasks flagged for now."}
            </p>
          </div>
        </div>
        <div className="task-focus-grid">
          {focusTasks.length ? (
            focusTasks.map((task) => {
              const draft = drafts[task._id] || {};
              const progressValue = clampProgress(draft.progress ?? task.progress ?? 0);
              const statusValue = draft.status || task.status;
              const checkedCount = (task.checklists || []).filter((item) => item.isChecked).length;
              return (
                <article className="task-focus-item" key={task._id}>
                  <div className="task-focus-header">
                    <strong>{task.title}</strong>
                    <StatusBadge status={statusValue} />
                  </div>
                  <p className="muted two-line">{task.description || "No additional context provided yet."}</p>
                  <div className="task-focus-meta">
                    <span>Due {formatDate(task.dueDate)}</span>
                    <span className="task-chip">{task.priority || "medium"} priority</span>
                  </div>
                  <div className="focus-progress">
                    <ProgressPie3D value={progressValue} />
                    <span>{progressValue}% complete</span>
                  </div>
                  <div className="task-focus-actions">
                    <button className="btn btn-outline" type="button" onClick={() => saveTask(task._id)}>
                      Submit
                    </button>
                    <small className="muted">
                      Checklist {checkedCount}/{task.checklists?.length || 0}
                    </small>
                  </div>
                </article>
              );
            })
          ) : (
            <p className="muted">Looks like everything is on track.</p>
          )}
        </div>
      </section>

      <section className="task-card-grid">
        {state.rows.map((task) => (
          <article className="task-card" key={task._id}>
            <header className="task-card-head">
              <div className="task-card-left">
                <span className={`task-priority ${task.priority || "medium"}`}>{task.priority || "Medium"}</span>
                <h3>{task.title}</h3>
                {task.project ? (
                  <p className="muted">
                    {task.project.code || "-"} | {task.project.name || "Project"}
                  </p>
                ) : null}
                {task.description ? <p className="two-line task-description">{task.description}</p> : null}
              </div>
              <div className="task-card-right">
                <span className="muted">Due {formatDate(task.dueDate)}</span>
                <label className="round-check task-card-done" title="Mark as completed">
                  <input
                    type="checkbox"
                    checked={Boolean(drafts[task._id]?.checked)}
                    onChange={(event) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [task._id]: {
                          ...(prev[task._id] || {}),
                          checked: event.target.checked,
                          status: event.target.checked
                            ? "done"
                            : prev[task._id]?.status || task.status || "in-progress",
                          progress: event.target.checked ? 100 : prev[task._id]?.progress ?? task.progress ?? 0
                        }
                      }))
                    }
                  />
                  <span />
                </label>
              </div>
            </header>

            <div className="task-card-body">
              <div className="task-card-progress">
                <ProgressPie3D value={drafts[task._id]?.progress ?? task.progress ?? 0} />
                <div>
                  <label>
                    Status
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
                  </label>
                  <label>
                    Progress (%)
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
                            progress: clampProgress(event.target.value)
                          }
                        }))
                      }
                    />
                  </label>
                </div>
              </div>

              {task.checklists?.length ? (
                <div className="checklist-list task-checklist">
                  {task.checklists.map((item) => (
                    <label key={item._id} className={`checklist-row ${item.isChecked ? "checked" : ""}`}>
                      <span className="round-check checklist-check" title="Mark checklist">
                        <input
                          type="checkbox"
                          checked={Boolean(item.isChecked)}
                          onChange={(event) => toggleChecklist(task._id, item._id, event.target.checked)}
                        />
                        <span />
                      </span>
                      <span className="checklist-copy">
                        <strong>{item.title}</strong>
                        {item.description ? <small>{item.description}</small> : null}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="muted">No checklist items available.</p>
              )}

              <div className="task-card-update">
                <label>
                  Update note
                  <textarea
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
                </label>
                <div className="task-card-footer">
                  <label className="btn btn-outline upload-btn">
                    <UploadCloud size={14} />
                    Upload
                    <input
                      type="file"
                      hidden
                      onChange={(event) => uploadAttachment(task._id, event.target.files?.[0])}
                    />
                  </label>
                  <button className="btn btn-primary" type="button" onClick={() => saveTask(task._id)}>
                    <Save size={14} />
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="card attachments-card">
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
