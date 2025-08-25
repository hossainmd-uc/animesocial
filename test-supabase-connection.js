// Test Supabase connection and real-time
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Testing Supabase connection...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseAnonKey ? 'Present' : 'Missing')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test basic connection
async function testConnection() {
  try {
    const { data, error } = await supabase.from('server_messages').select('id').limit(1)
    if (error) {
      console.error('❌ Database connection failed:', error)
    } else {
      console.log('✅ Database connection successful')
    }
  } catch (err) {
    console.error('❌ Connection error:', err)
  }
}

// Test real-time subscription
function testRealtime() {
  console.log('🔔 Testing real-time subscription...')
  
  const channel = supabase
    .channel('test-channel')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'server_messages' },
      (payload) => console.log('📥 Real-time event:', payload)
    )
    .subscribe((status) => {
      console.log('🔌 Subscription status:', status)
    })

  // Clean up after 5 seconds
  setTimeout(() => {
    supabase.removeChannel(channel)
    console.log('🧹 Test complete')
    process.exit(0)
  }, 5000)
}

testConnection()
testRealtime()
