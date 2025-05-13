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
  sensor_id: string;
  temperature: number;
  humidity: number;
  timestamp: string;
}

export default function DashboardPage() {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3000/sensor-data', {
          withCredentials: true
        });
        setSensorData(response.data);
      } catch (err) {
        setError('Veri yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Her 30 saniyede bir verileri güncelle
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const chartData = {
    labels: sensorData.map(data => new Date(data.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Sıcaklık (°C)',
        data: sensorData.map(data => data.temperature),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Nem (%)',
        data: sensorData.map(data => data.humidity),
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">IoT Sensör Dashboard</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <Line options={chartOptions} data={chartData} />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sensorData.slice(0, 6).map((data) => (
            <div key={data.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Sensör: {data.sensor_id}
              </h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  Sıcaklık: <span className="font-medium text-gray-900">{data.temperature}°C</span>
                </p>
                <p className="text-sm text-gray-500">
                  Nem: <span className="font-medium text-gray-900">{data.humidity}%</span>
                </p>
                <p className="text-sm text-gray-500">
                  Zaman: <span className="font-medium text-gray-900">
                    {new Date(data.timestamp).toLocaleString()}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 