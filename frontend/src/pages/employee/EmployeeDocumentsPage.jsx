import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { documentApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import DataTable from "../../components/common/DataTable";
import { formatDate, resolveFileUrl } from "../../utils/format";

const EmployeeDocumentsPage = () => {
  const [state, setState] = useState({ loading: true, error: "", rows: [] });
  const [uploadType, setUploadType] = useState("resume");

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      const response = await documentApi.my({ limit: 50 });
      setState({ loading: false, error: "", rows: response.data || [] });
    } catch (error) {
      setState({ loading: false, error: error.message, rows: [] });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await documentApi.upload({ file, type: uploadType, visibility: "private" });
      toast.success("Document uploaded");
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (state.loading) return <LoadingSpinner label="Loading documents..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={loadData} />;

  return (
    <section className="page-grid">
      <header className="page-head">
        <h1>Documents</h1>
      </header>

      <div className="card action-row">
        <div>
          <h3>Upload Resume / Certificates</h3>
          <p className="muted">Store and access HR documents securely.</p>
        </div>
        <div className="button-row">
          <select value={uploadType} onChange={(event) => setUploadType(event.target.value)}>
            <option value="resume">Resume</option>
            <option value="certificate">Certificate</option>
            <option value="other">Other</option>
          </select>
          <label className="btn btn-primary">
            Upload File
            <input type="file" hidden onChange={handleUpload} />
          </label>
        </div>
      </div>

      <section className="card">
        <div className="card-head">
          <h3>Document Library</h3>
        </div>
        <DataTable
          rows={state.rows}
          columns={[
            { key: "originalName", label: "File Name" },
            { key: "type", label: "Type" },
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
