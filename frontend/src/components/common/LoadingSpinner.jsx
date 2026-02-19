const LoadingSpinner = ({ label = "Loading..." }) => (
  <div className="spinner-wrap">
    <div className="spinner" />
    <p>{label}</p>
  </div>
);

export default LoadingSpinner;
