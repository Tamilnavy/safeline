const Badge = ({ children, variant = 'pending' }) => {
  const variants = {
    pending: 'badge-pending',
    success: 'badge-success',
    danger: 'badge-danger',
    info: 'badge-info' // We can add this to CSS if needed
  };

  return (
    <span className={`badge ${variants[variant] || variants.pending}`}>
      {children}
    </span>
  );
};

export default Badge;
