import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FileStack, FolderOpenDot, UploadCloud } from "lucide-react";
import { documentApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import DataTable from "../../components/common/DataTable";
import { formatDate, resolveFileUrl } from "../../utils/format";

const initialUpload = {
  type: "resume",
  visibility: "private",
  category: "",
  description: "",
  tags: "",
  expiresOn: "",
  file: null
};

const EmployeeDocumentsPage = () => {
  const [state, setState] = useState({ loading: true, error: "", rows: [] });
  const [upload, setUpload] = useState(initialUpload);
  const [filters, setFilters] = useState({ search: "", type: "", visibility: "" });

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      const response = await documentApi.my({
        limit: 100,
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.visibility ? { visibility: filters.visibility } : {})
      });
      setState({ loading: false, error: "", rows: response.data || [] });
    } catch (error) {
      setState({ loading: false, error: error.message, rows: [] });
    }
  }, [filters.search, filters.type, filters.visibility]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!upload.file) {
      toast.error("Please choose a file");
      return;
    }

    try {
      await documentApi.upload(upload);
      toast.success("Document uploaded");
      setUpload(initialUpload);
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const stats = useMemo(() => {
    const expiringSoon = state.rows.filter((row) => {
      if (!row.expiresOn) return false;
      const days = (new Date(row.expiresOn).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return days >= 0 && days <= 30;
    }).length;
    return {
      total: state.rows.length,
      certificates: state.rows.filter((row) => row.type === "certificate").length,
      expiringSoon
    };
  }, [state.rows]);

  if (state.loading) return <LoadingSpinner label="Loading documents..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={loadData} />;

  return (
    <section className="page-grid">
      <header className="page-head">
        <h1>Documents</h1>
      </header>

      <div className="kpi-grid">
        <article className="card kpi-card">
          <div className="kpi-head">
            <span>Total Files</span>
            <FileStack size={18} />
          </div>
          <h2>{stats.total}</h2>
        </article>
        <article className="card kpi-card">
          <div className="kpi-head">
            <span>Certificates</span>
            <FolderOpenDot size={18} />
          </div>
          <h2>{stats.certificates}</h2>
        </article>
        <article className="card kpi-card">
          <div className="kpi-head">
            <span>Expiring Soon</span>
            <UploadCloud size={18} />
          </div>
          <h2>{stats.expiringSoon}</h2>
        </article>
      </div>

      <form className="card form-grid" onSubmit={handleUpload}>
        <h3>Upload Document</h3>
        <label>
          Type
          <select value={upload.type} onChange={(event) => setUpload((prev) => ({ ...prev, type: event.target.value }))}>
            <option value="resume">Resume</option>
            <option value="certificate">Certificate</option>
            <option value="id-proof">ID Proof</option>
            <option value="payroll">Payroll</option>
            <option value="policy">Policy</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          Visibility
          <select
            value={upload.visibility}
            onChange={(event) => setUpload((prev) => ({ ...prev, visibility: event.target.value }))}
          >
            <option value="private">Private</option>
            <option value="hr-only">HR Only</option>
            <option value="shared">Shared</option>
          </select>
        </label>
        <label>
          Category
          <input
            value={upload.category}
            onChange={(event) => setUpload((prev) => ({ ...prev, category: event.target.value }))}
            placeholder="Onboarding / Compliance"
          />
        </label>
        <label>
          Expires On
          <input
            type="date"
            value={upload.expiresOn}
            onChange={(event) => setUpload((prev) => ({ ...prev, expiresOn: event.target.value }))}
          />
        </label>
        <label className="full-width">
          Description
          <textarea
            value={upload.description}
            onChange={(event) => setUpload((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Add reference notes"
          />
        </label>
        <label className="full-width">
          Tags (comma separated)
          <input
            value={upload.tags}
            onChange={(event) => setUpload((prev) => ({ ...prev, tags: event.target.value }))}
            placeholder="resume, 2026, verified"
          />
        </label>
        <label className="btn btn-outline">
          <UploadCloud size={14} />
          Select File
          <input
            type="file"
            hidden
            onChange={(event) =>
              setUpload((prev) => ({
                ...prev,
                file: event.target.files?.[0] || null
              }))
            }
          />
        </label>
        <button className="btn btn-primary" type="submit">
          Upload File
        </button>
      </form>

      <section className="card action-row">
        <div className="inline-title">
          <FolderOpenDot size={16} />
          <h3>Document Filters</h3>
        </div>
        <div className="button-row">
          <input
            placeholder="Search name/category/tags"
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
          />
          <select value={filters.type} onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))}>
            <option value="">All types</option>
            <option value="resume">Resume</option>
            <option value="certificate">Certificate</option>
            <option value="id-proof">ID Proof</option>
            <option value="payroll">Payroll</option>
            <option value="policy">Policy</option>
            <option value="other">Other</option>
          </select>
          <select
            value={filters.visibility}
            onChange={(event) => setFilters((prev) => ({ ...prev, visibility: event.target.value }))}
          >
            <option value="">All visibility</option>
            <option value="private">Private</option>
            <option value="hr-only">HR Only</option>
            <option value="shared">Shared</option>
          </select>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Document Library</h3>
        </div>
        <DataTable
          rows={state.rows}
          columns={[
            { key: "originalName", label: "File Name" },
            { key: "type", label: "Type" },
            { key: "category", label: "Category" },
            { key: "visibility", label: "Visibility", type: "status" },
            { key: "expiresOn", label: "Expires On", render: (value) => formatDate(value) },
            { key: "createdAt", label: "Uploaded On", render: (value) => formatDate(value) },
            {
              key: "fileUrl",
              label: "Open",
              render: (value) => (
                <a href={resolveFileUrl(value)} target="_blank" rel="noreferrer">
                  View
                </a>
              )
            }
          ]}
        />
      </section>
    </section>
  );
};

export default EmployeeDocumentsPage;
