const Card = ({ children, className = '', title, subtitle, noPadding = false, hover = true }) => (
  <div className={`glass-card ${hover ? 'hover-lift' : ''} ${className}`}>
    {(title || subtitle) && (
      <div className="px-8 pt-8 pb-6 border-b border-white/5 bg-white/5 rounded-t-2xl">
        {title && <h3 className="text-xl font-bold text-white mb-1">{title}</h3>}
        {subtitle && <p className="text-sm text-text-muted font-medium">{subtitle}</p>}
      </div>
    )}
    <div className={`relative ${noPadding ? '' : 'p-8'}`}>
      {children}
    </div>
  </div>
);

export default Card;
