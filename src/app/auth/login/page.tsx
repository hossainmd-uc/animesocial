import LoginForm from '@/src/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          {/* Logo */}
          <div className="flex justify-center">
            <img 
              src="/Logo.png" 
              alt="AnimeSocial Logo" 
              className="w-40 h-40 object-contain"
            />
          </div>
          
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Welcome back to your anime social hub
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
} 