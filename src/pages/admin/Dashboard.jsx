import React, { useEffect, useState, useRef } from 'react';
import { subscribeToDashboardMetrics, getRecentActivities, getWeeklyActivityData } from '../../utils/firestoreUtils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    totalMembers: 0,
    activeMembers: 0,
    newMembersToday: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [weeklyActivityData, setWeeklyActivityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentActivitiesError, setRecentActivitiesError] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [chartError, setChartError] = useState(null);
  const mountedRef = useRef(true);

  // Handle component mounting
  useEffect(() => {
    setIsMounted(true);
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    setLoading(true);

    // Use Firebase data for all users (both admin and regular users)
    const unsubscribe = subscribeToDashboardMetrics((data) => {
      if (mountedRef.current) {
        setMetrics(data);
        setLoading(false);
      }
    });

    getRecentActivities()
      .then((activities) => {
        if (mountedRef.current) {
          if (activities && activities.length > 0) {
            setRecentActivities(activities);
            setRecentActivitiesError(null);
          } else {
            setRecentActivities([]);
            setRecentActivitiesError('No recent activities');
          }
        }
      })
      .catch((err) => {
        if (mountedRef.current) {
          console.error(err);
          setRecentActivitiesError('Failed to load recent activities');
        }
      });

    getWeeklyActivityData()
      .then((data) => {
        if (mountedRef.current) {
          setWeeklyActivityData(data);
        }
      })
      .catch((err) => {
        if (mountedRef.current) {
          console.error('Chart data error:', err);
          setChartError('Failed to load chart data');
        }
      });

    return () => unsubscribe();
  }, [isMounted]);

  if (loading) {
    return <div className="text-center py-10">Loading dashboard metrics...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  // Show error specifically for recent activities without blocking whole dashboard
  const recentActivitiesErrorMessage = recentActivitiesError ? (
    <p className="text-red-600 text-sm text-center py-4">{recentActivitiesError}</p>
  ) : null;

  const metricItems = [
    { title: 'Total Members', value: metrics.totalMembers, icon: '👥', color: 'bg-blue-500' },
    { title: 'Active Members', value: metrics.activeMembers, icon: '✅', color: 'bg-green-500' },
    { title: 'New Members Today', value: metrics.newMembersToday, icon: '🆕', color: 'bg-purple-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {metricItems.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${metric.color} text-white`}>
                <span className="text-xl">{metric.icon}</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Activity Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Activity</h2>
          <div className="h-64">
            {chartError ? (
              <div className="h-full bg-red-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-red-600">
                  <p className="text-2xl mb-2">⚠️</p>
                  <p className="text-sm">Chart failed to load</p>
                  <p className="text-xs mt-1">{chartError}</p>
                </div>
              </div>
            ) : isMounted && weeklyActivityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={200}>
                <LineChart data={weeklyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="newMembers" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p className="text-2xl mb-2">📊</p>
                  <p>Loading chart data...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>
          <div className="space-y-3">
            {recentActivities.length === 0 && (
              <p className="text-gray-500 text-sm">No recent activities</p>
            )}
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <span className="text-sm text-gray-700">{activity.action}</span>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Member Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{metrics.totalMembers}</div>
            <div className="text-sm text-gray-600">Total Members</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{metrics.activeMembers}</div>
            <div className="text-sm text-gray-600">Active Members</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{metrics.newMembersToday}</div>
            <div className="text-sm text-gray-600">New Today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{Math.round((metrics.activeMembers / metrics.totalMembers) * 100) || 0}%</div>
            <div className="text-sm text-gray-600">Activity Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
