'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

enum UserRole {
  SYSTEM_ADMIN = 'system_admin',
  COMPANY_ADMIN = 'company_admin',
  USER = 'user'
}

interface DeviceAssignment {
  id: string;
  user_id: string;
  device_id: string;
  user?: User;
}

interface Device {
  id: string;
  name: string;
  type: string;
  sensor_id: string;
  company_id?: string;
  company?: Company;
  assignments?: DeviceAssignment[];
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

export default function CihazlarPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Cihaz ekleme modalı
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDevice, setNewDevice] = useState({
    name: '',
    sensor_id: '',
    company_id: ''
  });
  
  // Cihaz düzenleme için
  const [editDeviceId, setEditDeviceId] = useState<string | null>(null);
  const [editDevice, setEditDevice] = useState({
    name: '',
    sensor_id: '',
    company_id: ''
  });

  // Cihaz atama işlemi
  const handleAssignDevice = async (deviceId: string, userId: string) => {
    try {
      await axios.post(
        'http://localhost:3000/device-assignments',
        {
          user_id: userId,
          device_id: deviceId
        },
        { withCredentials: true }
      );

      // Cihaz listesini güncelle
      const updatedDevices = await Promise.all(
        devices.map(async (device) => {
          if (device.id === deviceId) {
            try {
              const assignmentsResponse = await axios.get(
                `http://localhost:3000/device-assignments/device/${device.id}`,
                { withCredentials: true }
              );

              const assignmentsWithUsers = await Promise.all(
                assignmentsResponse.data.map(async (assignment: DeviceAssignment) => {
                  try {
                    const userResponse = await axios.get(
                      `http://localhost:3000/users/${assignment.user_id}`,
                      { withCredentials: true }
                    );
                    return {
                      ...assignment,
                      user: userResponse.data
                    };
                  } catch (error) {
                    console.error('Kullanıcı bilgileri alınırken hata:', error);
                    return assignment;
                  }
                })
              );

              return {
                ...device,
                assignments: assignmentsWithUsers
              };
            } catch (error) {
              console.error('Cihaz atamaları alınırken hata:', error);
              return device;
            }
          }
          return device;
        })
      );

      setDevices(updatedDevices);
      setShowAssignModal(false);

      await Swal.fire({
        icon: 'success',
        title: 'Başarılı!',
        text: 'Cihaz başarıyla atandı.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Cihaz atanırken hata:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Hata!',
        text: 'Cihaz atanırken bir hata oluştu.',
        confirmButtonText: 'Tamam'
      });
    }
  };

  // Cihaz atama modalını render et
  const renderAssignDeviceModal = (device: Device) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
          <button 
            onClick={() => setShowAssignModal(false)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Cihaz Ata: {device.name}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="user" className="block text-sm font-medium text-gray-700">
                Kullanıcı Seçin
              </label>
              <select
                id="user"
                name="user"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                onChange={(e) => handleAssignDevice(device.id, e.target.value)}
              >
                <option value="">Kullanıcı Seçin</option>
                {users
                  .filter(user => user.company_id === currentUser?.company_id)
                  .map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // State'e yeni değişkenler ekle
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Kullanıcı profili bilgisini al
        const userResponse = await axios.get('http://localhost:3000/auth/profile', {
          withCredentials: true
        });
        
        if (userResponse.data) {
          setCurrentUser(userResponse.data);
          
          // Paralel olarak tüm verileri çek
          const [devicesResponse, usersResponse, companiesResponse] = await Promise.all([
            axios.get('http://localhost:3000/devices', { withCredentials: true }),
            axios.get('http://localhost:3000/users', { withCredentials: true }),
            axios.get('http://localhost:3000/companies', { withCredentials: true })
          ]);
          
          let filteredDevices = devicesResponse.data;
          
          // Eğer System Admin değilse, filtreleme yapılır
          if (userResponse.data.role === UserRole.COMPANY_ADMIN) {
            // Company Admin sadece kendi şirketindeki cihazları görebilir
            filteredDevices = devicesResponse.data.filter(
              (device: Device) => device.company_id === userResponse.data.company_id
            );
          } else if (userResponse.data.role === UserRole.USER) {
            // Normal kullanıcı sadece kendisine atanmış cihazları görebilir
            const userAssignmentsResponse = await axios.get(
              `http://localhost:3000/device-assignments/user/${userResponse.data.id}`,
              { withCredentials: true }
            );
            
            const assignedDeviceIds = userAssignmentsResponse.data.map(
              (assignment: DeviceAssignment) => assignment.device_id
            );
            
            filteredDevices = devicesResponse.data.filter(
              (device: Device) => assignedDeviceIds.includes(device.id)
            );
          }

          // Her cihaz için atama ve şirket bilgilerini al
          const devicesWithDetails = await Promise.all(
            filteredDevices.map(async (device: Device) => {
              try {
                // Cihazın atamalarını al
                let assignmentsWithUsers = [];
                try {
                  const assignmentsResponse = await axios.get(
                    `http://localhost:3000/device-assignments/device/${device.id}`,
                    { withCredentials: true }
                  );

                  // Atamalar için kullanıcı bilgilerini al
                  assignmentsWithUsers = await Promise.all(
                    assignmentsResponse.data.map(async (assignment: DeviceAssignment) => {
                      try {
                        const userResponse = await axios.get(
                          `http://localhost:3000/users/${assignment.user_id}`,
                          { withCredentials: true }
                        );
                        return {
                          ...assignment,
                          user: userResponse.data
                        };
                      } catch (error) {
                        console.error('Kullanıcı bilgileri alınırken hata:', error);
                        return assignment;
                      }
                    })
                  );
                } catch (error) {
                  console.error('Cihaz atamaları alınırken hata:', error);
                }

                // Şirket bilgilerini al
                let companyData = null;
                try {
                  if (device.company_id) {
                    const companyResponse = await axios.get(
                      `http://localhost:3000/companies/${device.company_id}`,
                      { withCredentials: true }
                    );
                    companyData = companyResponse.data;
                  }
                } catch (error) {
                  console.error('Şirket bilgileri alınırken hata:', error);
                }

                return {
                  ...device,
                  assignments: assignmentsWithUsers,
                  company: companyData
                };
              } catch (error) {
                console.error('Cihaz detayları alınırken hata:', error);
                return device;
              }
            })
          );
          
          setDevices(devicesWithDetails);
          setUsers(usersResponse.data);
          setCompanies(companiesResponse.data);
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
  
  // Cihaz ekleme işlemi
  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Company Admin için otomatik şirket ataması
    if (currentUser?.role === UserRole.COMPANY_ADMIN) {
      setNewDevice(prev => ({
        ...prev,
        company_id: currentUser.company_id
      }));
    }

    if (!newDevice.name || !newDevice.sensor_id || !newDevice.company_id) {
      await Swal.fire({
        icon: 'error',
        title: 'Hata!',
        text: 'Tüm alanları doldurun',
        confirmButtonText: 'Tamam'
      });
      return;
    }
    
    try {
      const response = await axios.post(
        'http://localhost:3000/devices',
        newDevice,
        { withCredentials: true }
      );
      
      setDevices([...devices, response.data]);
      setShowAddModal(false);
      setNewDevice({
        name: '',
        sensor_id: '',
        company_id: ''
      });

      await Swal.fire({
        icon: 'success',
        title: 'Başarılı!',
        text: 'Cihaz başarıyla eklendi.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Cihaz eklerken hata:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Hata!',
        text: 'Cihaz oluşturulurken bir hata oluştu.',
        confirmButtonText: 'Tamam'
      });
    }
  };
  
  // Cihaz düzenleme işlemi
  const handleEditDevice = (device: Device) => {
    // Company Admin sadece kendi şirketindeki cihazları düzenleyebilir
    if (currentUser?.role === UserRole.COMPANY_ADMIN && device.company_id !== currentUser.company_id) {
      return;
    }

    setEditDeviceId(device.id);
    setEditDevice({
      name: device.name,
      sensor_id: device.sensor_id,
      company_id: device.company_id || ''
    });
  };
  
  const handleUpdateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Company Admin için otomatik şirket ataması
    if (currentUser?.role === UserRole.COMPANY_ADMIN) {
      setEditDevice(prev => ({
        ...prev,
        company_id: currentUser.company_id
      }));
    }

    if (!editDeviceId || !editDevice.name || !editDevice.sensor_id || !editDevice.company_id) {
      await Swal.fire({
        icon: 'error',
        title: 'Hata!',
        text: 'Tüm alanları doldurun',
        confirmButtonText: 'Tamam'
      });
      return;
    }
    
    try {
      const response = await axios.put(
        `http://localhost:3000/devices/${editDeviceId}`,
        editDevice,
        { withCredentials: true }
      );
      
      const updatedDevices = devices.map(device => 
        device.id === editDeviceId ? response.data : device
      );
      
      setDevices(updatedDevices);
      setEditDeviceId(null);
      setEditDevice({
        name: '',
        sensor_id: '',
        company_id: ''
      });

      await Swal.fire({
        icon: 'success',
        title: 'Başarılı!',
        text: 'Cihaz başarıyla güncellendi.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Cihaz güncellenirken hata:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Hata!',
        text: 'Cihaz güncellenirken bir hata oluştu.',
        confirmButtonText: 'Tamam'
      });
    }
  };
  
  // Cihaz silme işlemi
  const handleDeleteDevice = async (id: string) => {
    const device = devices.find(d => d.id === id);
    
    // Company Admin sadece kendi şirketindeki cihazları silebilir
    if (currentUser?.role === UserRole.COMPANY_ADMIN && device?.company_id !== currentUser.company_id) {
      return;
    }

    const result = await Swal.fire({
      title: 'Emin misiniz?',
      text: "Bu cihazı silmek istediğinize emin misiniz?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Evet, sil!',
      cancelButtonText: 'İptal'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:3000/devices/${id}`, {
          withCredentials: true
        });
        
        setDevices(devices.filter(device => device.id !== id));

        await Swal.fire({
          icon: 'success',
          title: 'Başarılı!',
          text: 'Cihaz başarıyla silindi.',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (err) {
        console.error('Cihaz silinirken hata:', err);
        await Swal.fire({
          icon: 'error',
          title: 'Hata!',
          text: 'Cihaz silinirken bir hata oluştu.',
          confirmButtonText: 'Tamam'
        });
      }
    }
  };
  
  // Ekleme modalını render et
  const renderAddDeviceModal = () => {
    if (!showAddModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
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
            Yeni Cihaz Ekle
          </h3>
          
          <form onSubmit={handleAddDevice}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Cihaz Adı
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
                />
              </div>
              
              <div>
                <label htmlFor="sensor_id" className="block text-sm font-medium text-gray-700">
                  Sensör ID
                </label>
                <input
                  type="text"
                  id="sensor_id"
                  name="sensor_id"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={newDevice.sensor_id}
                  onChange={(e) => setNewDevice({...newDevice, sensor_id: e.target.value})}
                />
              </div>
              
              {/* System Admin için şirket seçimi */}
              {currentUser?.role === UserRole.SYSTEM_ADMIN && (
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                    Şirket
                  </label>
                  <select
                    id="company"
                    name="company"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={newDevice.company_id}
                    onChange={(e) => setNewDevice({...newDevice, company_id: e.target.value})}
                  >
                    <option value="">Şirket Seçin</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Company Admin için şirket bilgisi */}
              {currentUser?.role === UserRole.COMPANY_ADMIN && (
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                    Şirket
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    disabled
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm"
                    value={companies.find(c => c.id === currentUser.company_id)?.name || ''}
                  />
                  <input
                    type="hidden"
                    name="company_id"
                    value={currentUser.company_id}
                  />
                </div>
              )}
            </div>
            
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
              >
                Cihaz Ekle
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
  
  // Düzenleme modalını render et
  const renderEditDeviceModal = () => {
    if (!editDeviceId) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
          <button 
            onClick={() => setEditDeviceId(null)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Cihazı Düzenle
          </h3>
          
          <form onSubmit={handleUpdateDevice}>
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                  Cihaz Adı
                </label>
                <input
                  type="text"
                  id="edit-name"
                  name="edit-name"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={editDevice.name}
                  onChange={(e) => setEditDevice({...editDevice, name: e.target.value})}
                />
              </div>
              
              <div>
                <label htmlFor="edit-sensor_id" className="block text-sm font-medium text-gray-700">
                  Sensör ID
                </label>
                <input
                  type="text"
                  id="edit-sensor_id"
                  name="edit-sensor_id"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={editDevice.sensor_id}
                  onChange={(e) => setEditDevice({...editDevice, sensor_id: e.target.value})}
                />
              </div>
              
              {/* System Admin için şirket seçimi */}
              {currentUser?.role === UserRole.SYSTEM_ADMIN && (
                <div>
                  <label htmlFor="edit-company" className="block text-sm font-medium text-gray-700">
                    Şirket
                  </label>
                  <select
                    id="edit-company"
                    name="edit-company"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={editDevice.company_id}
                    onChange={(e) => setEditDevice({...editDevice, company_id: e.target.value})}
                  >
                    <option value="">Şirket Seçin</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
              >
                Güncelle
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                onClick={() => setEditDeviceId(null)}
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Kullanıcı ve şirket adını getir
  const getUserName = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device?.assignments || device.assignments.length === 0) {
      return 'Atanmamış';
    }
    return device.assignments.map(assignment => assignment.user?.name || 'Bilinmeyen Kullanıcı').join(', ');
  };
  
  const getCompanyName = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    return device?.company?.name || 'Atanmamış';
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

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Cihazlar</h1>
          
          {/* Sadece System Admin ve Company Admin cihaz ekleyebilir */}
          {(currentUser?.role === UserRole.SYSTEM_ADMIN || currentUser?.role === UserRole.COMPANY_ADMIN) && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
            >
              Yeni Cihaz Ekle
            </button>
          )}
        </div>
        
        {/* Cihazlar Listesi */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="flex flex-col">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden border-b border-gray-200 shadow sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cihaz Adı
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sensör ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Şirket
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Atanan Kullanıcılar
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {devices.length > 0 ? (
                        devices.map(device => (
                          <tr key={device.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{device.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{device.sensor_id}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{device.company?.name || 'Atanmamış'}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-500">
                                {device.assignments && device.assignments.length > 0 ? (
                                  <ul className="list-disc list-inside">
                                    {device.assignments.map(assignment => (
                                      <li key={assignment.id}>
                                        {assignment.user?.name || 'Bilinmeyen Kullanıcı'}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  'Atanmamış'
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                {currentUser?.role === UserRole.SYSTEM_ADMIN && (
                                  <>
                                    <button
                                      onClick={() => handleEditDevice(device)}
                                      className="text-indigo-600 hover:text-indigo-900"
                                    >
                                      Düzenle
                                    </button>
                                    <button
                                      onClick={() => handleDeleteDevice(device.id)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      Sil
                                    </button>
                                  </>
                                )}
                                {(currentUser?.role === UserRole.SYSTEM_ADMIN || 
                                  (currentUser?.role === UserRole.COMPANY_ADMIN && device.company_id === currentUser.company_id)) && (
                                    <button
                                      onClick={() => {
                                        setSelectedDevice(device);
                                        setShowAssignModal(true);
                                      }}
                                      className="text-blue-600 hover:text-blue-900"
                                    >
                                      Kullanıcı Ata
                                    </button>
                                  )}
                                <button
                                  className="text-green-600 hover:text-green-900"
                                  onClick={() => {}}
                                >
                                  Detaylar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            Henüz cihaz bulunmamaktadır.
                            {(currentUser?.role === UserRole.SYSTEM_ADMIN || currentUser?.role === UserRole.COMPANY_ADMIN) && (
                              <span> Yeni bir cihaz ekleyin.</span>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modallar */}
      {renderAddDeviceModal()}
      {renderEditDeviceModal()}
      {showAssignModal && selectedDevice && renderAssignDeviceModal(selectedDevice)}
    </div>
  );
}
