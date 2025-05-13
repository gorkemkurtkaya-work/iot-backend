'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkLoginStatus = () => {
      try {
        // localStorage'dan kullanıcı bilgilerini kontrol et
        const userInfo = localStorage.getItem('user_info');
        
        // Eğer localStorage'da kullanıcı bilgisi varsa dashboard'a yönlendir
        if (userInfo) {
          router.push('/dashboard');
        }
      } catch (error) {
        console.log('Kullanıcı giriş yapmamış');
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return children;
} 