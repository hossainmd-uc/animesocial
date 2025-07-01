export default function RecentActivitySection() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
      </div>
      
      <div className="space-y-4">
        {/* Placeholder activity items */}
        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-gray-100 rounded-lg h-16 flex items-center px-4">
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded mb-2 w-4/5"></div>
              <div className="h-2 bg-gray-200 rounded w-3/5"></div>
            </div>
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-center">
        <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
          <span className="text-lg">?</span>
        </button>
      </div>
    </div>
  )
} 