const Card = ({ children, className = '', title, subtitle, noPadding = false }) => (
  <div className={`card ${className}`}>
    {(title || subtitle) && (
      <div className="mb-6 pb-4 border-b border-slate-100">
        {title && <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>}
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    )}
    <div className={`relative ${noPadding ? '' : 'p-8'}`}>
      {children}
    </div>
  </div>
);

export default Card;
