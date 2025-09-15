import React, { useState } from 'react';
import { FiTrendingUp, FiBarChart as FiBarChart3, FiPieChart } from 'react-icons/fi';

const AnalyticsChart = () => {
  const [activeChart, setActiveChart] = useState('line');

  // Mock data for charts
  const dailySOSData = [
    { day: 'Mon', reports: 12 },
    { day: 'Tue', reports: 8 },
    { day: 'Wed', reports: 15 },
    { day: 'Thu', reports: 6 },
    { day: 'Fri', reports: 18 },
    { day: 'Sat', reports: 22 },
    { day: 'Sun', reports: 10 }
  ];

  const weeklyCheckinsData = [
    { week: 'Week 1', checkins: 245 },
    { week: 'Week 2', checkins: 312 },
    { week: 'Week 3', checkins: 189 },
    { week: 'Week 4', checkins: 378 }
  ];

  const alertDistributionData = [
    { name: 'Email', value: 45, color: '#3B82F6' },
    { name: 'SMS', value: 30, color: '#10B981' },
    { name: 'Push', value: 25, color: '#F59E0B' }
  ];

  // Simple fallback chart components
  const SimpleLineChart = ({ data }) => (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-end justify-between h-48 border-b border-gray-300">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center">
            <div 
              className="bg-blue-500 w-8 rounded-t"
              style={{ height: `${(item.reports / 25) * 100}%` }}
            ></div>
            <span className="text-xs mt-2 text-gray-600">{item.day}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center text-sm text-gray-600">
        📈 Daily SOS Reports
      </div>
    </div>
  );

  const SimpleBarChart = ({ data }) => (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center">
            <span className="w-16 text-sm text-gray-600">{item.week}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-4 ml-4">
              <div 
                className="bg-teal-500 h-4 rounded-full"
                style={{ width: `${(item.checkins / 500) * 100}%` }}
              ></div>
            </div>
            <span className="ml-2 text-sm text-gray-600">{item.checkins}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center text-sm text-gray-600">
        📊 Weekly Check-ins
      </div>
    </div>
  );

  const SimplePieChart = ({ data }) => (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center">
              <div 
                className="w-4 h-4 rounded mr-2"
                style={{ backgroundColor: ['#ef4444', '#f59e0b', '#10b981'][index] }}
              ></div>
              <span className="text-sm text-gray-700">{item.name}</span>
            </div>
            <span className="text-sm font-semibold">{item.value}%</span>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center text-sm text-gray-600">
        🥧 Alert Distribution
      </div>
    </div>
  );

  const charts = [
    {
      id: 'line',
      title: 'Daily Emergency SOS Reports',
      icon: FiTrendingUp,
      component: <SimpleLineChart data={dailySOSData} />
    },
    {
      id: 'bar',
      title: 'Weekly Check-ins',
      icon: FiBarChart3,
      component: <SimpleBarChart data={weeklyCheckinsData} />
    },
    {
      id: 'pie',
      title: 'Alert Distribution',
      icon: FiPieChart,
      component: <SimplePieChart data={alertDistributionData} />
    }
  ];

  const activeChartData = charts.find(chart => chart.id === activeChart);

  return (
    <div className="mb-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Analytics & Insights</h2>
              <p className="text-sm text-gray-600">Emergency response and safety metrics</p>
            </div>
            
            {/* Chart Selector */}
            <div className="flex space-x-2 mt-4 sm:mt-0">
              {charts.map((chart) => {
                const Icon = chart.icon;
                return (
                  <button
                    key={chart.id}
                    onClick={() => setActiveChart(chart.id)}
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium
                      transition-all duration-200
                      ${activeChart === chart.id 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}
                  >
                    <Icon className="text-lg" />
                    <span className="hidden sm:inline">{chart.title.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart Content */}
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FiTrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              {activeChartData.title}
            </h3>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            {activeChartData.component}
          </div>
        </div>

        {/* Chart Insights */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activeChart === 'line' && (
              <>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-1">Peak Day</h4>
                  <p className="text-2xl font-bold text-red-600">Saturday</p>
                  <p className="text-sm text-red-600">22 SOS reports</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-1">Lowest Day</h4>
                  <p className="text-2xl font-bold text-green-600">Thursday</p>
                  <p className="text-sm text-green-600">6 SOS reports</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-1">Weekly Average</h4>
                  <p className="text-2xl font-bold text-blue-600">13.0</p>
                  <p className="text-sm text-blue-600">reports per day</p>
                </div>
              </>
            )}

            {activeChart === 'bar' && (
              <>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-1">Best Week</h4>
                  <p className="text-2xl font-bold text-green-600">Week 4</p>
                  <p className="text-sm text-green-600">378 check-ins</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-1">Growth Rate</h4>
                  <p className="text-2xl font-bold text-yellow-600">+54%</p>
                  <p className="text-sm text-yellow-600">vs last month</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-1">Total Check-ins</h4>
                  <p className="text-2xl font-bold text-blue-600">1,124</p>
                  <p className="text-sm text-blue-600">this month</p>
                </div>
              </>
            )}

            {activeChart === 'pie' && (
              <>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-1">Most Used</h4>
                  <p className="text-2xl font-bold text-blue-600">Email</p>
                  <p className="text-sm text-blue-600">45% of alerts</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-1">SMS Alerts</h4>
                  <p className="text-2xl font-bold text-green-600">30%</p>
                  <p className="text-sm text-green-600">of total alerts</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-1">Push Notifications</h4>
                  <p className="text-2xl font-bold text-yellow-600">25%</p>
                  <p className="text-sm text-yellow-600">of total alerts</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Data updated every 5 minutes</span>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsChart;
