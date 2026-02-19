import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { employeeApi, projectApi, taskApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import FormModal from "../../components/common/FormModal";
import DataTable from "../../components/common/DataTable";
import { formatDate } from "../../utils/format";

const initialProject = {
  name: "",
  code: "",
  description: "",
  startDate: "",
  endDate: "",
  status: "planning"
};

const initialTask = {
  title: "",
  assignedTo: "",
  project: "",
  dueDate: "",
  priority: "medium",
  description: ""
};

const AdminProjectsPage = () => {
  const [state, setState] = useState({
    loading: true,
    error: "",
    projects: [],
    tasks: [],
    employees: []
  });
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [projectForm, setProjectForm] = useState(initialProject);
  const [taskForm, setTaskForm] = useState(initialTask);

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      const [projectsRes, tasksRes, employeeRes] = await Promise.all([
        projectApi.list({ limit: 100 }),
        taskApi.admin({ limit: 100 }),
        employeeApi.list({ limit: 200 })
      ]);
      setState({
        loading: false,
        error: "",
        projects: projectsRes.data || [],
        tasks: tasksRes.data || [],
        employees: employeeRes.data || []
      });
    } catch (error) {
      setState({ loading: false, error: error.message, projects: [], tasks: [], employees: [] });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createProject = async (event) => {
    event.preventDefault();
    try {
      await projectApi.create(projectForm);
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
      await taskApi.create(taskForm);
      toast.success("Task assigned");
      setTaskForm(initialTask);
      setShowTaskModal(false);
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
      buckets[task.status]?.push(task);
    });
    return buckets;
  }, [state.tasks]);

  if (state.loading) return <LoadingSpinner label="Loading projects and tasks..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={loadData} />;

  return (
    <section className="page-grid">
      <header className="page-head">
        <h1>Project & Task Management</h1>
        <div className="button-row">
          <button className="btn btn-outline" type="button" onClick={() => setShowTaskModal(true)}>
            Assign Task
          </button>
          <button className="btn btn-primary" type="button" onClick={() => setShowProjectModal(true)}>
            Create Project
          </button>
        </div>
      </header>

      <section className="card">
        <div className="card-head">
          <h3>Projects</h3>
        </div>
        <DataTable
          rows={state.projects}
          columns={[
            { key: "name", label: "Project" },
            { key: "code", label: "Code" },
            { key: "status", label: "Status", type: "status" },
            { key: "progress", label: "Progress", render: (value) => `${value || 0}%` },
            { key: "startDate", label: "Start", render: (value) => formatDate(value) },
            { key: "endDate", label: "End", render: (value) => formatDate(value) }
          ]}
        />
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Task Kanban View</h3>
        </div>
        <div className="kanban-grid">
          {Object.entries(statusBuckets).map(([key, tasks]) => (
            <div className="kanban-column" key={key}>
              <h4>{key}</h4>
              <div className="kanban-list">
                {tasks.map((task) => (
                  <article className="kanban-card" key={task._id}>
                    <strong>{task.title}</strong>
                    <p>{task.priority}</p>
                    <small>{formatDate(task.dueDate)}</small>
                  </article>
                ))}
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
          <label className="full-width">
            Description
            <textarea
              value={projectForm.description}
              onChange={(event) => setProjectForm((prev) => ({ ...prev, description: event.target.value }))}
            />
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
            Employee
            <select
              required
              value={taskForm.assignedTo}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, assignedTo: event.target.value }))}
            >
              <option value="">Select employee</option>
              {state.employees.map((employee) => (
                <option key={employee.user?._id} value={employee.user?._id}>
                  {employee.firstName} {employee.lastName}
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
          <button className="btn btn-primary" type="submit">
            Assign Task
          </button>
        </form>
      </FormModal>
    </section>
  );
};

export default AdminProjectsPage;
