'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw } from "lucide-react";
import axios from 'axios';

interface LogEntry {
  id: string;
  user_id: string;
  timestamp: string;
  action: string;
  username: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  company_id: string;
  role: string;
}

// İşlem tiplerini Türkçe'ye çeviren yardımcı fonksiyon
const translateAction = (action: string): string => {
  const actionMap: { [key: string]: string } = {
    'viewed_sensor_data': 'Sensör Verilerini Görüntüledi',
    'viewed_user_logs': 'Kullanıcı Loglarını Görüntüledi',
    'created_user': 'Kullanıcı Oluşturdu',
    'updated_user': 'Kullanıcı Güncelledi',
    'deleted_user': 'Kullanıcı Sildi',
    'logged_in': 'Giriş Yaptı',
    'logged_out': 'Çıkış Yaptı'
  };
  
  return actionMap[action] || action;
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Kullanıcıları çek
      const usersResponse = await axios.get('http://localhost:3000/users', {
        withCredentials: true
      });
      setUsers(usersResponse.data);

      // Logları çek
      const logsResponse = await axios.get('http://localhost:3000/user-logs', {
        withCredentials: true
      });
      
      // API yanıtını kontrol et ve diziye dönüştür
      const logsArray = Array.isArray(logsResponse.data) ? logsResponse.data : [];
      
      // Logları kullanıcı bilgileriyle eşleştir
      const logsWithUsers = logsArray.map(log => {
        const user = usersResponse.data.find((u: User) => u.id === log.user_id);
        return {
          ...log,
          username: user?.name || 'Bilinmeyen Kullanıcı'
        };
      });
      
      // Logları tarihe göre sırala (en yeniden en eskiye)
      const sortedLogs = logsWithUsers.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setLogs(sortedLogs);
    } catch (error) {
      console.error('Veriler yüklenirken hata oluştu:', error);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Zaman dilimlerine göre yoğunluğu hesapla
  const getTimeSlotCounts = () => {
    const timeSlots: { [key: string]: number } = {};
    
    logs.forEach(log => {
      const date = new Date(log.timestamp);
      const hour = date.getHours();
      const timeSlot = `${hour}:00-${hour + 1}:00`;
      
      timeSlots[timeSlot] = (timeSlots[timeSlot] || 0) + 1;
    });
    
    return Object.entries(timeSlots)
      .sort((a, b) => {
        const hourA = parseInt(a[0].split(':')[0]);
        const hourB = parseInt(b[0].split(':')[0]);
        return hourA - hourB;
      });
  };

  // Kullanıcı bazlı aktivite analizi
  const getUserActivityCounts = () => {
    const userActivities: { [key: string]: number } = {};
    
    logs.forEach(log => {
      userActivities[log.username] = (userActivities[log.username] || 0) + 1;
    });
    
    return Object.entries(userActivities)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // En aktif 5 kullanıcı
  };

  // İşlem bazlı aktivite analizi
  const getActionCounts = () => {
    const actionCounts: { [key: string]: number } = {};
    
    logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });
    
    return Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1]);
  };

  const timeSlotCounts = getTimeSlotCounts();
  const userActivityCounts = getUserActivityCounts();
  const actionCounts = getActionCounts();

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Zaman Dilimi Analizi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeSlotCounts.map(([timeSlot, count]) => (
                <div key={timeSlot} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="font-medium">{timeSlot}</span>
                  <span className="text-sm text-gray-600">{count} aktivite</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>En Aktif Kullanıcılar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userActivityCounts.map(([username, count]) => (
                <div key={username} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="font-medium">{username}</span>
                  <span className="text-sm text-gray-600">{count} aktivite</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>İşlem Analizi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {actionCounts.map(([action, count]) => (
                <div key={action} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="font-medium">{translateAction(action)}</span>
                  <span className="text-sm text-gray-600">{count} kez</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Logları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Log ara..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button onClick={fetchData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      Log bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{new Date(log.timestamp).toLocaleString('tr-TR')}</TableCell>
                      <TableCell>{log.username}</TableCell>
                      <TableCell>{translateAction(log.action)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
