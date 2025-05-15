'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

enum UserRole {
  SYSTEM_ADMIN = 'system_admin',
  COMPANY_ADMIN = 'company_admin',
  USER = 'user'
}

interface Company {
  id: string;
  name: string;
  created_at?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company_id: string;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Yeni şirket ekleme için
  const [newCompanyName, setNewCompanyName] = useState('');
  const [addingCompany, setAddingCompany] = useState(false);
  
  // Şirket düzenleme için
  const [editCompanyId, setEditCompanyId] = useState<string | null>(null);
  const [editCompanyName, setEditCompanyName] = useState('');
  
  // Modal kontrolü
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  
  // Yeni kullanıcı için
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
        const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/profile`, {
          withCredentials: true
        });
        
        if (userResponse.data) {
          setCurrentUser(userResponse.data);
          
          // Sadece System Admin ise tüm şirketleri getir
          if (userResponse.data.role === UserRole.SYSTEM_ADMIN) {
            const companiesResponse = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/companies`, {
              withCredentials: true
            });
            setCompanies(companiesResponse.data);
            
            const usersResponse = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users`, {
              withCredentials: true
            });
            setUsers(usersResponse.data);
          } else {
            // System Admin değilse, bu sayfaya erişimi engelle
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
  
  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) return;
    
    try {
      setAddingCompany(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/companies`, 
        { name: newCompanyName },
        { withCredentials: true }
      );
      
      setCompanies([...companies, response.data]);
      setNewCompanyName('');
      
      await Swal.fire({
        icon: 'success',
        title: 'Başarılı!',
        text: 'Şirket başarıyla eklendi.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Şirket eklenirken hata:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Hata!',
        text: 'Şirket oluşturulurken bir hata oluştu.',
        confirmButtonText: 'Tamam'
      });
    } finally {
      setAddingCompany(false);
    }
  };
  
  const handleEditCompany = (company: Company) => {
    setEditCompanyId(company.id);
    setEditCompanyName(company.name);
  };
  
  const handleUpdateCompany = async () => {
    if (!editCompanyId || !editCompanyName.trim()) return;
    
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/companies/${editCompanyId}`,
        { name: editCompanyName },
        { withCredentials: true }
      );
      
      const updatedCompanies = companies.map(company => 
        company.id === editCompanyId ? { ...company, name: editCompanyName } : company
      );
      
      setCompanies(updatedCompanies);
      setEditCompanyId(null);
      setEditCompanyName('');

      await Swal.fire({
        icon: 'success',
        title: 'Başarılı!',
        text: 'Şirket başarıyla güncellendi.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Şirket güncellenirken hata:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Hata!',
        text: 'Şirket güncellenirken bir hata oluştu.',
        confirmButtonText: 'Tamam'
      });
    }
  };
  
  const handleDeleteCompany = async (id: string) => {
    const result = await Swal.fire({
      title: 'Emin misiniz?',
      text: "Bu şirketi silmek istediğinize emin misiniz?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Evet, sil!',
      cancelButtonText: 'İptal'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/companies/${id}`, {
          withCredentials: true
        });
        
        setCompanies(companies.filter(company => company.id !== id));

        await Swal.fire({
          icon: 'success',
          title: 'Başarılı!',
          text: 'Şirket başarıyla silindi.',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (err) {
        console.error('Şirket silinirken hata:', err);
        await Swal.fire({
          icon: 'error',
          title: 'Hata!',
          text: 'Şirket silinirken bir hata oluştu.',
          confirmButtonText: 'Tamam'
        });
      }
    }
  };
  
  const openAddUserModal = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setNewUser({
      name: '',
      email: '',
      password: '',
      role: UserRole.USER,
      company_id: companyId
    });
    setShowAddUserModal(true);
  };
  
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.company_id) {
      await Swal.fire({
        icon: 'error',
        title: 'Hata!',
        text: 'Şirket ID\'si gereklidir',
        confirmButtonText: 'Tamam'
      });
      return;
    }
    
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/register`,
        newUser,
        { withCredentials: true }
      );
      
      setUsers([...users, response.data]);
      
      setShowAddUserModal(false);
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
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${userId}/role`,
        { role: newRole },
        { withCredentials: true }
      );
      
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      );
      
      setUsers(updatedUsers);

      await Swal.fire({
        icon: 'success',
        title: 'Başarılı!',
        text: 'Kullanıcı rolü başarıyla güncellendi.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Kullanıcı rolü güncellenirken hata:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Hata!',
        text: 'Kullanıcı rolü güncellenirken bir hata oluştu.',
        confirmButtonText: 'Tamam'
      });
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
  
  // Kullanıcı ekleme modalını render et
  const renderAddUserModal = () => {
    if (!showAddUserModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
          <button 
            onClick={() => setShowAddUserModal(false)}
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
                  <option value={UserRole.SYSTEM_ADMIN}>{getRoleName(UserRole.SYSTEM_ADMIN)}</option>
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
                onClick={() => setShowAddUserModal(false)}
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
  
  // Kullanıcı System Admin değilse erişimi reddet
  if (currentUser?.role !== UserRole.SYSTEM_ADMIN) {
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
          <h1 className="text-3xl font-bold text-gray-900">Şirketler</h1>
          <button
            onClick={() => setAddingCompany(!addingCompany)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
          >
            {addingCompany ? 'İptal' : 'Yeni Şirket Ekle'}
          </button>
        </div>
        
        {/* Yeni Şirket Ekleme Formu */}
        {addingCompany && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Yeni Şirket Ekle</h2>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Şirket Adı"
                className="flex-1 p-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={handleAddCompany}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
              >
                Ekle
              </button>
            </div>
          </div>
        )}
        
        {/* Şirketler Listesi */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-1 divide-y">
            {companies.map(company => (
              <div key={company.id} className="p-6">
                <div className="flex justify-between items-center">
                  {editCompanyId === company.id ? (
                    <div className="flex items-center space-x-4 flex-1">
                      <input
                        type="text"
                        value={editCompanyName}
                        onChange={(e) => setEditCompanyName(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-md"
                      />
                      <button
                        onClick={handleUpdateCompany}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-3 rounded-md"
                      >
                        Kaydet
                      </button>
                      <button
                        onClick={() => {
                          setEditCompanyId(null);
                          setEditCompanyName('');
                        }}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-1 px-3 rounded-md"
                      >
                        İptal
                      </button>
                    </div>
                  ) : (
                    <h3 className="text-xl font-bold text-gray-800">{company.name}</h3>
                  )}
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openAddUserModal(company.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-1 px-3 rounded-md"
                    >
                      Kullanıcı Ekle
                    </button>
                    <button
                      onClick={() => handleEditCompany(company)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-1 px-3 rounded-md"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDeleteCompany(company.id)}
                      className="bg-red-500 hover:bg-red-600 text-white font-medium py-1 px-3 rounded-md"
                    >
                      Sil
                    </button>
                  </div>
                </div>
                
                {/* Şirkete Bağlı Kullanıcılar */}
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Kullanıcılar:</h4>
                  {users.filter(user => user.company_id === company.id).length > 0 ? (
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
                              İşlemler
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {users
                            .filter(user => user.company_id === company.id)
                            .map(user => (
                              <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <select
                                    className="text-sm text-gray-900 border border-gray-300 rounded-md p-1"
                                    value={user.role}
                                    onChange={(e) => handleUpdateUserRole(user.id, e.target.value as UserRole)}
                                  >
                                    <option value={UserRole.USER}>{getRoleName(UserRole.USER)}</option>
                                    <option value={UserRole.COMPANY_ADMIN}>{getRoleName(UserRole.COMPANY_ADMIN)}</option>
                                    <option value={UserRole.SYSTEM_ADMIN}>{getRoleName(UserRole.SYSTEM_ADMIN)}</option>
                                  </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button
                                    className="text-red-600 hover:text-red-900"
                                    onClick={() => {/* Kullanıcı silme fonksiyonu */}}
                                  >
                                    Sil
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Bu şirkete ait kullanıcı bulunmamaktadır.</p>
                  )}
                </div>
              </div>
            ))}
            
            {companies.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                Henüz şirket bulunmamaktadır. Yeni bir şirket ekleyin.
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Yeni Modal Render Metodu Kullanılıyor */}
      {renderAddUserModal()}
    </div>
  );
} 