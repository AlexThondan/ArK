const FormModal = ({ title, open, onClose, children, width = "560px" }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div className="modal" style={{ maxWidth: width }} role="dialog" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="btn btn-ghost" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export default FormModal;
