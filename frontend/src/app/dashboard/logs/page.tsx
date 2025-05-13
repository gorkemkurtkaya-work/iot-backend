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
import { Search } from "lucide-react";
import axios from 'axios';

interface LogEntry {
  id: string;
  user_id: string;
  timestamp: string;
  action: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Sayfa yüklendiğinde log kaydı oluştur
    const createLogEntry = async () => {
      try {
        await axios.post('http://localhost:3000/user-logs', {
          user_id: "user_123", // Gerçek uygulamada bu değer oturum bilgisinden alınmalı
          timestamp: new Date().toISOString(),
          action: "viewed_logs"
        }, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('Log kaydı oluşturulurken hata:', error);
      }
    };

    createLogEntry();
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await axios.get('http://localhost:3000/user-logs', {
        withCredentials: true
      });
      
      // API yanıtını kontrol et ve diziye dönüştür
      const logsArray = Array.isArray(response.data) ? response.data : [];
      
      // Logları tarihe göre sırala (en yeniden en eskiye)
      const sortedLogs = logsArray.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setLogs(sortedLogs);
      setIsLoading(false);
    } catch (error) {
      console.error('Loglar yüklenirken hata oluştu:', error);
      setLogs([]);
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.user_id.toLowerCase().includes(searchQuery.toLowerCase())
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
    
    return timeSlots;
  };

  const timeSlotCounts = getTimeSlotCounts();

  return (
    <div className="container mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Zaman Dilimi Analizi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(timeSlotCounts).map(([timeSlot, count]) => (
              <div key={timeSlot} className="p-4 border rounded-lg">
                <div className="font-semibold">{timeSlot}</div>
                <div className="text-sm text-muted-foreground">
                  {count} ziyaret
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
            <Button onClick={fetchLogs} variant="outline">
              Yenile
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Kullanıcı ID</TableHead>
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
                      <TableCell>{log.user_id}</TableCell>
                      <TableCell>{log.action}</TableCell>
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
