import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { BriefcaseBusiness, ClipboardCheck, PlusCircle, Sparkles } from "lucide-react";
import { clientApi, employeeApi, projectApi, taskApi, teamApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import FormModal from "../../components/common/FormModal";
import { formatCurrency, formatDate, resolveFileUrl } from "../../utils/format";

const initialProject = {
  name: "",
  code: "",
  description: "",
  startDate: "",
  endDate: "",
  budget: "",
  client: "",
  status: "planning"
};

const initialTask = {
  title: "",
  assignMode: "employee",
  assignedTo: "",
  assignedTeam: "",
  project: "",
  dueDate: "",
  priority: "medium",
  description: "",
  checklists: [{ title: "", description: "" }]
};

const AdminProjectsPage = () => {
  const [state, setState] = useState({
    loading: true,
    error: "",
    projects: [],
    tasks: [],
    employees: [],
    clients: [],
    teams: []
  });
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [projectForm, setProjectForm] = useState(initialProject);
  const [taskForm, setTaskForm] = useState(initialTask);
  const [projectDrafts, setProjectDrafts] = useState({});

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      const [projectsRes, tasksRes, employeeRes, clientRes, teamRes] = await Promise.all([
        projectApi.list({ limit: 100 }),
        taskApi.admin({ limit: 100 }),
        employeeApi.list({ limit: 200 }),
        clientApi.list({ limit: 200 }),
        teamApi.list({ limit: 200, isActive: true })
      ]);

      const projects = projectsRes.data || [];
      setState({
        loading: false,
        error: "",
        projects,
        tasks: tasksRes.data || [],
        employees: employeeRes.data || [],
        clients: clientRes.data || [],
        teams: teamRes.data || []
      });
      setProjectDrafts(
        projects.reduce((acc, project) => {
          acc[project._id] = {
            status: project.status,
            progress: project.progress || 0
          };
          return acc;
        }, {})
      );
    } catch (error) {
      setState({
        loading: false,
        error: error.message,
        projects: [],
        tasks: [],
        employees: [],
        clients: [],
        teams: []
      });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createProject = async (event) => {
    event.preventDefault();
    try {
      await projectApi.create({
        ...projectForm,
        budget: Number(projectForm.budget || 0)
      });
      toast.success("Project created");
      setProjectForm(initialProject);
      setShowProjectModal(false);
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const createTask = async (event) => {
    event.preventDefault();
    try {
      if (taskForm.assignMode === "team" && !taskForm.assignedTeam) {
        toast.error("Select a team before assigning");
        return;
      }
      if (taskForm.assignMode === "employee" && !taskForm.assignedTo) {
        toast.error("Select an employee before assigning");
        return;
      }

      if (taskForm.assignMode === "team") {
        const selectedTeam = state.teams.find((team) => team._id === taskForm.assignedTeam);
        if (!selectedTeam || !(selectedTeam.members || []).length) {
          toast.error("Selected team has no members");
          return;
        }
      }

      const payload = {
        title: taskForm.title,
        project: taskForm.project || undefined,
        dueDate: taskForm.dueDate || undefined,
        priority: taskForm.priority,
        description: taskForm.description,
        checklists: (taskForm.checklists || []).filter((row) => row.title?.trim())
      };

      if (taskForm.assignMode === "team") {
        payload.assignedTeam = taskForm.assignedTeam;
      } else {
        payload.assignedTo = taskForm.assignedTo;
      }

      const response = await taskApi.create(payload);
      toast.success("Task assigned");
      if (response.createdCount) {
        toast.success(`${response.createdCount} tasks created for team members`);
      }
      setTaskForm(initialTask);
      setShowTaskModal(false);
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const saveProjectProgress = async (projectId) => {
    try {
      const draft = projectDrafts[projectId];
      await projectApi.update(projectId, {
        status: draft.status,
        progress: Number(draft.progress || 0)
      });
      toast.success("Project updated");
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const employeeMap = useMemo(
    () =>
      state.employees.reduce((acc, employee) => {
        if (employee.user?._id) {
          acc[employee.user._id] = employee;
        }
        return acc;
      }, {}),
    [state.employees]
  );

  const statusBuckets = useMemo(() => {
    const buckets = {
      todo: [],
      "in-progress": [],
      blocked: [],
      done: []
    };
    state.tasks.forEach((task) => {
      const key = buckets[task.status] ? task.status : "todo";
      buckets[key].push(task);
    });
    return buckets;
  }, [state.tasks]);

  const projectStats = useMemo(() => {
    const activeProjects = state.projects.filter((row) => row.status === "active").length;
    const completedTasks = state.tasks.filter((row) => row.status === "done").length;
    const completionRate = state.tasks.length ? Math.round((completedTasks / state.tasks.length) * 100) : 0;
    const totalBudget = state.projects.reduce((sum, row) => sum + Number(row.budget || 0), 0);
    return { activeProjects, completionRate, totalBudget };
  }, [state.projects, state.tasks]);

  if (state.loading) return <LoadingSpinner label="Loading projects and tasks..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={loadData} />;

  return (
    <section className="page-grid">
      <header className="page-head">
        <h1>Project & Task Management</h1>
        <div className="button-row">
          <button className="btn btn-outline" type="button" onClick={() => setShowTaskModal(true)}>
            <ClipboardCheck size={14} />
            Assign Task
          </button>
          <button className="btn btn-primary" type="button" onClick={() => setShowProjectModal(true)}>
            <PlusCircle size={14} />
            Create Project
          </button>
        </div>
      </header>

      <div className="kpi-grid">
        <article className="card kpi-card gradient-card">
          <div className="kpi-head">
            <span>Active Projects</span>
            <BriefcaseBusiness size={18} />
          </div>
          <h2>{projectStats.activeProjects}</h2>
        </article>
        <article className="card kpi-card gradient-card">
          <div className="kpi-head">
            <span>Task Completion</span>
            <Sparkles size={18} />
          </div>
          <h2>{projectStats.completionRate}%</h2>
        </article>
        <article className="card kpi-card gradient-card">
          <div className="kpi-head">
            <span>Total Budget</span>
            <BriefcaseBusiness size={18} />
          </div>
          <h2>{formatCurrency(projectStats.totalBudget)}</h2>
        </article>
      </div>

      <section className="card">
        <div className="card-head">
          <h3>Projects</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Code</th>
                <th>Client</th>
                <th>Budget</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Start</th>
                <th>End</th>
                <th>Save</th>
              </tr>
            </thead>
            <tbody>
              {state.projects.map((project) => (
                <tr key={project._id}>
                  <td>{project.name}</td>
                  <td>{project.code}</td>
                  <td>
                    <div className="list-identity">
                      <div className="avatar-cell small">
                        {project.client?.logoUrl ? (
                          <img className="avatar-img" src={resolveFileUrl(project.client.logoUrl)} alt={project.client?.company || "Client"} />
                        ) : (
                          <span className="avatar-fallback">{(project.client?.company || "C").slice(0, 1)}</span>
                        )}
                      </div>
                      <div>
                        <strong>{project.client?.company || "-"}</strong>
                      </div>
                    </div>
                  </td>
                  <td>{formatCurrency(project.budget || 0)}</td>
                  <td>
                    <select
                      value={projectDrafts[project._id]?.status || project.status}
                      onChange={(event) =>
                        setProjectDrafts((prev) => ({
                          ...prev,
                          [project._id]: {
                            ...(prev[project._id] || {}),
                            status: event.target.value
                          }
                        }))
                      }
                    >
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="on-hold">On Hold</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                  <td>
                    <div className="progress-edit">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={projectDrafts[project._id]?.progress ?? project.progress ?? 0}
                        onChange={(event) =>
                          setProjectDrafts((prev) => ({
                            ...prev,
                            [project._id]: {
                              ...(prev[project._id] || {}),
                              progress: Number(event.target.value)
                            }
                          }))
                        }
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={projectDrafts[project._id]?.progress ?? project.progress ?? 0}
                        onChange={(event) =>
                          setProjectDrafts((prev) => ({
                            ...prev,
                            [project._id]: {
                              ...(prev[project._id] || {}),
                              progress: Number(event.target.value)
                            }
                          }))
                        }
                      />
                    </div>
                  </td>
                  <td>{formatDate(project.startDate)}</td>
                  <td>{formatDate(project.endDate)}</td>
                  <td>
                    <button className="btn btn-primary" type="button" onClick={() => saveProjectProgress(project._id)}>
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card premium-board">
        <div className="card-head">
          <h3>Task Kanban View</h3>
        </div>
        <div className="kanban-grid">
          {Object.entries(statusBuckets).map(([key, tasks]) => (
            <div className={`kanban-column ${key}`} key={key}>
              <h4>{key}</h4>
              <div className="kanban-list">
                {tasks.map((task) => {
                  const assigneeId = String(task.assignedTo?._id || task.assignedTo || "");
                  const employee = employeeMap[assigneeId];
                  return (
                    <article className="kanban-card" key={task._id}>
                      <strong>{task.title}</strong>
                      <p className="task-chip">{task.priority}</p>
                      {task.description ? <p className="two-line">{task.description}</p> : null}
                      <small>
                        {(employee?.firstName || "Unknown")} {(employee?.lastName || "")}{" "}
                        {employee?.employeeId ? `(${employee.employeeId})` : ""}
                      </small>
                      {task.assignedTeam?.name ? <small>Team: {task.assignedTeam.name}</small> : null}
                      {task.checklists?.length ? <small>Checklist: {task.checklists.filter((item) => item.isChecked).length}/{task.checklists.length}</small> : null}
                      <small>{formatDate(task.dueDate)}</small>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <FormModal title="Create Project" open={showProjectModal} onClose={() => setShowProjectModal(false)}>
        <form className="form-grid" onSubmit={createProject}>
          <label>
            Name
            <input
              required
              value={projectForm.name}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </label>
          <label>
            Code
            <input
              required
              value={projectForm.code}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, code: event.target.value }))}
            />
          </label>
          <label>
            Client
            <select
              value={projectForm.client}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, client: event.target.value }))}
            >
              <option value="">Select client</option>
              {state.clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.company}
                </option>
              ))}
            </select>
          </label>
          <label>
            Budget (INR)
            <input
              type="number"
              value={projectForm.budget}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, budget: event.target.value }))}
            />
          </label>
          <label>
            Status
            <select
              value={projectForm.status}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <label>
            Start Date
            <input
              type="date"
              value={projectForm.startDate}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, startDate: event.target.value }))}
            />
          </label>
          <label>
            End Date
            <input
              type="date"
              value={projectForm.endDate}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, endDate: event.target.value }))}
            />
          </label>
          <label className="full-width">
            Description
            <textarea
              value={projectForm.description}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </label>
          <button className="btn btn-primary" type="submit">
            Save Project
          </button>
        </form>
      </FormModal>

      <FormModal title="Assign Task" open={showTaskModal} onClose={() => setShowTaskModal(false)}>
        <form className="form-grid" onSubmit={createTask}>
          <label>
            Task Title
            <input
              required
              value={taskForm.title}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))}
            />
          </label>
          <label>
            Assign To
            <select
              value={taskForm.assignMode}
              onChange={(event) =>
                setTaskForm((prev) => ({
                  ...prev,
                  assignMode: event.target.value,
                  assignedTo: "",
                  assignedTeam: ""
                }))
              }
            >
              <option value="employee">Individual Employee</option>
              <option value="team">Team</option>
            </select>
          </label>
          <label>
            Employee
            <select
              required={taskForm.assignMode === "employee"}
              disabled={taskForm.assignMode !== "employee"}
              value={taskForm.assignedTo}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, assignedTo: event.target.value }))}
            >
              <option value="">Select employee</option>
              {state.employees.map((employee) => (
                <option key={employee.user?._id} value={employee.user?._id}>
                  {employee.firstName} {employee.lastName} {employee.employeeId ? `(${employee.employeeId})` : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            Team
            <select
              required={taskForm.assignMode === "team"}
              disabled={taskForm.assignMode !== "team"}
              value={taskForm.assignedTeam}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, assignedTeam: event.target.value }))}
            >
              <option value="">Select team</option>
              {state.teams.map((team) => (
                <option key={team._id} value={team._id} disabled={!(team.members || []).length}>
                  {team.name} ({team.code}) {(team.members || []).length ? `- ${team.members.length} member(s)` : "- No members"}
                </option>
              ))}
            </select>
          </label>
          <label>
            Project
            <select
              value={taskForm.project}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, project: event.target.value }))}
            >
              <option value="">None</option>
              {state.projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select
              value={taskForm.priority}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, priority: event.target.value }))}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>
          <label>
            Deadline
            <input
              type="date"
              value={taskForm.dueDate}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, dueDate: event.target.value }))}
            />
          </label>
          <label className="full-width">
            Description
            <textarea
              value={taskForm.description}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </label>
          <div className="full-width checklist-wrap">
            <div className="card-head">
              <h3>Checklist Items (HR Assigned)</h3>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() =>
                  setTaskForm((prev) => ({
                    ...prev,
                    checklists: [...(prev.checklists || []), { title: "", description: "" }]
                  }))
                }
              >
                Add Checkbox
              </button>
            </div>
            <div className="form-grid">
              {(taskForm.checklists || []).map((item, index) => (
                <div className="checklist-item" key={`${item.title}-${index}`}>
                  <input
                    placeholder="Checklist title"
                    value={item.title}
                    onChange={(event) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        checklists: prev.checklists.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, title: event.target.value } : row
                        )
                      }))
                    }
                  />
                  <input
                    placeholder="Description (optional)"
                    value={item.description}
                    onChange={(event) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        checklists: prev.checklists.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, description: event.target.value } : row
                        )
                      }))
                    }
                  />
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={() =>
                      setTaskForm((prev) => ({
                        ...prev,
                        checklists: prev.checklists.filter((_, rowIndex) => rowIndex !== index)
                      }))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" type="submit">
            Assign Task
          </button>
        </form>
      </FormModal>
    </section>
  );
};

export default AdminProjectsPage;
