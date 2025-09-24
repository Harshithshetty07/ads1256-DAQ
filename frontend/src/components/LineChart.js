import React, { useState, useEffect } from 'react';

const VibrationChart = () => {
  const [vibrationData, setVibrationData] = useState({
    V1: [],
    V2: [],
    V3: [],
    V4: []
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  // Function to fetch data from API
  const fetchVibrationData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('https://cmti-edge.online/ESP32/TestVibration.php', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setVibrationData({
          V1: data.data.V1 || [],
          V2: data.data.V2 || [],
          V3: data.data.V3 || [],
          V4: data.data.V4 || []
        });
        setLastUpdate(new Date(data.timestamp));
      } else {
        throw new Error(data.message || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('Error fetching vibration data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data every 6 seconds
  useEffect(() => {
    // Fetch immediately on mount
    fetchVibrationData();
    
    // Set up interval for 6 seconds
    const interval = setInterval(fetchVibrationData, 6000);
    
    return () => clearInterval(interval);
  }, []);

  // Helper function to calculate statistics
  const calculateStats = (data) => {
    if (!data || data.length === 0) return { min: 0, max: 0, avg: 0 };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const avg = data.reduce((sum, val) => sum + val, 0) / data.length;
    return { min, max, avg };
  };

  // Colors for each channel
  const colors = {
    V1: '#FF6B6B',
    V2: '#4ECDC4', 
    V3: '#45B7D1',
    V4: '#96CEB4'
  };

  // Individual chart component
  const ChannelChart = ({ channelName, data, color }) => {
    const chartWidth = 600;
    const chartHeight = 250;
    const padding = { top: 40, right: 40, bottom: 50, left: 60 };
    const plotWidth = chartWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;

    // Calculate min/max for this channel's Y-axis
    const yMin = data.length > 0 ? Math.min(...data) : 0;
    const yMax = data.length > 0 ? Math.max(...data) : 1;
    const yRange = yMax - yMin;
    const yPadding = yRange * 0.1; // 10% padding

    const stats = calculateStats(data);

    // Generate path for the line
    const generatePath = () => {
      if (!data || data.length === 0) return '';
      
      const points = data.map((value, index) => {
        const x = padding.left + (index / Math.max(data.length - 1, 1)) * plotWidth;
        const y = padding.top + plotHeight - ((value - (yMin - yPadding)) / Math.max(yRange + 2 * yPadding, 0.001)) * plotHeight;
        return `${x},${y}`;
      });
      
      return `M ${points.join(' L ')}`;
    };

    return (
      <div className="bg-white rounded-lg shadow-md p-4 border">
        {/* Chart Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
            <h3 className="text-xl font-bold text-gray-800">{channelName}</h3>
          </div>
          <div className="text-sm text-gray-600">
            {data.length} samples
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
          <div className="bg-gray-50 p-2 rounded text-center">
            <div className="text-gray-600">Min</div>
            <div className="font-mono font-bold text-blue-600">{stats.min.toFixed(4)}</div>
          </div>
          <div className="bg-gray-50 p-2 rounded text-center">
            <div className="text-gray-600">Max</div>
            <div className="font-mono font-bold text-red-600">{stats.max.toFixed(4)}</div>
          </div>
          <div className="bg-gray-50 p-2 rounded text-center">
            <div className="text-gray-600">Avg</div>
            <div className="font-mono font-bold text-green-600">{stats.avg.toFixed(4)}</div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-gray-50 p-2 rounded">
          <svg width={chartWidth} height={chartHeight} className="border rounded bg-white">
            {/* Grid lines */}
            <defs>
              <pattern id={`grid-${channelName}`} width="30" height="25" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 25" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width={chartWidth} height={chartHeight} fill={`url(#grid-${channelName})`} />
            
            {/* Axes */}
            <line 
              x1={padding.left} 
              y1={padding.top} 
              x2={padding.left} 
              y2={chartHeight - padding.bottom} 
              stroke="#374151" 
              strokeWidth="2"
            />
            <line 
              x1={padding.left} 
              y1={chartHeight - padding.bottom} 
              x2={chartWidth - padding.right} 
              y2={chartHeight - padding.bottom} 
              stroke="#374151" 
              strokeWidth="2"
            />

            {/* Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
              const y = padding.top + plotHeight * (1 - ratio);
              const value = (yMin - yPadding) + ratio * (yRange + 2 * yPadding);
              return (
                <g key={ratio}>
                  <line x1={padding.left - 5} y1={y} x2={padding.left} y2={y} stroke="#6b7280" strokeWidth="1"/>
                  <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#6b7280">
                    {value.toFixed(3)}
                  </text>
                </g>
              );
            })}

            {/* X-axis labels */}
            {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0., 0.8, 0.9, 1, 2,].map(ratio => {
              const x = padding.left + plotWidth * ratio;
              const sampleIndex = Math.floor(ratio * Math.max(data.length - 1, 0));
              return (
                <g key={ratio}>
                  <line x1={x} y1={chartHeight - padding.bottom} x2={x} y2={chartHeight - padding.bottom + 5} stroke="#6b7280" strokeWidth="1"/>
                  <text x={x} y={chartHeight - padding.bottom + 20} textAnchor="middle" fontSize="11" fill="#6b7280">
                    {sampleIndex}
                  </text>
                </g>
              );
            })}

            {/* Axis titles */}
            <text x={padding.left / 2} y={chartHeight / 2} textAnchor="middle" fontSize="12" fill="#374151" fontWeight="bold" transform={`rotate(-90, ${padding.left / 2}, ${chartHeight / 2})`}>
              Amplitude
            </text>
            <text x={chartWidth / 2} y={chartHeight - 10} textAnchor="middle" fontSize="12" fill="#374151" fontWeight="bold">
              Frequency
            </text>

            {/* Data line */}
            {data.length > 0 && (
              <>
                {/* Area fill */}
                <defs>
                  <linearGradient id={`gradient-${channelName}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
                    <stop offset="100%" stopColor={color} stopOpacity="0.05"/>
                  </linearGradient>
                </defs>
                <path
                  d={`${generatePath()} L ${padding.left + plotWidth} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`}
                  fill={`url(#gradient-${channelName})`}
                />
                
                {/* Line */}
                <path
                  d={generatePath()}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {/* Data points (show every 50th point to avoid clutter) */}
                {data.map((value, index) => {
                  if (index % Math.max(Math.floor(data.length / 20), 1) === 0) {
                    const x = padding.left + (index / Math.max(data.length - 1, 1)) * plotWidth;
                    const y = padding.top + plotHeight - ((value - (yMin - yPadding)) / Math.max(yRange + 2 * yPadding, 0.001)) * plotHeight;
                    return (
                      <circle
                        key={index}
                        cx={x}
                        cy={y}
                        r="2"
                        fill={color}
                        stroke="white"
                        strokeWidth="1"
                      />
                    );
                  }
                  return null;
                })}
              </>
            )}

            {/* No data message */}
            {data.length === 0 && (
              <text x={chartWidth / 2} y={chartHeight / 2} textAnchor="middle" fontSize="14" fill="#9ca3af">
                No data available
              </text>
            )}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">4-Channel Vibration Monitoring</h1>
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
            <span className="font-medium">{loading ? 'Fetching data...' : 'Connected'}</span>
          </div>
          {lastUpdate && (
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Last Update: {lastUpdate.toLocaleTimeString()}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Auto-refresh: 6 seconds</span>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L5.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="font-medium">Error: {error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChannelChart 
          channelName="V1" 
          data={vibrationData.V1} 
          color={colors.V1} 
        />
        <ChannelChart 
          channelName="V2" 
          data={vibrationData.V2} 
          color={colors.V2} 
        />
        <ChannelChart 
          channelName="V3" 
          data={vibrationData.V3} 
          color={colors.V3} 
        />
        <ChannelChart 
          channelName="V4" 
          data={vibrationData.V4} 
          color={colors.V4} 
        />
      </div>

      {/* Summary Footer */}
      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.keys(colors).map(channel => {
            const stats = calculateStats(vibrationData[channel]);
            return (
              <div key={channel} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[channel] }}></div>
                  <span className="font-semibold text-gray-700">{channel}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Range: {(stats.max - stats.min).toFixed(4)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VibrationChart;