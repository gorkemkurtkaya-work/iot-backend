'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SensorData {
  id: number;
  name: string;
  sensor_id: string;
  temperature: number;
  humidity: number;
  timestamp: string;
}

interface Company {
  id: string;
  name: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  company_id: string;
  role: UserRole;
}

enum UserRole {
  SYSTEM_ADMIN = 'system_admin',
  COMPANY_ADMIN = 'company_admin',
  USER = 'user'
}

interface Device {
  id: string;
  name: string;
  type: string;
  user_id: string;
  sensor_id: string;
  company_id: string;
}

interface DeviceAssignment {
  id: string;
  user_id: string;
  device_id: string;
}

export default function DashboardPage() {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'sensor' | 'companies' | 'users' | 'devices' | 'roles'>('sensor');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [filteredData, setFilteredData] = useState<{
    filteredSensorData: SensorData[];
    filteredCompanies: Company[];
    filteredUsers: User[];
    filteredDevices: Device[];
  }>({
    filteredSensorData: [],
    filteredCompanies: [],
    filteredUsers: [],
    filteredDevices: []
  });

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Kullanıcı bilgisini al
        const userResponse = await axios.get('http://localhost:3000/auth/profile', { 
          withCredentials: true 
        });
        setCurrentUser(userResponse.data);
        
        let sensorData = [];
        let companiesData = [];
        let usersData = [];
        let devicesData = [];

        // Kullanıcı rolüne göre veri çekme işlemlerini ayarla
        if (userResponse.data.role === UserRole.USER) {
          // Normal kullanıcı için sadece kendi verilerini çek
          try {
            // Kullanıcının atanmış cihazlarını al
            const assignmentsResponse = await axios.get(
              `http://localhost:3000/device-assignments/user/${userResponse.data.id}`,
              { withCredentials: true }
            );
            
            const assignedDeviceIds = assignmentsResponse.data.map(
              (assignment: DeviceAssignment) => assignment.device_id
            );

            if (assignedDeviceIds.length > 0) {
              // Önce cihazları çek
              const devicesResponse = await axios.get('http://localhost:3000/devices', { 
                withCredentials: true
              });
              
              // Atanmış cihazları filtrele
              devicesData = devicesResponse.data.filter((device: Device) => 
                assignedDeviceIds.includes(device.id)
              );

              // Her bir cihaz için sensör verilerini çek
              const sensorPromises = devicesData.map(async (device: Device) => {
                try {
                  const response = await axios.get(
                    `http://localhost:3000/sensor-data/${device.sensor_id}`,
                    { withCredentials: true }
                  );
                  return response.data;
                } catch (error) {
                  console.error(`${device.sensor_id} için sensör verisi alınamadı:`, error);
                  return [];
                }
              });

              // Tüm sensör verilerini birleştir
              const sensorResults = await Promise.all(sensorPromises);
              sensorData = sensorResults.flat();
            }
            
            // Kullanıcının kendi şirket bilgisini al
            const companyResponse = await axios.get(
              `http://localhost:3000/companies/${userResponse.data.company_id}`,
              { withCredentials: true }
            );
            companiesData = [companyResponse.data];
            
            // Kullanıcının kendi bilgilerini al
            usersData = [userResponse.data];
          } catch (error) {
            console.error('Kullanıcı verileri alınırken hata:', error);
          }
        } else if (userResponse.data.role === UserRole.COMPANY_ADMIN) {
          // Company Admin için şirket verilerini çek
          try {
            // Önce cihazları çek
            const devicesResponse = await axios.get('http://localhost:3000/devices', { 
              withCredentials: true
            });
            
            // Şirkete ait cihazları filtrele
            devicesData = devicesResponse.data.filter((device: Device) => 
              device.company_id === userResponse.data.company_id
            );

            if (devicesData.length > 0) {
              // Her bir cihaz için sensör verilerini çek
              const sensorPromises = devicesData.map(async (device: Device) => {
                try {
                  const response = await axios.get(
                    `http://localhost:3000/sensor-data/${device.sensor_id}`,
                    { withCredentials: true }
                  );
                  return response.data;
                } catch (error) {
                  console.error(`${device.sensor_id} için sensör verisi alınamadı:`, error);
                  return [];
                }
              });

              // Tüm sensör verilerini birleştir
              const sensorResults = await Promise.all(sensorPromises);
              sensorData = sensorResults.flat();
            }

            // Şirket bilgilerini al
            const companyResponse = await axios.get(
              `http://localhost:3000/companies/${userResponse.data.company_id}`,
              { withCredentials: true }
            );
            companiesData = [companyResponse.data];
            
            // Şirkete ait kullanıcıları al
            const usersResponse = await axios.get('http://localhost:3000/users', { 
              withCredentials: true 
            });
            usersData = usersResponse.data.filter((user: User) => 
              user.company_id === userResponse.data.company_id
            );
          } catch (error) {
            console.error('Şirket verileri alınırken hata:', error);
          }
        } else {
          // System Admin için tüm verileri çek
          const [sensorResponse, companiesResponse, usersResponse, devicesResponse] = await Promise.all([
            axios.get('http://localhost:3000/sensor-data', { withCredentials: true }),
            axios.get('http://localhost:3000/companies', { withCredentials: true }),
            axios.get('http://localhost:3000/users', { withCredentials: true }),
            axios.get('http://localhost:3000/devices', { withCredentials: true })
          ]);
          
          sensorData = sensorResponse.data;
          companiesData = companiesResponse.data;
          usersData = usersResponse.data;
          devicesData = devicesResponse.data;
        }
        
        setSensorData(sensorData);
        setCompanies(companiesData);
        setUsers(usersData);
        setDevices(devicesData);

        // Filtrelenmiş verileri güncelle
        const filtered = await getFilteredData(
          userResponse.data,
          sensorData,
          companiesData,
          usersData,
          devicesData
        );
        setFilteredData(filtered);
      } catch (err) {
        setError('Veriler yüklenirken bir hata oluştu');
        console.error('Veri çekme hatası:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
    // Her 30 saniyede bir verileri güncelle
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Kullanıcı bazlı filtreleme
  const getFilteredData = async (
    currentUser: User,
    sensorData: SensorData[],
    companies: Company[],
    users: User[],
    devices: Device[]
  ) => {
    if (!currentUser) return {
      filteredSensorData: [],
      filteredCompanies: [],
      filteredUsers: [],
      filteredDevices: []
    };
    
    switch (currentUser.role) {
      case UserRole.SYSTEM_ADMIN:
        return {
          filteredSensorData: sensorData,
          filteredCompanies: companies,
          filteredUsers: users,
          filteredDevices: devices
        };
      
      case UserRole.COMPANY_ADMIN:
        const companyDevices = devices.filter(device => {
          const deviceUsers = users.filter(u => u.id === device.user_id);
          return deviceUsers.some(u => u.company_id === currentUser.company_id);
        });
        
        const companyUsers = users.filter(user => 
          user.company_id === currentUser.company_id && user.role !== UserRole.SYSTEM_ADMIN
        );
        
        const deviceIds = companyDevices.map(device => device.id);
        const companySensorData = sensorData.filter(data => 
          deviceIds.includes(data.sensor_id)
        );
        
        return {
          filteredSensorData: companySensorData,
          filteredCompanies: companies.filter(company => company.id === currentUser.company_id),
          filteredUsers: companyUsers,
          filteredDevices: companyDevices
        };
      
      case UserRole.USER:
        try {
          // Kullanıcının atanmış cihazlarını al
          const userAssignmentsResponse = await axios.get(
            `http://localhost:3000/device-assignments/user/${currentUser.id}`,
            { withCredentials: true }
          );
          
          const assignedDeviceIds = userAssignmentsResponse.data.map(
            (assignment: DeviceAssignment) => assignment.device_id
          );
          
          // Atanmış cihazları bul
          const userDevices = devices.filter(device => assignedDeviceIds.includes(device.id));
          
          // Atanmış cihazların sensör ID'lerini al
          const sensorIds = userDevices.map(device => device.sensor_id);
          
          // Sensör verilerini filtrele
          const userSensorData = sensorData.filter(data => sensorIds.includes(data.sensor_id));
          
          return {
            filteredSensorData: userSensorData,
            filteredCompanies: companies.filter(company => company.id === currentUser.company_id),
            filteredUsers: users.filter(u => u.id === currentUser.id),
            filteredDevices: userDevices
          };
        } catch (error) {
          console.error('Cihaz atamaları alınırken hata:', error);
          return {
            filteredSensorData: [],
            filteredCompanies: [],
            filteredUsers: [],
            filteredDevices: []
          };
        }
      
      default:
        return {
          filteredSensorData: [],
          filteredCompanies: [],
          filteredUsers: [],
          filteredDevices: []
        };
    }
  };

  const { filteredSensorData, filteredCompanies, filteredUsers, filteredDevices } = filteredData;

  // Kullanıcı rolüne göre izin kontrolü yap
  const hasPermission = (requiredRole: UserRole[]) => {
    if (!currentUser) return false;
    return requiredRole.includes(currentUser.role);
  };

  const chartData = {
    labels: filteredSensorData.map(data => new Date(data.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Sıcaklık (°C)',
        data: filteredSensorData.map(data => data.temperature),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Nem (%)',
        data: filteredSensorData.map(data => data.humidity),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Sensör Verileri',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
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

  // Kullanıcı rolünü görüntüle
  const getUserRoleName = (role: UserRole) => {
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

  // Şirket kartını render et
  const renderCompanyCard = (company: Company) => {
    const companyUsers = filteredUsers.filter(user => user.company_id === company.id);
    
    return (
      <div key={company.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
        <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">
          {company.name}
        </h3>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-800">Şirket ID:</span> {company.id}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-800">Çalışan Sayısı:</span> {companyUsers.length}
          </p>
          
          {companyUsers.length > 0 && (
            <div className="mt-4">
              <p className="font-medium text-gray-800 mb-2">Çalışanlar:</p>
              <div className="pl-2 border-l-2 border-blue-300">
                {companyUsers.map(user => (
                  <p key={user.id} className="text-sm">
                    {user.username} ({user.email}) - {getUserRoleName(user.role)}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Kullanıcı kartını render et
  const renderUserCard = (user: User) => {
    const userDevices = filteredDevices.filter(device => device.user_id === user.id);
    const userCompany = filteredCompanies.find(company => company.id === user.company_id);
    
    return (
      <div key={user.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
        <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">
          {user.username}
        </h3>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-800">Email:</span> {user.email}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-800">Şirket:</span> {userCompany?.name || 'Belirtilmemiş'}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-800">Rol:</span> {getUserRoleName(user.role)}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-800">Cihaz Sayısı:</span> {userDevices.length}
          </p>
          
          {userDevices.length > 0 && (
            <div className="mt-4">
              <p className="font-medium text-gray-800 mb-2">Cihazlar:</p>
              <div className="pl-2 border-l-2 border-green-300">
                {userDevices.map(device => (
                  <p key={device.id} className="text-sm">{device.name} ({device.type})</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Cihaz kartını render et
  const renderDeviceCard = (device: Device) => {
    const deviceUser = filteredUsers.find(user => user.id === device.user_id);
    const relatedSensorData = filteredSensorData.filter(data => data.sensor_id === device.id).slice(-1)[0];
    
    return (
      <div key={device.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
        <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">
          {device.name}
        </h3>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-800">Tip:</span> {device.type}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-800">Kullanıcı:</span> {deviceUser?.username || 'Belirtilmemiş'}
          </p>
          
          {relatedSensorData && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="font-medium text-gray-800 mb-2">Son Sensör Verisi:</p>
              <p className="text-sm text-gray-600">Sıcaklık: <span className="font-medium">{relatedSensorData.temperature}°C</span></p>
              <p className="text-sm text-gray-600">Nem: <span className="font-medium">{relatedSensorData.humidity}%</span></p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(relatedSensorData.timestamp).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Rol kartını render et
  const renderRoleCard = (role: UserRole) => {
    let roleInfo = {
      title: '',
      description: '',
      permissions: [] as string[],
      color: '',
    };

    switch (role) {
      case UserRole.SYSTEM_ADMIN:
        roleInfo = {
          title: 'Sistem Yöneticisi',
          description: 'Genel entegrasyonu yöneten en yetkili kullanıcı rolü (God Mode)',
          permissions: [
            'Şirket ve müşteri kaydı oluşturabilir',
            'Kullanıcılar ekleyebilir ve tüm rolleri güncelleyebilir',
            'IoT entegrasyonlarını yapabilir',
            'Tüm loglara erişim yetkisine sahiptir',
            'Diğer kullanıcılar tarafından görülemez'
          ],
          color: 'bg-red-100 border-red-500',
        };
        break;
      case UserRole.COMPANY_ADMIN:
        roleInfo = {
          title: 'Şirket Yöneticisi',
          description: 'Şirket operasyonlarını yöneten kullanıcı rolü',
          permissions: [
            'Şirketine kullanıcılar ekleyebilir',
            'Entegre edilen IoT cihazlardan gelen verileri görüntüleyebilir',
            'Kullanıcı davranışlarını inceleyebilir',
            'Kullanıcı bazlı cihaz görüntüleme yetkileri atayabilir'
          ],
          color: 'bg-blue-100 border-blue-500',
        };
        break;
      case UserRole.USER:
        roleInfo = {
          title: 'Kullanıcı',
          description: 'Standart kullanıcı rolü',
          permissions: [
            'Yetkisi olduğu IoT verilerini görüntüleyebilir'
          ],
          color: 'bg-green-100 border-green-500',
        };
        break;
    }

    return (
      <div key={role} className={`${roleInfo.color} border-l-4 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow`}>
        <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">
          {roleInfo.title}
        </h3>
        <p className="text-sm text-gray-600 mb-4">{roleInfo.description}</p>
        
        <div className="mt-4">
          <p className="font-medium text-gray-800 mb-2">Yetkiler:</p>
          <ul className="pl-5 list-disc space-y-1">
            {roleInfo.permissions.map((permission, index) => (
              <li key={index} className="text-sm text-gray-600">{permission}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const renderUserHeader = () => {
    if (!currentUser) return null;
    
    const userCompany = companies.find(company => company.id === currentUser.company_id);
    
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center">
          <div className="bg-blue-100 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="ml-4">
            <h2 className="text-lg font-semibold text-gray-800">{currentUser.username}</h2>
            <div className="flex space-x-4">
              <p className="text-sm text-gray-600">{userCompany?.name || 'Genel'}</p>
              <span className="text-gray-400">•</span>
              <p className="text-sm text-gray-600">{getUserRoleName(currentUser.role)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">IoT Sensör Dashboard</h1>
        
        {/* Kullanıcı Bilgisi */}
        {renderUserHeader()}
        
        {/* Sekmeler */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
          <button
            className={`py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'sensor' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('sensor')}
          >
            Sensör Verileri
          </button>
          
          {/* Sadece SYSTEM_ADMIN ve COMPANY_ADMIN şirketleri görebilir */}
          {hasPermission([UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN]) && (
            <button
              className={`py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'companies' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('companies')}
            >
              Şirketler
            </button>
          )}
          
          {/* Sadece SYSTEM_ADMIN ve COMPANY_ADMIN kullanıcıları görebilir */}
          {hasPermission([UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN]) && (
            <button
              className={`py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'users' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('users')}
            >
              Kullanıcılar
            </button>
          )}
          
          <button
            className={`py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'devices' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('devices')}
          >
            Cihazlar
          </button>
          
          <button
            className={`py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'roles' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('roles')}
          >
            Kullanıcı Rolleri
          </button>
        </div>
        
        {/* Sensör Verileri Sekmesi */}
        {activeTab === 'sensor' && (
          <>
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <Line options={chartOptions} data={chartData} />
            </div>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Son Sensör Kayıtları</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSensorData.slice(0, 20).map((data) => (
                <div key={data.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">
                    Sensör: {data.sensor_id}
                  </h3>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-800">Sıcaklık:</span> <span className="font-medium text-red-500">{data.temperature}°C</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-800">Nem:</span> <span className="font-medium text-blue-500">{data.humidity}%</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium text-gray-800">Zaman:</span> {new Date(data.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        
        {/* Şirketler Sekmesi */}
        {activeTab === 'companies' && hasPermission([UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN]) && (
          <>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Şirketler ({filteredCompanies.length})</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCompanies.map(company => renderCompanyCard(company))}
            </div>
          </>
        )}
        
        {/* Kullanıcılar Sekmesi */}
        {activeTab === 'users' && hasPermission([UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN]) && (
          <>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Kullanıcılar ({filteredUsers.length})</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredUsers.map(user => renderUserCard(user))}
            </div>
          </>
        )}
        
        {/* Cihazlar Sekmesi */}
        {activeTab === 'devices' && (
          <>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Cihazlar ({filteredDevices.length})</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDevices.map(device => renderDeviceCard(device))}
            </div>
          </>
        )}
        
        {/* Roller Sekmesi */}
        {activeTab === 'roles' && (
          <>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Kullanıcı Rolleri</h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {Object.values(UserRole).map(role => renderRoleCard(role))}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 