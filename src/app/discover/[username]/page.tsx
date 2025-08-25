import { notFound } from 'next/navigation';
import Header from '@/src/components/layout/Header';
import ProfileView from '@/src/components/profile/ProfileView';

interface PageProps {
  params: {
    username: string;
  };
}

async function getUserProfile(username: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/user/profile/${username}`, {
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = params;
  
  const profileData = await getUserProfile(username);
  
  if (!profileData) {
    notFound();
  }

  return (
    <div className="gamer-gradient transition-colors duration-300 relative h-screen overflow-y-auto">
      {/* Enhanced Floating Particles Background */}
      <div className="floating-particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle particle-hex"></div>
        <div className="particle particle-hex"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle particle-hex"></div>
        <div className="particle"></div>
      </div>
      
      {/* Stylized Vertical Profile Text */}
      <div className="dashboard-text">
        PROFILE
      </div>
      
      <Header />
      
      {/* Main Content Section */}
      <section className="container mx-auto px-6 relative z-10 py-10">
        <ProfileView profileData={profileData} />
      </section>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = params;
  const profileData = await getUserProfile(username);
  
  if (!profileData) {
    return {
      title: 'Profile Not Found',
    };
  }
  
  return {
    title: `${profileData.displayName || profileData.username} - Profile`,
    description: profileData.bio || `View ${profileData.displayName || profileData.username}'s profile`,
  };
}
