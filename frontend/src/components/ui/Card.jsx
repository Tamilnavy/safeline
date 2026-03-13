const Card = ({ children, className = '', title, subtitle }) => (
  <div className={`glass-card p-8 ${className}`}>
    {(title || subtitle) && (
      <div className="mb-8 pb-6 border-b border-white/5">
        {title && <h3 className="text-xl font-bold text-white mb-1">{title}</h3>}
        {subtitle && <p className="text-sm text-text-muted">{subtitle}</p>}
      </div>
    )}
    <div className="relative">
      {children}
    </div>
  </div>
);

export default Card;
