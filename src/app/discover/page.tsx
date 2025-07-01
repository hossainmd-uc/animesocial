import Header from '@/src/components/layout/Header';

export default function DiscoverPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🌟</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover</h1>
          <p className="text-gray-600 mb-8">Find new anime recommendations and trending content</p>
          
          <div className="bg-white rounded-lg shadow-sm border p-8 max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Coming Soon</h2>
            <p className="text-gray-600">
              This page will feature:
            </p>
            <ul className="text-left text-gray-600 mt-4 space-y-2">
              <li>• Trending anime</li>
              <li>• Personalized recommendations</li>
              <li>• Popular this season</li>
              <li>• Community favorites</li>
              <li>• Top rated anime</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 