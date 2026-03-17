import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { BriefcaseBusiness, ClipboardCheck, PlusCircle, Sparkles, Trash2 } from "lucide-react";
import { clientApi, employeeApi, projectApi, taskApi, teamApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import FormModal from "../../components/common/FormModal";
import ProgressPie3D from "../../components/charts/ProgressPie3D";
import StatusBadge from "../../components/common/StatusBadge";
import { formatCurrency, formatDate, resolveFileUrl } from "../../utils/format";

const clampProgress = (value) => {
  const parsed = Number(value || 0);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.min(100, parsed));
};

const parseArkNumeric = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  if (!normalized) return 0;
  if (/^ARK-\d+$/.test(normalized)) return Number(normalized.split("-")[1] || 0);
  if (/^\d+$/.test(normalized)) return Number(normalized);
  return 0;
};

const formatArkCode = (value) => `ARK-${String(value).padStart(3, "0")}`;

const initialProject = {
  name: "",
  description: "",
  startDate: "",
  endDate: "",
  budget: "",
  client: "",
  status: "planning",
  assignmentType: "individual",
  members: [],
  assignedTeam: "",
  checklists: [{ title: "", description: "" }]
};

const initialTask = {
  taskCode: "",
  title: "",
  assignMode: "employee",
  assignedTo: "",
  assignedTeam: "",
  project: "",
  dueDate: "",
  priority: "medium",
  status: "todo",
  progress: 0,
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
  const [editingProjectId, setEditingProjectId] = useState("");
  const [editingTaskId, setEditingTaskId] = useState("");

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

  const nextProjectCode = useMemo(() => {
    const maxCode = (state.projects || []).reduce(
      (maxValue, project) => Math.max(maxValue, parseArkNumeric(project.code)),
      0
    );
    return formatArkCode(maxCode + 1);
  }, [state.projects]);

  const nextTaskCode = useMemo(() => {
    const maxCode = (state.tasks || []).reduce(
      (maxValue, task) => Math.max(maxValue, parseArkNumeric(task.taskCode)),
      0
    );
    return formatArkCode(maxCode + 1);
  }, [state.tasks]);

  const closeProjectModal = () => {
    setShowProjectModal(false);
    setEditingProjectId("");
    setProjectForm(initialProject);
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setEditingTaskId("");
    setTaskForm(initialTask);
  };

  const openProjectEditor = (project) => {
    setEditingProjectId(project._id);
    setProjectForm({
      name: project.name || "",
      description: project.description || "",
      startDate: project.startDate ? String(project.startDate).slice(0, 10) : "",
      endDate: project.endDate ? String(project.endDate).slice(0, 10) : "",
      budget: String(project.budget || ""),
      client: project.client?._id || project.client || "",
      status: project.status || "planning",
      assignmentType: project.assignmentType || "individual",
      members: (project.members || []).map((member) => String(member?._id || member || "")).filter(Boolean),
      assignedTeam: project.assignedTeam?._id || project.assignedTeam || "",
      checklists: (project.checklists || []).length
        ? project.checklists.map((item) => ({
            title: item.title || "",
            description: item.description || ""
          }))
        : [{ title: "", description: "" }]
    });
    setShowProjectModal(true);
  };

  const openTaskEditor = (task) => {
    setEditingTaskId(task._id);
    setTaskForm({
      taskCode: task.taskCode || "",
      title: task.title || "",
      assignMode: task.assignedTeam ? "team" : "employee",
      assignedTo: task.assignedTo?._id || task.assignedTo || "",
      assignedTeam: task.assignedTeam?._id || task.assignedTeam || "",
      project: task.project?._id || task.project || "",
      dueDate: task.dueDate ? String(task.dueDate).slice(0, 10) : "",
      priority: task.priority || "medium",
      status: task.status || "todo",
      progress: clampProgress(task.progress || 0),
      description: task.description || "",
      checklists: (task.checklists || []).length
        ? task.checklists.map((item) => ({
            title: item.title || "",
            description: item.description || "",
            assignee: item.assignee?._id || item.assignee || ""
          }))
        : [{ title: "", description: "" }]
    });
    setShowTaskModal(true);
  };

  const createProject = async (event) => {
    event.preventDefault();
    try {
      if (projectForm.assignmentType === "team" && !projectForm.assignedTeam) {
        toast.error("Select a team for this project");
        return;
      }
      if (projectForm.assignmentType === "individual" && !(projectForm.members || []).length) {
        toast.error("Select at least one member for this project");
        return;
      }

      const payload = {
        ...projectForm,
        assignedTeam: projectForm.assignmentType === "team" ? projectForm.assignedTeam : undefined,
        members: projectForm.assignmentType === "individual" ? projectForm.members : [],
        budget: Number(projectForm.budget || 0),
        checklists: (projectForm.checklists || []).filter((row) => row.title?.trim())
      };

      if (editingProjectId) {
        await projectApi.update(editingProjectId, payload);
        toast.success("Project updated");
      } else {
        await projectApi.create(payload);
        toast.success("Project created");
      }

      closeProjectModal();
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
        status: taskForm.status || "todo",
        progress: clampProgress(taskForm.progress || 0),
        description: taskForm.description,
        checklists: (taskForm.checklists || []).filter((row) => row.title?.trim())
      };

      if (taskForm.assignMode === "team") {
        payload.assignedTeam = taskForm.assignedTeam;
        if (editingTaskId) payload.assignedTo = "";
      } else {
        payload.assignedTo = taskForm.assignedTo;
        if (editingTaskId) payload.assignedTeam = "";
      }

      if (editingTaskId) {
        await taskApi.update(editingTaskId, payload);
        toast.success("Assignment updated");
      } else {
        const response = await taskApi.create(payload);
        toast.success("Task assigned");
        if (response.createdCount) {
          toast.success(`${response.createdCount} tasks created for team members`);
        }
      }
      closeTaskModal();
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
        progress: clampProgress(draft.progress || 0)
      });
      toast.success("Project updated");
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const deleteProject = async (project) => {
    const confirmed = window.confirm(`Delete project "${project.name}"? Linked tasks will also be deleted.`);
    if (!confirmed) return;
    try {
      await projectApi.remove(project._id);
      toast.success("Project deleted successfully");
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

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

  const featuredProjects = useMemo(() => {
    return [...state.projects]
      .filter((project) => project.status !== "completed")
      .sort((a, b) => clampProgress(b.progress || 0) - clampProgress(a.progress || 0))
      .slice(0, 3);
  }, [state.projects]);

  const renderProjectAssignees = (project) => {
    if (project.assignmentType === "team") {
      return <span>Team: {project.assignedTeam?.name || "-"}</span>;
    }

    const names = (project.members || [])
      .slice(0, 3)
      .map((member) => {
        const userId = String(member?._id || member || "");
        const employee = employeeMap[userId];
        if (employee) {
          return `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || employee.employeeId;
        }
        return member?.email || "Member";
      })
      .filter(Boolean);

    if (!names.length) return <span className="muted">No assignee</span>;

    return (
      <div className="assignee-stack">
        <strong>{names.join(", ")}</strong>
        {(project.members || []).length > names.length ? <small>+{project.members.length - names.length} more</small> : null}
      </div>
    );
  };

  if (state.loading) return <LoadingSpinner label="Loading projects and tasks..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={loadData} />;

  return (
    <section className="page-grid">
      <header className="page-head">
        <h1>Project & Task Management</h1>
        <div className="button-row">
          <button
            className="btn btn-outline"
            type="button"
            onClick={() => {
              setEditingTaskId("");
              setTaskForm(initialTask);
              setShowTaskModal(true);
            }}
          >
            <ClipboardCheck size={14} />
            Assign Task
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              setEditingProjectId("");
              setProjectForm(initialProject);
              setShowProjectModal(true);
            }}
          >
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

      <section className="card project-highlight-card">
        <div className="card-head">
          <div>
            <h3>Project highlights</h3>
            <p className="muted">Focus on the highest progress deliveries.</p>
          </div>
        </div>
        <div className="project-highlight-grid">
          {featuredProjects.length ? (
            featuredProjects.map((project) => {
              const progressValue = clampProgress(projectDrafts[project._id]?.progress ?? project.progress ?? 0);
              return (
                <article className="project-highlight-tile" key={project._id}>
                  <div className="project-highlight-header">
                    <div>
                      <strong>{project.name}</strong>
                      <small className="muted">{project.code || "ARK-000"}</small>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                  <p className="muted two-line">{project.description || "No summary provided yet."}</p>
                  <div className="project-highlight-meta">
                    <div>
                      <small className="summary-label">Client</small>
                      <span>{project.client?.company || "Unassigned"}</span>
                    </div>
                    <div>
                      <small className="summary-label">Assigned</small>
                      <div className="project-assignee-chip">{renderProjectAssignees(project)}</div>
                    </div>
                    <div>
                      <small className="summary-label">Timeline</small>
                      <span>
                        {formatDate(project.startDate) || "TBD"} → {formatDate(project.endDate) || "TBD"}
                      </span>
                    </div>
                  </div>
                  <div className="project-highlight-footer">
                    <div className="project-highlight-progress">
                      <ProgressPie3D value={progressValue} />
                      <span>{progressValue}%</span>
                    </div>
                    <button className="btn btn-outline" type="button" onClick={() => openProjectEditor(project)}>
                      Manage
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <p className="muted">No featured projects yet. Create one to populate this space.</p>
          )}
        </div>
      </section>
      <section className="card project-board">
        <div className="card-head">
          <h3>Projects</h3>
        </div>
        <div className="project-card-grid">
          {state.projects.map((project) => (
            <article className="project-card" key={project._id}>
              <div className="project-card-top">
                <div>
                  <small className="project-code">{project.code || "ARK-000"}</small>
                  <h4>{project.name}</h4>
                  <p className="muted two-line">{project.description || project.client?.company || "Client project"}</p>
                </div>
                <span className={`project-status-pill ${project.status || "planning"}`}>
                  {project.status?.split(/[-_\\s]+/).map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1)).join(" ") ||
                    "Planning"}
                </span>
              </div>
              <div className="project-card-meta">
                <div>
                  <p className="muted">Client</p>
                  <strong>{project.client?.company || "—"}</strong>
                </div>
                <div>
                  <p className="muted">Assigned</p>
                  <div className="project-assignee-chip">{renderProjectAssignees(project)}</div>
                </div>
                <div>
                  <p className="muted">Budget</p>
                  <strong>{formatCurrency(project.budget || 0)}</strong>
                </div>
              </div>
              <div className="project-card-progress">
                <ProgressPie3D value={projectDrafts[project._id]?.progress ?? project.progress ?? 0} />
                <div className="project-progress-controls">
                  <label>
                    Status
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
                  </label>
                  <label>
                    Progress
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
                            progress: clampProgress(event.target.value)
                          }
                        }))
                      }
                    />
                  </label>
                </div>
              </div>
              <div className="project-card-details">
                <div>
                  <p className="muted">Timeline</p>
                  <small>
                    {formatDate(project.startDate)} → {formatDate(project.endDate)}
                  </small>
                </div>
                <div>
                  <p className="muted">Checklist</p>
                  <small>{(project.checklists || []).length || "-"} item(s)</small>
                </div>
              </div>
              <div className="project-card-actions">
                <button className="btn btn-outline" type="button" onClick={() => openProjectEditor(project)}>
                  Edit
                </button>
                <button className="btn btn-primary" type="button" onClick={() => saveProjectProgress(project._id)}>
                  Save
                </button>
                <button className="btn btn-danger" type="button" onClick={() => deleteProject(project)}>
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </article>
          ))}
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
                      <small>{task.taskCode || "-"}</small>
                      <p className="task-chip">{task.priority}</p>
                      {task.description ? <p className="two-line">{task.description}</p> : null}
                      <small>
                        {(employee?.firstName || "Unknown")} {(employee?.lastName || "")}{" "}
                        {employee?.employeeId ? `(${employee.employeeId})` : ""}
                      </small>
                      {task.assignedTeam?.name ? <small>Team: {task.assignedTeam.name}</small> : null}
                      {task.checklists?.length ? (
                        <small>
                          Checklist: {task.checklists.filter((item) => item.isChecked).length}/{task.checklists.length}
                        </small>
                      ) : null}
                      <small>{formatDate(task.dueDate)}</small>
                      <button className="btn btn-outline" type="button" onClick={() => openTaskEditor(task)}>
                        Edit Assignment
                      </button>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <FormModal
        title={editingProjectId ? "Edit Project" : "Create Project"}
        open={showProjectModal}
        onClose={closeProjectModal}
      >
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
            Project Code
            <input value={editingProjectId ? state.projects.find((row) => row._id === editingProjectId)?.code || "-" : nextProjectCode} disabled />
          </label>
          <label>
            Assignment Type
            <select
              value={projectForm.assignmentType}
              onChange={(event) =>
                setProjectForm((prev) => ({
                  ...prev,
                  assignmentType: event.target.value,
                  members: [],
                  assignedTeam: ""
                }))
              }
            >
              <option value="individual">Individual</option>
              <option value="team">Team</option>
            </select>
          </label>
          {projectForm.assignmentType === "individual" ? (
            <label className="full-width">
              Assign Members
              <select
                multiple
                size={5}
                value={projectForm.members}
                onChange={(event) =>
                  setProjectForm((prev) => ({
                    ...prev,
                    members: Array.from(event.target.selectedOptions, (option) => option.value)
                  }))
                }
              >
                {state.employees.map((employee) => (
                  <option key={employee.user?._id} value={employee.user?._id}>
                    {employee.firstName} {employee.lastName} {employee.employeeId ? `(${employee.employeeId})` : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label>
              Assign Team
              <select
                required
                value={projectForm.assignedTeam}
                onChange={(event) => setProjectForm((prev) => ({ ...prev, assignedTeam: event.target.value }))}
              >
                <option value="">Select team</option>
                {state.teams.map((team) => (
                  <option key={team._id} value={team._id} disabled={!(team.members || []).length}>
                    {team.name} ({team.code}) {(team.members || []).length ? `- ${team.members.length} member(s)` : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
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
          <div className="full-width checklist-wrap">
            <div className="card-head">
              <h3>Project Checklist Template</h3>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() =>
                  setProjectForm((prev) => ({
                    ...prev,
                    checklists: [...(prev.checklists || []), { title: "", description: "" }]
                  }))
                }
              >
                Add Checkbox
              </button>
            </div>
            <div className="checklist-stack">
              {(projectForm.checklists || []).map((item, index) => (
                <div className="checklist-item" key={index}>
                  <input
                    placeholder="Checklist title"
                    value={item.title}
                    onChange={(event) =>
                      setProjectForm((prev) => ({
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
                      setProjectForm((prev) => ({
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
                      setProjectForm((prev) => ({
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
            {editingProjectId ? "Update Project" : "Save Project"}
          </button>
        </form>
      </FormModal>

      <FormModal title={editingTaskId ? "Edit Assignment" : "Assign Task"} open={showTaskModal} onClose={closeTaskModal}>
        <form className="form-grid" onSubmit={createTask}>
          <label>
            Task ID
            <input value={editingTaskId ? taskForm.taskCode || "-" : nextTaskCode} disabled />
          </label>
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
                  {team.name} ({team.code}){" "}
                  {(team.members || []).length ? `- ${team.members.length} member(s)` : "- No members"}
                </option>
              ))}
            </select>
          </label>
          <label>
            Project
            <select
              value={taskForm.project}
              onChange={(event) => {
                const selectedProject = state.projects.find((project) => project._id === event.target.value);
                const seededChecklists = (selectedProject?.checklists || []).map((item) => ({
                  title: item.title || "",
                  description: item.description || ""
                }));

                setTaskForm((prev) => ({
                  ...prev,
                  project: event.target.value,
                  assignMode: selectedProject?.assignmentType === "team" ? "team" : prev.assignMode,
                  assignedTeam:
                    selectedProject?.assignmentType === "team" ? selectedProject?.assignedTeam?._id || "" : prev.assignedTeam,
                  checklists:
                    seededChecklists.length && !(prev.checklists || []).some((row) => row.title?.trim())
                      ? seededChecklists
                      : prev.checklists
                }));
              }}
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
            Status
            <select
              value={taskForm.status}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, status: event.target.value }))}
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
              value={taskForm.progress}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, progress: clampProgress(event.target.value) }))}
            />
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
            <div className="checklist-stack">
              {(taskForm.checklists || []).map((item, index) => (
                <div className="checklist-item" key={index}>
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
            {editingTaskId ? "Save Assignment" : "Assign Task"}
          </button>
        </form>
      </FormModal>
    </section>
  );
};

export default AdminProjectsPage;
