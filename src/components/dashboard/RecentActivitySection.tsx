export default function RecentActivitySection() {
  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20 dark:border-gray-700/30">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h2>
      </div>
      
      <div className="space-y-4">
        {/* Placeholder activity items */}
        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-gradient-to-r from-gray-100/60 to-gray-200/60 dark:from-gray-700/60 dark:to-gray-600/60 backdrop-blur-sm rounded-xl h-16 flex items-center px-4 border border-gray-200/30 dark:border-gray-600/30">
            <div className="flex-1">
              <div className="h-3 bg-gray-200/70 dark:bg-gray-600/70 rounded mb-2 w-4/5"></div>
              <div className="h-2 bg-gray-200/70 dark:bg-gray-600/70 rounded w-3/5"></div>
            </div>
            <div className="w-6 h-6 bg-gray-200/70 dark:bg-gray-600/70 rounded border border-gray-300/30 dark:border-gray-500/30"></div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-center">
        <button className="w-8 h-8 bg-gradient-to-r from-gray-100/60 to-gray-200/60 dark:from-gray-700/60 dark:to-gray-600/60 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors border border-gray-300/30 dark:border-gray-600/30">
          <span className="text-lg">?</span>
        </button>
      </div>
    </div>
  )
} 