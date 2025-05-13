'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

enum UserRole {
  SYSTEM_ADMIN = 'system_admin',
  COMPANY_ADMIN = 'company_admin',
  USER = 'user'
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState('Kullanıcı');
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userRoleEnum, setUserRoleEnum] = useState<UserRole | null>(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Önce cookie'den kullanıcı profili bilgisini almayı dene
        try {
          const profileResponse = await axios.get('http://localhost:3000/auth/profile', {
            withCredentials: true
          });
          
          if (profileResponse.data) {
            const userData = profileResponse.data;
            setUserName(userData.username || userData.name || 'Kullanıcı');
            const role = userData.role || 'user';
            setUserRole(getRoleName(role));
            setUserRoleEnum(role as UserRole);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.log('API profile isteği başarısız, localStorage kullanılacak');
        }
        
        // API çağrısı başarısız olursa localStorage'dan dene
        const userInfo = localStorage.getItem('user_info');
        
        if (userInfo) {
          const userData = JSON.parse(userInfo);
          setUserName(userData.name || 'Kullanıcı');
          const role = userData.role || 'user';
          setUserRole(getRoleName(role));
          setUserRoleEnum(role as UserRole);
          setIsLoading(false);
        } else {
          // Eğer localStorage'da kullanıcı bilgisi yoksa login sayfasına yönlendir
          console.error('Kullanıcı bilgileri bulunamadı');
          router.push('/login');
        }
      } catch (error) {
        console.error('Oturum kontrolü yapılırken hata oluştu:', error);
        router.push('/login');
      }
    };

    checkAuthentication();
  }, [router]);

  // Rol adını Türkçe olarak döndürür
  const getRoleName = (role: string): string => {
    switch (role) {
      case UserRole.SYSTEM_ADMIN:
        return 'Sistem Yöneticisi';
      case UserRole.COMPANY_ADMIN:
        return 'Şirket Yöneticisi';
      case UserRole.USER:
        return 'Kullanıcı';
      default:
        return 'Kullanıcı';
    }
  };

  const handleLogout = () => {
    // Tarayıcıdan cookie'yi kaldırmak için document.cookie'yi kullanabiliriz
    document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    // Local storage'dan kullanıcı bilgilerini temizle
    localStorage.removeItem('user_info');
    
    // Login sayfasına yönlendir
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">IoT Panel</h2>
        </div>
        
        {/* Sidebar Menu Items */}
        <div className="flex-grow px-4 py-6">
          <ul className="space-y-2">
            <li>
              <a href="/dashboard" className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </a>
            </li>
            
            {/* Şirketler - Sadece System Admin ve Company Admin için göster */}
            {userRoleEnum === UserRole.SYSTEM_ADMIN && (
              <li>
                <a href="/dashboard/companies" className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Şirketler
                </a>
              </li>
            )}
            
            {/* Kullanıcılar - Sadece System Admin ve Company Admin için göster */}
            {(userRoleEnum === UserRole.SYSTEM_ADMIN || userRoleEnum === UserRole.COMPANY_ADMIN) && (
              <li>
                <a href="/dashboard/users" className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Kullanıcılar
                </a>
              </li>
            )}
            
            <li>
              <a href="/dashboard/cihazlar" className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                Cihazlar
              </a>
            </li>
            
            {/* Entegrasyonlar - Sadece System Admin için */}
            {userRoleEnum === UserRole.SYSTEM_ADMIN && (
              <li>
                <a href="/dashboard/integrations" className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Entegrasyonlar
                </a>
              </li>
            )}
            
            {/* Loglar - Sadece System Admin için */}
            {userRoleEnum === UserRole.SYSTEM_ADMIN && (
              <li>
                <a href="/dashboard/logs" className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Sistem Logları
                </a>
              </li>
            )}
            
            <li>
              <a href="/dashboard/ayarlar" className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Ayarlar
              </a>
            </li>
          </ul>
        </div>
        
        {/* User Profile */}
        <div className="mt-auto border-t p-4 relative">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center w-full p-2 rounded-lg hover:bg-gray-200"
          >
            <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white mr-3">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-grow">
              <p className="text-sm font-medium text-gray-700">{userName}</p>
              <p className="text-xs text-gray-500">{userRole}</p>
            </div>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute bottom-full left-0 w-full p-2 bg-white shadow-lg rounded-lg border">
              <ul>
                <li>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center p-2 text-red-600 rounded-lg hover:bg-gray-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Çıkış Yap
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
} 