'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

enum IntegrationType {
  MQTT = 'mqtt',
  HTTP = 'http',
  WEBSOCKET = 'websocket',
  MODBUS = 'modbus'
}

interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  config: {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    topic?: string;
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    protocols?: string[];
    slaveId?: number;
  };
  status: 'active' | 'inactive' | 'error';
  last_connection?: string;
  company_id: string;
  company?: Company;
}

interface Company {
  id: string;
  name: string;
}

export default function EntegrasyonlarPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Entegrasyon ekleme modalı
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIntegration, setNewIntegration] = useState<{
    name: string;
    type: IntegrationType;
    config: {
      host?: string;
      port?: number;
      username?: string;
      password?: string;
      topic?: string;
      url?: string;
      method?: string;
      headers?: Record<string, string>;
      protocols?: string[];
      slaveId?: number;
    };
    company_id: string;
  }>({
    name: '',
    type: IntegrationType.MQTT,
    config: {
      host: '',
      port: 1883,
      username: '',
      password: '',
      topic: ''
    },
    company_id: ''
  });
  
  // Entegrasyon düzenleme için
  const [editIntegrationId, setEditIntegrationId] = useState<string | null>(null);
  const [editIntegration, setEditIntegration] = useState<{
    name: string;
    type: IntegrationType;
    config: {
      host?: string;
      port?: number;
      username?: string;
      password?: string;
      topic?: string;
      url?: string;
      method?: string;
      headers?: Record<string, string>;
      protocols?: string[];
      slaveId?: number;
    };
    company_id: string;
  }>({
    name: '',
    type: IntegrationType.MQTT,
    config: {
      host: '',
      port: 1883,
      username: '',
      password: '',
      topic: ''
    },
    company_id: ''
  });

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
          const [integrationsResponse, companiesResponse] = await Promise.all([
            axios.get('http://localhost:3000/integrations', { withCredentials: true }),
            axios.get('http://localhost:3000/companies', { withCredentials: true })
          ]);
          
          let filteredIntegrations = integrationsResponse.data;
          
          // Eğer System Admin değilse, filtreleme yapılır
          if (userResponse.data.role === 'company_admin') {
            // Company Admin sadece kendi şirketindeki entegrasyonları görebilir
            filteredIntegrations = integrationsResponse.data.filter(
              (integration: Integration) => integration.company_id === userResponse.data.company_id
            );
          }

          // Her entegrasyon için şirket bilgilerini al
          const integrationsWithDetails = await Promise.all(
            filteredIntegrations.map(async (integration: Integration) => {
              try {
                const companyResponse = await axios.get(
                  `http://localhost:3000/companies/${integration.company_id}`,
                  { withCredentials: true }
                );
                
                return {
                  ...integration,
                  company: companyResponse.data
                };
              } catch (error) {
                console.error('Entegrasyon detayları alınırken hata:', error);
                return integration;
              }
            })
          );
          
          setIntegrations(integrationsWithDetails);
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
  
  // Entegrasyon ekleme işlemi
  const handleAddIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newIntegration.name || !newIntegration.type || !newIntegration.company_id) {
      setError('Tüm alanları doldurun');
      return;
    }
    
    try {
      const response = await axios.post(
        'http://localhost:3000/integrations',
        newIntegration,
        { withCredentials: true }
      );
      
      setIntegrations([...integrations, response.data]);
      setShowAddModal(false);
      setNewIntegration({
        name: '',
        type: IntegrationType.MQTT,
        config: {
          host: '',
          port: 1883,
          username: '',
          password: '',
          topic: ''
        },
        company_id: ''
      });
    } catch (err) {
      console.error('Entegrasyon eklerken hata:', err);
      setError('Entegrasyon oluşturulurken bir hata oluştu');
    }
  };
  
  // Entegrasyon düzenleme işlemi
  const handleEditIntegration = (integration: Integration) => {
    setEditIntegrationId(integration.id);
    setEditIntegration({
      name: integration.name,
      type: integration.type,
      config: integration.config,
      company_id: integration.company_id
    });
  };
  
  const handleUpdateIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editIntegrationId || !editIntegration.name || !editIntegration.type || !editIntegration.company_id) {
      setError('Tüm alanları doldurun');
      return;
    }
    
    try {
      const response = await axios.put(
        `http://localhost:3000/integrations/${editIntegrationId}`,
        editIntegration,
        { withCredentials: true }
      );
      
      // State'i güncelle
      const updatedIntegrations = integrations.map(integration => 
        integration.id === editIntegrationId ? response.data : integration
      );
      
      setIntegrations(updatedIntegrations);
      setEditIntegrationId(null);
      setEditIntegration({
        name: '',
        type: IntegrationType.MQTT,
        config: {
          host: '',
          port: 1883,
          username: '',
          password: '',
          topic: ''
        },
        company_id: ''
      });
    } catch (err) {
      console.error('Entegrasyon güncellenirken hata:', err);
      setError('Entegrasyon güncellenirken bir hata oluştu');
    }
  };
  
  // Entegrasyon silme işlemi
  const handleDeleteIntegration = async (id: string) => {
    if (!window.confirm('Bu entegrasyonu silmek istediğinize emin misiniz?')) {
      return;
    }
    
    try {
      await axios.delete(`http://localhost:3000/integrations/${id}`, {
        withCredentials: true
      });
      
      // Listeden sil
      setIntegrations(integrations.filter(integration => integration.id !== id));
    } catch (err) {
      console.error('Entegrasyon silinirken hata:', err);
      setError('Entegrasyon silinirken bir hata oluştu');
    }
  };

  // Entegrasyon durumunu değiştirme
  const handleToggleStatus = async (integration: Integration) => {
    try {
      const newStatus = integration.status === 'active' ? 'inactive' : 'active';
      const response = await axios.patch(
        `http://localhost:3000/integrations/${integration.id}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      
      // State'i güncelle
      const updatedIntegrations = integrations.map(int => 
        int.id === integration.id ? response.data : int
      );
      
      setIntegrations(updatedIntegrations);
    } catch (err) {
      console.error('Entegrasyon durumu güncellenirken hata:', err);
      setError('Entegrasyon durumu güncellenirken bir hata oluştu');
    }
  };
  
  // Ekleme modalını render et
  const renderAddIntegrationModal = () => {
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
            Yeni Entegrasyon Ekle
          </h3>
          
          <form onSubmit={handleAddIntegration}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Entegrasyon Adı
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={newIntegration.name}
                  onChange={(e) => setNewIntegration({...newIntegration, name: e.target.value})}
                />
              </div>
              
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Entegrasyon Tipi
                </label>
                <select
                  id="type"
                  name="type"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={newIntegration.type}
                  onChange={(e) => {
                    const type = e.target.value as IntegrationType;
                    setNewIntegration({
                      ...newIntegration,
                      type,
                      config: getDefaultConfig(type)
                    });
                  }}
                >
                  <option value={IntegrationType.MQTT}>MQTT</option>
                  <option value={IntegrationType.HTTP}>HTTP</option>
                  <option value={IntegrationType.WEBSOCKET}>WebSocket</option>
                  <option value={IntegrationType.MODBUS}>Modbus</option>
                </select>
              </div>
              
              {/* MQTT Konfigürasyonu */}
              {newIntegration.type === IntegrationType.MQTT && (
                <>
                  <div>
                    <label htmlFor="host" className="block text-sm font-medium text-gray-700">
                      Host
                    </label>
                    <input
                      type="text"
                      id="host"
                      name="host"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={newIntegration.config.host}
                      onChange={(e) => setNewIntegration({
                        ...newIntegration,
                        config: { ...newIntegration.config, host: e.target.value }
                      })}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="port" className="block text-sm font-medium text-gray-700">
                      Port
                    </label>
                    <input
                      type="number"
                      id="port"
                      name="port"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={newIntegration.config.port}
                      onChange={(e) => setNewIntegration({
                        ...newIntegration,
                        config: { ...newIntegration.config, port: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                      Kullanıcı Adı
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={newIntegration.config.username}
                      onChange={(e) => setNewIntegration({
                        ...newIntegration,
                        config: { ...newIntegration.config, username: e.target.value }
                      })}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Şifre
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={newIntegration.config.password}
                      onChange={(e) => setNewIntegration({
                        ...newIntegration,
                        config: { ...newIntegration.config, password: e.target.value }
                      })}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
                      Topic
                    </label>
                    <input
                      type="text"
                      id="topic"
                      name="topic"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={newIntegration.config.topic}
                      onChange={(e) => setNewIntegration({
                        ...newIntegration,
                        config: { ...newIntegration.config, topic: e.target.value }
                      })}
                    />
                  </div>
                </>
              )}
              
              {/* System Admin ve Company Admin için şirket seçimi */}
              {(currentUser?.role === 'system_admin' || currentUser?.role === 'company_admin') && (
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                    Şirket
                  </label>
                  <select
                    id="company"
                    name="company"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={newIntegration.company_id}
                    onChange={(e) => setNewIntegration({...newIntegration, company_id: e.target.value})}
                    disabled={currentUser?.role === 'company_admin'}
                  >
                    <option value="">Şirket Seçin</option>
                    {companies.map(company => {
                      // Company Admin sadece kendi şirketini seçebilir
                      if (currentUser?.role === 'company_admin' && company.id !== currentUser.company_id) {
                        return null;
                      }
                      return (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>
            
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
              >
                Entegrasyon Ekle
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
  const renderEditIntegrationModal = () => {
    if (!editIntegrationId) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
          <button 
            onClick={() => setEditIntegrationId(null)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Entegrasyonu Düzenle
          </h3>
          
          <form onSubmit={handleUpdateIntegration}>
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                  Entegrasyon Adı
                </label>
                <input
                  type="text"
                  id="edit-name"
                  name="edit-name"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={editIntegration.name}
                  onChange={(e) => setEditIntegration({...editIntegration, name: e.target.value})}
                />
              </div>
              
              <div>
                <label htmlFor="edit-type" className="block text-sm font-medium text-gray-700">
                  Entegrasyon Tipi
                </label>
                <select
                  id="edit-type"
                  name="edit-type"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={editIntegration.type}
                  onChange={(e) => {
                    const type = e.target.value as IntegrationType;
                    setEditIntegration({
                      ...editIntegration,
                      type,
                      config: getDefaultConfig(type)
                    });
                  }}
                >
                  <option value={IntegrationType.MQTT}>MQTT</option>
                  <option value={IntegrationType.HTTP}>HTTP</option>
                  <option value={IntegrationType.WEBSOCKET}>WebSocket</option>
                  <option value={IntegrationType.MODBUS}>Modbus</option>
                </select>
              </div>
              
              {/* MQTT Konfigürasyonu */}
              {editIntegration.type === IntegrationType.MQTT && (
                <>
                  <div>
                    <label htmlFor="edit-host" className="block text-sm font-medium text-gray-700">
                      Host
                    </label>
                    <input
                      type="text"
                      id="edit-host"
                      name="edit-host"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={editIntegration.config.host}
                      onChange={(e) => setEditIntegration({
                        ...editIntegration,
                        config: { ...editIntegration.config, host: e.target.value }
                      })}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="edit-port" className="block text-sm font-medium text-gray-700">
                      Port
                    </label>
                    <input
                      type="number"
                      id="edit-port"
                      name="edit-port"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={editIntegration.config.port}
                      onChange={(e) => setEditIntegration({
                        ...editIntegration,
                        config: { ...editIntegration.config, port: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="edit-username" className="block text-sm font-medium text-gray-700">
                      Kullanıcı Adı
                    </label>
                    <input
                      type="text"
                      id="edit-username"
                      name="edit-username"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={editIntegration.config.username}
                      onChange={(e) => setEditIntegration({
                        ...editIntegration,
                        config: { ...editIntegration.config, username: e.target.value }
                      })}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="edit-password" className="block text-sm font-medium text-gray-700">
                      Şifre
                    </label>
                    <input
                      type="password"
                      id="edit-password"
                      name="edit-password"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={editIntegration.config.password}
                      onChange={(e) => setEditIntegration({
                        ...editIntegration,
                        config: { ...editIntegration.config, password: e.target.value }
                      })}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="edit-topic" className="block text-sm font-medium text-gray-700">
                      Topic
                    </label>
                    <input
                      type="text"
                      id="edit-topic"
                      name="edit-topic"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      value={editIntegration.config.topic}
                      onChange={(e) => setEditIntegration({
                        ...editIntegration,
                        config: { ...editIntegration.config, topic: e.target.value }
                      })}
                    />
                  </div>
                </>
              )}
              
              {/* System Admin için şirket seçimi */}
              {currentUser?.role === 'system_admin' && (
                <div>
                  <label htmlFor="edit-company" className="block text-sm font-medium text-gray-700">
                    Şirket
                  </label>
                  <select
                    id="edit-company"
                    name="edit-company"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={editIntegration.company_id}
                    onChange={(e) => setEditIntegration({...editIntegration, company_id: e.target.value})}
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
                onClick={() => setEditIntegrationId(null)}
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Varsayılan konfigürasyon ayarlarını getir
  const getDefaultConfig = (type: IntegrationType) => {
    switch (type) {
      case IntegrationType.MQTT:
        return {
          host: '',
          port: 1883,
          username: '',
          password: '',
          topic: ''
        };
      case IntegrationType.HTTP:
        return {
          url: '',
          method: 'GET',
          headers: {}
        };
      case IntegrationType.WEBSOCKET:
        return {
          url: '',
          protocols: []
        };
      case IntegrationType.MODBUS:
        return {
          host: '',
          port: 502,
          slaveId: 1
        };
      default:
        return {};
    }
  };

  // Durum rengini getir
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'inactive':
        return 'text-gray-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Durum metnini getir
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'inactive':
        return 'Pasif';
      case 'error':
        return 'Hata';
      default:
        return 'Bilinmiyor';
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Entegrasyonlar</h1>
          
          {/* Sadece System Admin ve Company Admin entegrasyon ekleyebilir */}
          {(currentUser?.role === 'system_admin' || currentUser?.role === 'company_admin') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
            >
              Yeni Entegrasyon Ekle
            </button>
          )}
        </div>
        
        {/* Entegrasyonlar Listesi */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="flex flex-col">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden border-b border-gray-200 shadow sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Entegrasyon Adı
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tip
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Şirket
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Durum
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Son Bağlantı
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {integrations.length > 0 ? (
                        integrations.map(integration => (
                          <tr key={integration.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{integration.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{integration.type.toUpperCase()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{integration.company?.name || 'Atanmamış'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(integration.status)}`}>
                                {getStatusText(integration.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {integration.last_connection ? new Date(integration.last_connection).toLocaleString('tr-TR') : 'Hiç bağlanmadı'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                {/* System Admin tüm entegrasyonları düzenleyebilir, Company Admin sadece şirketindekileri */}
                                {(currentUser?.role === 'system_admin' || 
                                  (currentUser?.role === 'company_admin' && integration.company_id === currentUser.company_id)) && (
                                  <>
                                    <button
                                      onClick={() => handleEditIntegration(integration)}
                                      className="text-indigo-600 hover:text-indigo-900"
                                    >
                                      Düzenle
                                    </button>
                                    <button
                                      onClick={() => handleDeleteIntegration(integration.id)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      Sil
                                    </button>
                                    <button
                                      onClick={() => handleToggleStatus(integration)}
                                      className={`${
                                        integration.status === 'active' 
                                          ? 'text-yellow-600 hover:text-yellow-900' 
                                          : 'text-green-600 hover:text-green-900'
                                      }`}
                                    >
                                      {integration.status === 'active' ? 'Durdur' : 'Başlat'}
                                    </button>
                                  </>
                                )}
                                <button
                                  className="text-blue-600 hover:text-blue-900"
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
                          <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                            Henüz entegrasyon bulunmamaktadır.
                            {(currentUser?.role === 'system_admin' || currentUser?.role === 'company_admin') && (
                              <span> Yeni bir entegrasyon ekleyin.</span>
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
      {renderAddIntegrationModal()}
      {renderEditIntegrationModal()}
    </div>
  );
}
