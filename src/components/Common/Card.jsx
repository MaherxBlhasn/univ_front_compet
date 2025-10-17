const Card = ({ title, children, actions, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {(title || actions) && (
        <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-200 flex items-center justify-between gap-3">
          {title && <h3 className="text-base lg:text-lg font-semibold text-gray-900 truncate">{title}</h3>}
          {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </div>
      )}
      <div className="p-4 lg:p-6">
        {children}
      </div>
    </div>
  )
}

export default Card
