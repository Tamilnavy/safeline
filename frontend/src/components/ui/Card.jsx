const Card = ({ children, className = '', title, subtitle, noPadding = false }) => (
  <div className={`card ${noPadding ? '!p-0' : ''} ${className}`}>
    {(title || subtitle) && (
      <div className="mb-4 pb-3 border-b border-slate-100">
        {title && <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>}
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    )}
    <div className={`relative ${noPadding ? '' : 'pt-1'}`}>
      {children}
    </div>
  </div>
);

export default Card;
