'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
import Swal from 'sweetalert2';
import io from 'socket.io-client';

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
  name: string;
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

interface LogEntry {
  id: string;
  user_id: string;
  action: string;
  timestamp: string;
  username: string;
}

interface SensorDataPayload {
  type: string;
  data: SensorData;
}

export default function DashboardPage() {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'sensor' | 'companies' | 'users' | 'devices' | 'roles' | 'logs'>('sensor');
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
  const router = useRouter();
  const socketRef = useRef<any>(null);
  const socketInitialized = useRef(false);

  // Action'ı Türkçe'ye çevir
  const getActionText = (action: string) => {
    switch (action) {
      case 'viewed_user_logs':
        return 'Kullanıcı loglarını görüntüledi';
      case 'viewed_sensor_data':
        return 'Sensör verilerini görüntüledi';
      case 'viewed_devices':
        return 'Cihazları görüntüledi';
      case 'viewed_users':
        return 'Kullanıcıları görüntüledi';
      case 'viewed_companies':
        return 'Şirketleri görüntüledi';
      default:
        return action;
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Kullanıcı bilgisini al
        const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/profile`, { 
          withCredentials: true 
        });
        setCurrentUser(userResponse.data);
        
        let sensorData: SensorData[] = [];
        let companiesData: Company[] = [];
        let usersData: User[] = [];
        let devicesData: Device[] = [];
        let logsData: LogEntry[] = [];

        // Kullanıcı rolüne göre veri çekme işlemlerini ayarla
        if (userResponse.data.role === UserRole.USER) {
          // Normal kullanıcı için sadece kendi verilerini çek
          try {
            // Kullanıcının atanmış cihazlarını al
            const assignmentsResponse = await axios.get(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/device-assignments/user/${userResponse.data.id}`,
              { withCredentials: true }
            );
            
            const assignedDeviceIds = assignmentsResponse.data.map(
              (assignment: DeviceAssignment) => assignment.device_id
            );

            if (assignedDeviceIds.length > 0) {
              // Önce cihazları çek
              const devicesResponse = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/devices`, { 
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
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/sensor-data/${device.sensor_id}`,
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
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/companies/${userResponse.data.company_id}`,
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
            const devicesResponse = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/devices`, { 
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
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/sensor-data/${device.sensor_id}`,
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
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/companies/${userResponse.data.company_id}`,
              { withCredentials: true }
            );
            companiesData = [companyResponse.data];
            
            // Şirkete ait kullanıcıları al
            const usersResponse = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users`, { 
              withCredentials: true 
            });
            usersData = usersResponse.data.filter((user: User) => 
              user.company_id === userResponse.data.company_id
            );

            // Şirkete ait kullanıcıların log kayıtlarını al
            const companyUserIds = usersData.map((user: User) => user.id);
            
            // Her bir kullanıcı için log kayıtlarını çek
            const logPromises = companyUserIds.map(async (userId: string) => {
              try {
                const response = await axios.get(
                  `${process.env.NEXT_PUBLIC_BACKEND_URL}/user-logs/user/${userId}`,
                  { withCredentials: true }
                );
                return response.data;
              } catch (error) {
                console.error(`${userId} için log kayıtları alınamadı:`, error);
                return [];
              }
            });

            // Tüm log kayıtlarını birleştir
            const logResults = await Promise.all(logPromises);
            logsData = logResults.flat();

            // Log kayıtlarını kullanıcı bilgileriyle eşleştir
            logsData = logsData.map(log => {
              const user = usersData.find(u => u.id === log.user_id);
              return {
                ...log,
                username: user?.name || 'Bilinmeyen Kullanıcı'
              };
            });

          } catch (error) {
            console.error('Şirket verileri alınırken hata:', error);
          }
        } else {
          // System Admin için tüm verileri çek
          const [sensorResponse, companiesResponse, usersResponse, devicesResponse] = await Promise.all([
            axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/sensor-data`, { withCredentials: true }),
            axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/companies`, { withCredentials: true }),
            axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users`, { withCredentials: true }),
            axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/devices`, { withCredentials: true })
          ]);
          
          sensorData = sensorResponse.data;
          companiesData = companiesResponse.data;
          usersData = usersResponse.data;
          devicesData = devicesResponse.data;

          // System Admin için tüm kullanıcıların loglarını çek
          const logPromises = usersData.map(async (user: User) => {
            try {
              const response = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/user-logs/user/${user.id}`,
                { withCredentials: true }
              );
              return response.data;
            } catch (error) {
              console.error(`${user.id} için log kayıtları alınamadı:`, error);
              return [];
            }
          });

          const logResults = await Promise.all(logPromises);
          logsData = logResults.flat();

          // Log kayıtlarını kullanıcı bilgileriyle eşleştir
          logsData = logsData.map(log => {
            const user = usersData.find(u => u.id === log.user_id);
            return {
              ...log,
              username: user?.name || 'Bilinmeyen Kullanıcı'
            };
          });
        }
        
        setSensorData(sensorData);
        setCompanies(companiesData);
        setUsers(usersData);
        setDevices(devicesData);
        setLogs(logsData);

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
        Swal.fire({
          icon: 'error',
          title: 'Hata',
          text: 'Veri çekme işlemi sırasında bir hata oluştu.',
          confirmButtonText: 'Tamam'
        });
        console.error('Veri çekme hatası:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket bağlantısını kur/kapat
  useEffect(() => {
    // Kullanıcı henüz yoksa bağlantı kurma
    if (!currentUser) return;
    
    // WebSocket bağlantısı daha önce başlatıldıysa tekrar başlatma
    if (socketInitialized.current) return;
    socketInitialized.current = true;
    
    console.log('⚡ WebSocket bağlantısı başlatılıyor...');
    
    // WebSocket bağlantısını kur
    const newSocket = io(`${process.env.NEXT_PUBLIC_BACKEND_URL}`, {
      transports: ['websocket'],
    });
    
    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log('🔌 WebSocket bağlantısı kuruldu');
    });

    newSocket.on('test', (data: any) => {
      console.log('📡 WebSocket test mesajı alındı:', data);
    });

    newSocket.on('sensorData', (data: SensorDataPayload) => {
      console.log('📊 Yeni sensör verisi alındı');
      
      if (data.type === 'new_sensor_data') {
        // Kullanıcının rolüne göre sensör verisini filtrele
        const shouldAddSensorData = isSensorDataAllowedForUser(currentUser, data.data, devices);
        
        if (shouldAddSensorData) {
          // Yeni sensör verisi geldiğinde bildirim göster
          Swal.fire({
            title: 'Yeni Sensör Verisi!',
            text: `Sıcaklık: ${data.data.temperature}°C, Nem: ${data.data.humidity}%`,
            icon: 'info',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 5000,
            timerProgressBar: true
          });

          console.log('📝 Sensör verileri güncelleniyor...');
          // Sensör verilerini güncelle
          setSensorData(prevData => {
            console.log('👉 Önceki sensör verileri:', prevData.length);
            const newData = [data.data, ...prevData];
            console.log('👉 Yeni sensör verileri:', newData.length);
            return newData;
          });
          
          console.log('📝 Filtrelenmiş sensör verileri güncelleniyor...');
          // Filtrelenmiş sensör verilerine de ekle
          setFilteredData(prevState => {
            console.log('👉 Önceki filtrelenmiş veriler:', prevState.filteredSensorData.length);
            const newState = {
              ...prevState,
              filteredSensorData: [data.data, ...prevState.filteredSensorData]
            };
            console.log('👉 Yeni filtrelenmiş veriler:', newState.filteredSensorData.length);
            return newState;
          });
          
          console.log('✅ Tüm güncellemeler tamamlandı');
        } else {
          console.log('🚫 Bu sensör verisi kullanıcının izinleri dahilinde değil, gösterilmiyor');
        }
      }
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 WebSocket bağlantısı koptu');
    });

    newSocket.on('error', (error: any) => {
      console.error('❌ WebSocket hatası:', error);
    });

    // Component unmount olduğunda bağlantıyı kapat
    return () => {
      console.log('🔌 WebSocket bağlantısı kapatılıyor...');
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        socketInitialized.current = false;
      }
    };
  }, [currentUser]); // Sadece currentUser değiştiğinde çalış

  // Kullanıcının bu sensör verisini görmeye yetkisi var mı kontrol et
  const isSensorDataAllowedForUser = (user: User | null, sensorData: SensorData, devices: Device[]): boolean => {
    if (!user) return false;
    
    // System Admin her şeyi görebilir
    if (user.role === UserRole.SYSTEM_ADMIN) {
      return true;
    }
    
    // Cihazı bulmaya çalış
    const device = devices.find(d => d.sensor_id === sensorData.sensor_id);
    if (!device) {
      console.log('⚠️ Sensör ID ile ilişkili cihaz bulunamadı');
      return false;
    }
    
    // Company Admin sadece kendi şirketindeki cihazları görebilir
    if (user.role === UserRole.COMPANY_ADMIN) {
      return device.company_id === user.company_id;
    }
    
    // Normal kullanıcı sadece kendisine atanmış cihazları görebilir
    return device.user_id === user.id;
  };

  // Kullanıcı bazlı filtreleme
  const getFilteredData = async (
    currentUser: User,
    sensorData: SensorData[],
    companies: Company[],
    users: User[],
    devices: Device[]
  ) => {
    try {
      let filteredSensorData = sensorData;
      let filteredCompanies = companies;
      let filteredUsers = users;
      let filteredDevices = devices;

      if (currentUser.role === UserRole.USER) {
        // Normal kullanıcı için atanmış cihazların verilerini filtrele
        const assignmentsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/device-assignments/user/${currentUser.id}`,
          { withCredentials: true }
        );
        
        const assignedDeviceIds = assignmentsResponse.data.map(
          (assignment: DeviceAssignment) => assignment.device_id
        );

        // Atanmış cihazları bul
        const assignedDevices = devices.filter(device => 
          assignedDeviceIds.includes(device.id)
        );

        // Atanmış cihazların sensör ID'lerini al
        const assignedSensorIds = assignedDevices.map(device => device.sensor_id);

        // Sadece atanmış cihazların sensör verilerini filtrele
        filteredSensorData = sensorData.filter(data => 
          assignedSensorIds.includes(data.sensor_id)
        );

        // Sadece kullanıcının kendi şirketini göster
        filteredCompanies = companies.filter(company => 
          company.id === currentUser.company_id
        );

        // Sadece kullanıcının kendisini göster
        filteredUsers = users.filter(user => user.id === currentUser.id);

        // Sadece atanmış cihazları göster
        filteredDevices = assignedDevices;
      } else if (currentUser.role === UserRole.COMPANY_ADMIN) {
        // Company Admin için şirkete ait cihazların verilerini filtrele
        const companyDevices = devices.filter(device => 
          device.company_id === currentUser.company_id
        );

        // Şirkete ait cihazların sensör ID'lerini al
        const companySensorIds = companyDevices.map(device => device.sensor_id);

        // Sadece şirkete ait cihazların sensör verilerini filtrele
        filteredSensorData = sensorData.filter(data => 
          companySensorIds.includes(data.sensor_id)
        );

        // Sadece kendi şirketini göster
        filteredCompanies = companies.filter(company => 
          company.id === currentUser.company_id
        );

        // Sadece şirkete ait kullanıcıları göster
        filteredUsers = users.filter(user => 
          user.company_id === currentUser.company_id
        );

        // Sadece şirkete ait cihazları göster
        filteredDevices = companyDevices;
      }

      return {
        filteredSensorData,
        filteredCompanies,
        filteredUsers,
        filteredDevices
      };
    } catch (error) {
      console.error('Veri filtreleme hatası:', error);
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
                    {user.name} ({user.email}) - {getUserRoleName(user.role)}
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
          {user.name}
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
            <span className="font-medium text-gray-800">Kullanıcı:</span> {deviceUser?.name || 'Belirtilmemiş'}
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
            <h2 className="text-lg font-semibold text-gray-800">{currentUser.name}</h2>
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

  // Log kartını render et
  const renderLogCard = (log: LogEntry) => {
    const logUser = users.find(user => user.id === log.user_id);
    
    return (
      <div key={log.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              {logUser?.name || 'Bilinmeyen Kullanıcı'}
            </h3>
            <p className="text-sm text-gray-600">{getActionText(log.action)}</p>
          </div>
          <span className="text-xs text-gray-500">
            {new Date(log.timestamp).toLocaleString()}
          </span>
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
          
          {/* Log sekmesi - Sadece SYSTEM_ADMIN ve COMPANY_ADMIN görebilir */}
          {hasPermission([UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN]) && (
            <button
              className={`py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'logs' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('logs')}
            >
              Log Kayıtları
            </button>
          )}
        </div>
        
        {/* Sensör Verileri Sekmesi */}
        {activeTab === 'sensor' && (
          <>
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <Line options={chartOptions} data={chartData} />
            </div>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Son Sensör Kayıtları</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSensorData.slice(0, 50).map((data) => (
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
        
        {/* Log Kayıtları Sekmesi */}
        {activeTab === 'logs' && hasPermission([UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN]) && (
          <>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Log Kayıtları</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kullanıcı
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlem
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zaman
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {log.username}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {getActionText(log.action)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 