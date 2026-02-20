const ErrorState = ({ message, onRetry }) => (
  <div className="state-card error">
    <h3>Something went wrong</h3>
    <p>{message || "Unable to load data"}</p>
    {onRetry ? (
      <button className="btn btn-primary" onClick={onRetry} type="button">
        Retry
      </button>
    ) : null}
  </div>
);

export default ErrorState;
