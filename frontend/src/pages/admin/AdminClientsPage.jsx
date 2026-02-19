import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { clientApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import DataTable from "../../components/common/DataTable";
import FormModal from "../../components/common/FormModal";

const initialClient = {
  name: "",
  company: "",
  email: "",
  phone: "",
  industry: "",
  address: ""
};

const AdminClientsPage = () => {
  const [state, setState] = useState({ loading: true, error: "", rows: [] });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialClient);

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      const response = await clientApi.list({ limit: 100 });
      setState({ loading: false, error: "", rows: response.data || [] });
    } catch (error) {
      setState({ loading: false, error: error.message, rows: [] });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      await clientApi.create(form);
      toast.success("Client added");
      setForm(initialClient);
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (state.loading) return <LoadingSpinner label="Loading clients..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={loadData} />;

  return (
    <section className="page-grid">
      <header className="page-head">
        <h1>Client Management</h1>
        <button className="btn btn-primary" type="button" onClick={() => setShowModal(true)}>
          Add Client
        </button>
      </header>

      <section className="card">
        <div className="card-head">
          <h3>Clients Directory</h3>
        </div>
        <DataTable
          rows={state.rows}
          columns={[
            { key: "name", label: "Contact Name" },
            { key: "company", label: "Company" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "industry", label: "Industry" },
            { key: "address", label: "Address" }
          ]}
        />
      </section>

      <FormModal title="Add Client" open={showModal} onClose={() => setShowModal(false)}>
        <form className="form-grid" onSubmit={handleCreate}>
          <label>
            Contact Name
            <input
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </label>
          <label>
            Company
            <input
              required
              value={form.company}
              onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </label>
          <label>
            Phone
            <input value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
          </label>
          <label>
            Industry
            <input
              value={form.industry}
              onChange={(event) => setForm((prev) => ({ ...prev, industry: event.target.value }))}
            />
          </label>
          <label className="full-width">
            Address
            <input
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
            />
          </label>
          <button className="btn btn-primary" type="submit">
            Save Client
          </button>
        </form>
      </FormModal>
    </section>
  );
};

export default AdminClientsPage;
