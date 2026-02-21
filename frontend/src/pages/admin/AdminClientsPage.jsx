import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Building2, PlusCircle, UploadCloud } from "lucide-react";
import { City, Country, State } from "country-state-city";
import { clientApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import DataTable from "../../components/common/DataTable";
import FormModal from "../../components/common/FormModal";
import { formatCurrency, resolveFileUrl } from "../../utils/format";

const initialClient = {
  name: "",
  company: "",
  contactRole: "",
  email: "",
  phone: "",
  industry: "",
  website: "",
  timezone: "",
  country: "",
  state: "",
  city: "",
  contractValue: "",
  status: "active",
  address: "",
  notes: "",
  logoFile: null
};

const AdminClientsPage = () => {
  const [state, setState] = useState({ loading: true, error: "", rows: [] });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialClient);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const countries = useMemo(() => Country.getAllCountries(), []);
  const countryCode = useMemo(
    () => countries.find((item) => item.name === form.country)?.isoCode || "",
    [countries, form.country]
  );
  const states = useMemo(() => (countryCode ? State.getStatesOfCountry(countryCode) : []), [countryCode]);
  const stateCode = useMemo(
    () => states.find((item) => item.name === form.state)?.isoCode || "",
    [states, form.state]
  );
  const cities = useMemo(
    () => (countryCode && stateCode ? City.getCitiesOfState(countryCode, stateCode) : []),
    [countryCode, stateCode]
  );

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      const response = await clientApi.list({
        limit: 100,
        ...(search ? { search } : {}),
        ...(status ? { status } : {})
      });
      setState({ loading: false, error: "", rows: response.data || [] });
    } catch (error) {
      setState({ loading: false, error: error.message, rows: [] });
    }
  }, [search, status]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      const { logoFile, ...payload } = form;
      const response = await clientApi.create(payload);
      if (logoFile && response?.data?._id) {
        await clientApi.uploadLogo(response.data._id, logoFile);
      }
      toast.success("Client added");
      setForm(initialClient);
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const uploadLogo = async (clientId, file) => {
    if (!file) return;
    try {
      await clientApi.uploadLogo(clientId, file);
      toast.success("Client logo updated");
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
          <PlusCircle size={14} />
          Add Client
        </button>
      </header>

      <section className="card action-row">
        <div className="inline-title">
          <Building2 size={16} />
          <h3>Client Filters</h3>
        </div>
        <div className="button-row">
          <input
            placeholder="Search company, email, industry"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="prospect">Prospect</option>
          </select>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Clients Directory</h3>
        </div>
        <DataTable
          rows={state.rows}
          columns={[
            {
              key: "logoUrl",
              label: "Logo",
              render: (value, row) => (
                <div className="avatar-cell">
                  {value ? <img className="avatar-img" src={resolveFileUrl(value)} alt={row.company} /> : <span className="avatar-fallback">{(row.company || "C").slice(0, 1)}</span>}
                </div>
              )
            },
            { key: "name", label: "Contact Name" },
            { key: "contactRole", label: "Role" },
            { key: "company", label: "Company" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "industry", label: "Industry" },
            {
              key: "contractValue",
              label: "Contract Value",
              render: (value) => formatCurrency(value)
            },
            { key: "status", label: "Status", type: "status" },
            { key: "address", label: "Address" },
            {
              key: "upload",
              label: "Upload Logo",
              render: (_value, row) => (
                <label className="btn btn-outline">
                  <UploadCloud size={14} />
                  Logo
                  <input type="file" accept="image/*" hidden onChange={(event) => uploadLogo(row._id, event.target.files?.[0])} />
                </label>
              )
            }
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
            Contact Role
            <input
              value={form.contactRole}
              onChange={(event) => setForm((prev) => ({ ...prev, contactRole: event.target.value }))}
              placeholder="Project Lead"
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
          <label>
            Website
            <input
              value={form.website}
              onChange={(event) => setForm((prev) => ({ ...prev, website: event.target.value }))}
              placeholder="https://"
            />
          </label>
          <label>
            Timezone
            <input
              value={form.timezone}
              onChange={(event) => setForm((prev) => ({ ...prev, timezone: event.target.value }))}
              placeholder="Asia/Kolkata"
            />
          </label>
          <label>
            Country
            <select
              value={form.country}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  country: event.target.value,
                  state: "",
                  city: ""
                }))
              }
            >
              <option value="">Select country</option>
              {countries.map((item) => (
                <option key={item.isoCode} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            State
            <select
              value={form.state}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  state: event.target.value,
                  city: ""
                }))
              }
              disabled={!countryCode}
            >
              <option value="">{countryCode ? "Select state" : "Select country first"}</option>
              {states.map((item) => (
                <option key={item.isoCode} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            City
            <select
              value={form.city}
              onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
              disabled={!stateCode}
            >
              <option value="">{stateCode ? "Select city" : "Select state first"}</option>
              {cities.map((item) => (
                <option key={`${item.name}-${item.latitude}-${item.longitude}`} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Contract Value
            <input
              type="number"
              value={form.contractValue}
              onChange={(event) => setForm((prev) => ({ ...prev, contractValue: event.target.value }))}
            />
          </label>
          <label>
            Status
            <select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="prospect">Prospect</option>
            </select>
          </label>
          <label className="full-width">
            Address
            <input
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
            />
          </label>
          <label className="full-width">
            Notes
            <textarea value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
          </label>
          <label className="btn btn-outline">
            <UploadCloud size={14} />
            Upload Client Logo
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => setForm((prev) => ({ ...prev, logoFile: event.target.files?.[0] || null }))}
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
