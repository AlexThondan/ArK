import { useCallback, useEffect, useState } from "react";
import { Users2 } from "lucide-react";
import { teamApi } from "../../api/hrmsApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ErrorState from "../../components/common/ErrorState";
import { resolveFileUrl } from "../../utils/format";

const EmployeeTeamsPage = () => {
  const [state, setState] = useState({ loading: true, error: "", rows: [] });

  const loadData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: "" }));
      const response = await teamApi.list({ limit: 100, isActive: true });
      setState({ loading: false, error: "", rows: response.data || [] });
    } catch (error) {
      setState({ loading: false, error: error.message, rows: [] });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (state.loading) return <LoadingSpinner label="Loading your teams..." />;
  if (state.error) return <ErrorState message={state.error} onRetry={loadData} />;

  return (
    <section className="page-grid">
      <header className="page-head">
        <h1>My Teams</h1>
      </header>

      <div className="team-grid">
        {state.rows.length ? (
          state.rows.map((team) => (
            <article className="card gradient-card team-card" key={team._id}>
              <div className="team-head">
                <div>
                  <h3>{team.name}</h3>
                  <p className="muted">
                    {team.code} {team.department ? `- ${team.department}` : ""}
                  </p>
                </div>
                <Users2 size={18} />
              </div>
              {team.description ? <p className="two-line">{team.description}</p> : null}
              <div className="team-members">
                {(team.members || []).map((member) => (
                  <span className="team-chip with-avatar" key={`${member.user}-${member.teamRole}`}>
                    <span className="avatar-cell small">
                      {member.avatarUrl ? (
                        <img
                          className="avatar-img"
                          src={resolveFileUrl(member.avatarUrl)}
                          alt={`${member.firstName || ""} ${member.lastName || ""}`}
                        />
                      ) : (
                        <span className="avatar-fallback">
                          {(member.firstName || "M").slice(0, 1)}
                          {(member.lastName || "").slice(0, 1)}
                        </span>
                      )}
                    </span>
                    {(member.firstName || "").trim()} {(member.lastName || "").trim()}{" "}
                    {member.teamRole ? `- ${member.teamRole}` : ""}
                  </span>
                ))}
              </div>
            </article>
          ))
        ) : (
          <article className="card">
            <p className="muted">No teams assigned yet.</p>
          </article>
        )}
      </div>
    </section>
  );
};

export default EmployeeTeamsPage;
