const StatCard = ({ 
  label, 
  value, 
  icon: Icon, 
  color = 'blue',
  trend,
  trendValue 
}) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    gray: 'bg-gray-500'
  }

  const trendColorClasses = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  }

  return (
    <div className="bg-white rounded-xl p-4 lg:p-6 border border-gray-200 hover:shadow-lg transition-all duration-200 hover:scale-105">
      <div className="flex items-center justify-between mb-3 lg:mb-4">
        {Icon && (
          <div className={`${colorClasses[color]} p-2 lg:p-3 rounded-lg shadow-md`}>
            <Icon className="text-white" size={20} />
          </div>
        )}
      </div>
      
      <p className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs lg:text-sm text-gray-500">{label}</p>
      
      {trend && trendValue && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className={`text-xs lg:text-sm font-medium ${trendColorClasses[trend]}`}>
            {trend === 'up' && '↑ '}
            {trend === 'down' && '↓ '}
            {trendValue}
          </span>
          <span className="text-xs text-gray-500 ml-2">vs mois dernier</span>
        </div>
      )}
    </div>
  )
}

export default StatCard