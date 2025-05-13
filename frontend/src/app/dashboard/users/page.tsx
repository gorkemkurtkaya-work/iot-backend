'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

enum UserRole {
  SYSTEM_ADMIN = 'system_admin',
  COMPANY_ADMIN = 'company_admin',
  USER = 'user'
}

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company_id: string;
}

interface Company {
  id: string;
  name: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Yeni kullanıcı ekleme için
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.USER,
    company_id: ''
  });
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Kullanıcı profili bilgilerini al
        const userResponse = await axios.get('http://localhost:3000/auth/profile', {
          withCredentials: true
        });
        
        if (userResponse.data) {
          setCurrentUser(userResponse.data);
          
          // Sadece System Admin ve Company Admin rolleri için erişim sağla
          if (userResponse.data.role === UserRole.SYSTEM_ADMIN || 
              userResponse.data.role === UserRole.COMPANY_ADMIN) {
            
            // Şirketleri çek
            const companiesResponse = await axios.get('http://localhost:3000/companies', {
              withCredentials: true
            });
            setCompanies(companiesResponse.data);
            
            // Kullanıcıları çek
            const usersResponse = await axios.get('http://localhost:3000/users', {
              withCredentials: true
            });
            
            // Eğer Company Admin ise sadece kendi şirketindeki kullanıcıları filtrele
            if (userResponse.data.role === UserRole.COMPANY_ADMIN) {
              const filteredUsers = usersResponse.data.filter(
                (user: User) => user.company_id === userResponse.data.company_id
              );
              setUsers(filteredUsers);
            } else {
              // System Admin tüm kullanıcıları görebilir
              setUsers(usersResponse.data);
            }
          } else {
            // Yetkisiz kullanıcılar için erişimi engelle
            setError('Bu sayfaya erişim yetkiniz bulunmamaktadır');
          }
        }
      } catch (err) {
        console.error('Veri çekme hatası:', err);
        setError('Veriler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Company Admin için otomatik şirket ataması
    if (currentUser?.role === UserRole.COMPANY_ADMIN) {
      setNewUser(prev => ({
        ...prev,
        company_id: currentUser.company_id
      }));
    }

    // company_id kontrolü
    if (!newUser.company_id) {
      await Swal.fire({
        icon: 'error',
        title: 'Hata!',
        text: 'Şirket seçimi zorunludur',
        confirmButtonText: 'Tamam'
      });
      return;
    }
    
    try {
      const response = await axios.post(
        'http://localhost:3000/users/register',
        newUser,
        { withCredentials: true }
      );
      
      setUsers([...users, response.data]);
      setShowAddModal(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: UserRole.USER,
        company_id: ''
      });

      await Swal.fire({
        icon: 'success',
        title: 'Başarılı!',
        text: 'Kullanıcı başarıyla eklendi.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Kullanıcı eklenirken hata:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Hata!',
        text: 'Kullanıcı oluşturulurken bir hata oluştu.',
        confirmButtonText: 'Tamam'
      });
    }
  };
  
  // Kullanıcının rolünü güncelle
  const handleUpdateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const response = await axios.put(
        `http://localhost:3000/users/${userId}/role`,
        { role: newRole },
        { withCredentials: true }
      );
      
      // Güncellenen kullanıcıyı state'de de güncelle
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      );
      
      setUsers(updatedUsers);
    } catch (err) {
      console.error('Kullanıcı rolü güncellenirken hata:', err);
      setError('Kullanıcı rolü güncellenirken bir hata oluştu');
    }
  };
  
  // Kullanıcının şirketini güncelle
  const handleUpdateUserCompany = async (userId: string, companyId: string) => {
    try {
      const response = await axios.put(
        `http://localhost:3000/users/${userId}`,
        { company_id: companyId },
        { withCredentials: true }
      );
      
      // Güncellenen kullanıcıyı state'de de güncelle
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, company_id: companyId } : user
      );
      
      setUsers(updatedUsers);
    } catch (err) {
      console.error('Kullanıcı şirketi güncellenirken hata:', err);
      setError('Kullanıcı şirketi güncellenirken bir hata oluştu');
    }
  };
  
  // Rol adını Türkçe olarak getir
  const getRoleName = (role: UserRole): string => {
    switch (role) {
      case UserRole.SYSTEM_ADMIN:
        return 'Sistem Yöneticisi';
      case UserRole.COMPANY_ADMIN:
        return 'Şirket Yöneticisi';
      case UserRole.USER:
        return 'Kullanıcı';
      default:
        return 'Bilinmeyen Rol';
    }
  };
  
  // Şirket adını getir
  const getCompanyName = (companyId: string): string => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : 'Şirket Atanmamış';
  };
  
  // Kullanıcı sayfasında modal göstermeyi ele alış şeklimizi değiştiriyoruz
  const renderAddUserModal = () => {
    if (!showAddModal) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-0 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
          <button 
            onClick={() => setShowAddModal(false)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Yeni Kullanıcı Ekle
          </h3>
          
          <form onSubmit={handleAddUser}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  E-posta
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Şifre
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                />
              </div>
              
              {/* Şirket seçimi - Eğer company admin ise sadece kendi şirketini seçebilir */}
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                  Şirket
                </label>
                {currentUser?.role === UserRole.SYSTEM_ADMIN ? (
                  <select
                    id="company"
                    name="company"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={newUser.company_id}
                    onChange={(e) => setNewUser({...newUser, company_id: e.target.value})}
                  >
                    <option value="">Şirket Seçiniz</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                ) : (
                  <div>
                    <input
                      type="hidden"
                      name="company_id"
                      value={currentUser?.company_id || ''}
                    />
                    <p className="mt-1 text-sm text-gray-600">
                      {getCompanyName(currentUser?.company_id || '')}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Rol seçimi - System Admin tüm rolleri, Company Admin sadece User ve Company Admin seçebilir */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Rol
                </label>
                <select
                  id="role"
                  name="role"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}
                >
                  <option value={UserRole.USER}>{getRoleName(UserRole.USER)}</option>
                  <option value={UserRole.COMPANY_ADMIN}>{getRoleName(UserRole.COMPANY_ADMIN)}</option>
                  {currentUser?.role === UserRole.SYSTEM_ADMIN && (
                    <option value={UserRole.SYSTEM_ADMIN}>{getRoleName(UserRole.SYSTEM_ADMIN)}</option>
                  )}
                </select>
              </div>
            </div>
            
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
              >
                Kullanıcı Ekle
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                onClick={() => setShowAddModal(false)}
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }
  
  // Kullanıcı yetkili değilse erişimi reddet
  if (currentUser?.role !== UserRole.SYSTEM_ADMIN && currentUser?.role !== UserRole.COMPANY_ADMIN) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-xl text-red-600">Bu sayfaya erişim yetkiniz bulunmamaktadır</div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Kullanıcılar</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
          >
            Yeni Kullanıcı Ekle
          </button>
        </div>
        
        {/* Kullanıcılar Tablosu */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kullanıcı Adı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E-posta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Şirket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* Rol seçimi - System Admin tüm rolleri değiştirebilir, Company Admin sadece User verebilir */}
                      {currentUser?.role === UserRole.SYSTEM_ADMIN ? (
                        <select
                          className="text-sm text-gray-900 border border-gray-300 rounded-md p-1"
                          value={user.role}
                          onChange={(e) => handleUpdateUserRole(user.id, e.target.value as UserRole)}
                        >
                          <option value={UserRole.USER}>{getRoleName(UserRole.USER)}</option>
                          <option value={UserRole.COMPANY_ADMIN}>{getRoleName(UserRole.COMPANY_ADMIN)}</option>
                          <option value={UserRole.SYSTEM_ADMIN}>{getRoleName(UserRole.SYSTEM_ADMIN)}</option>
                        </select>
                      ) : (
                        // Company Admin sadece kendi şirketinde ve System Admin olmayan kullanıcıların rolünü değiştirebilir
                        user.role !== UserRole.SYSTEM_ADMIN && user.company_id === currentUser?.company_id ? (
                          <select
                            className="text-sm text-gray-900 border border-gray-300 rounded-md p-1"
                            value={user.role}
                            onChange={(e) => handleUpdateUserRole(user.id, e.target.value as UserRole)}
                          >
                            <option value={UserRole.USER}>{getRoleName(UserRole.USER)}</option>
                            <option value={UserRole.COMPANY_ADMIN}>{getRoleName(UserRole.COMPANY_ADMIN)}</option>
                          </select>
                        ) : (
                          <div className="text-sm text-gray-500">{getRoleName(user.role)}</div>
                        )
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* Şirket seçimi - Sadece System Admin şirketi değiştirebilir */}
                      {currentUser?.role === UserRole.SYSTEM_ADMIN ? (
                        <select
                          className="text-sm text-gray-900 border border-gray-300 rounded-md p-1"
                          value={user.company_id || ''}
                          onChange={(e) => handleUpdateUserCompany(user.id, e.target.value)}
                        >
                          <option value="">Şirket Seçiniz</option>
                          {companies.map(company => (
                            <option key={company.id} value={company.id}>{company.name}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-sm text-gray-500">{getCompanyName(user.company_id)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => {/* Kullanıcı silme fonksiyonu */}}
                        disabled={user.id === currentUser?.id} // Kendini silemez
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
                
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Henüz kullanıcı bulunmamaktadır. Yeni bir kullanıcı ekleyin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Yeni Modal Render Metodu Kullanılıyor */}
      {renderAddUserModal()}
    </div>
  );
} 