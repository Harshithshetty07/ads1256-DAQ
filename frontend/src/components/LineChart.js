import React, { useState, useEffect } from 'react';

const VibrationChart = () => {
  const [vibrationData, setVibrationData] = useState({
    Channel1: [],
    Channel2: [],
    Channel3: [],
    Channel4: []
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  // FFT Parameters
  const SAMPLING_FREQ = 127940; // Hz
  const FFT_SIZE = 4096;
  const FFT_MAGNITUDE = 2048;

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
          Channel1: data.data.V1 || [],
          Channel2: data.data.V2 || [],
          Channel3: data.data.V3 || [],
          Channel4: data.data.V4 || []
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
    fetchVibrationData();
    const interval = setInterval(fetchVibrationData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Function to convert bin index to frequency
  const binToFrequency = (binIndex) => {
    return (binIndex * SAMPLING_FREQ) / FFT_SIZE;
  };

  // Function to find peaks in magnitude data
  const findPeaks = (magnitudeData, minHeight = 0.1, minDistance = 5) => {
    if (!magnitudeData || magnitudeData.length === 0) return [];
    
    const peaks = [];
    
    for (let i = minDistance; i < magnitudeData.length - minDistance; i++) {
      const current = magnitudeData[i];
      
      // Check if current point is higher than minimum height
      if (current < minHeight) continue;
      
      // Check if current point is a local maximum
      let isPeak = true;
      for (let j = i - minDistance; j <= i + minDistance; j++) {
        if (j !== i && magnitudeData[j] >= current) {
          isPeak = false;
          break;
        }
      }
      
      if (isPeak) {
        peaks.push({
          binIndex: i,
          frequency: binToFrequency(i),
          magnitude: current
        });
      }
    }
    
    // Sort peaks by magnitude (highest first) and return top 5
    return peaks.sort((a, b) => b.magnitude - a.magnitude).slice(0, 5);
  };

  // Helper function to calculate statistics including peak detection
  const calculateStats = (data) => {
    if (!data || data.length === 0) return { 
      min: 0, max: 0, avg: 0, rms: 0, peaks: [] 
    };
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const avg = data.reduce((sum, val) => sum + val, 0) / data.length;
    
    // Calculate RMS (Root Mean Square)
    const rms = Math.sqrt(data.reduce((sum, val) => sum + val * val, 0) / data.length);
    
    // Find peaks
    const peaks = findPeaks(data);
    
    return { min, max, avg, rms, peaks };
  };

  // Colors for each channel
  const colors = {
    Channel1: '#FF6B6B',
    Channel2: '#4ECDC4', 
    Channel3: '#45B7D1',
    Channel4: '#96CEB4'
  };

  // Peak Card Component
  const PeakCard = ({ channelName, peaks, color }) => {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
          <h3 className="text-lg font-semibold text-gray-800">{channelName} Peaks</h3>
        </div>
        <div className="space-y-2">
          {peaks.length > 0 ? (
            peaks.map((peak, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                <div>
                  <span className="font-mono text-blue-600">{peak.frequency.toFixed(1)} Hz</span>
                </div>
                <div>
                  <span className="font-mono text-red-600">{peak.magnitude.toFixed(4)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-sm text-center py-4">No peaks detected</div>
          )}
        </div>
      </div>
    );
  };

  // Individual chart component
  const ChannelChart = ({ channelName, data, color }) => {
    const chartWidth = 700;
    const chartHeight = 300;
    const padding = { top: 40, right: 40, bottom: 60, left: 80 };
    const plotWidth = chartWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;

    // Calculate frequency range for X-axis
    const maxFreq = SAMPLING_FREQ / 2; // Nyquist frequency
    const freqStep = maxFreq / Math.max(data.length - 1, 1);

    // Calculate min/max for Y-axis (magnitude)
    const yMin = 0; // Magnitude starts from 0
    const yMax = data.length > 0 ? Math.max(...data) : 1;
    const yRange = yMax - yMin;

    const stats = calculateStats(data);

    // Generate path for the line
    const generatePath = () => {
      if (!data || data.length === 0) return '';
      
      const points = data.map((magnitude, index) => {
        const frequency = binToFrequency(index);
        const x = padding.left + (frequency / maxFreq) * plotWidth;
        const y = padding.top + plotHeight - ((magnitude - yMin) / Math.max(yRange, 0.001)) * plotHeight;
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
            <h3 className="text-xl font-bold text-gray-800">{channelName} - FFT Magnitude</h3>
          </div>
          {/* <div className="text-sm text-gray-600">
            {data.length} bins
          </div> */}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-3 mb-4 text-sm">
          <div className="bg-gray-50 p-2 rounded text-center">
            <div className="text-gray-600">Max Mag</div>
            <div className="font-mono font-bold text-red-600">{stats.max.toFixed(4)}</div>
          </div>
          {/* <div className="bg-gray-50 p-2 rounded text-center">
            <div className="text-gray-600">Avg Mag</div>
            <div className="font-mono font-bold text-green-600">{stats.avg.toFixed(4)}</div>
          </div> */}
          {/* <div className="bg-gray-50 p-2 rounded text-center">
            <div className="text-gray-600">RMS</div>
            <div className="font-mono font-bold text-purple-600">{stats.rms.toFixed(4)}</div>
          </div> */}
          <div className="bg-gray-50 p-2 rounded text-center">
            <div className="text-gray-600">Peaks</div>
            <div className="font-mono font-bold text-orange-600">{stats.peaks.length}</div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-gray-50 p-2 rounded">
          <svg width={chartWidth} height={chartHeight} className="border rounded bg-white">
            {/* Grid lines */}
            <defs>
              <pattern id={`grid-${channelName}`} width="40" height="30" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
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

            {/* Y-axis labels (Magnitude) */}
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
              const y = padding.top + plotHeight * (1 - ratio);
              const value = yMin + ratio * yRange;
              return (
                <g key={ratio}>
                  <line x1={padding.left - 5} y1={y} x2={padding.left} y2={y} stroke="#6b7280" strokeWidth="1"/>
                  <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill="#6b7280">
                    {value.toFixed(3)}
                  </text>
                </g>
              );
            })}

            {/* X-axis labels (Frequency) */}
            {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map(ratio => {
              const x = padding.left + plotWidth * ratio;
              const frequency = ratio * maxFreq;
              return (
                <g key={ratio}>
                  <line x1={x} y1={chartHeight - padding.bottom} x2={x} y2={chartHeight - padding.bottom + 5} stroke="#6b7280" strokeWidth="1"/>
                  <text x={x} y={chartHeight - padding.bottom + 20} textAnchor="middle" fontSize="11" fill="#6b7280">
                    {(frequency / 1000).toFixed(1)}k
                  </text>
                </g>
              );
            })}

            {/* Axis titles */}
            <text x={padding.left / 2} y={chartHeight / 2} textAnchor="middle" fontSize="12" fill="#374151" fontWeight="bold" transform={`rotate(-90, ${padding.left / 2}, ${chartHeight / 2})`}>
              Magnitude (g)
            </text>
            <text x={chartWidth / 2} y={chartHeight - 10} textAnchor="middle" fontSize="12" fill="#374151" fontWeight="bold">
              Frequency (kHz)
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
                  d={`${generatePath()} L ${chartWidth - padding.right} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`}
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

                {/* Peak markers */}
                {stats.peaks.map((peak, index) => {
                  const x = padding.left + (peak.frequency / maxFreq) * plotWidth;
                  const y = padding.top + plotHeight - ((peak.magnitude - yMin) / Math.max(yRange, 0.001)) * plotHeight;
                  return (
                    <g key={index}>
                      <circle
                        cx={x}
                        cy={y}
                        r="4"
                        fill="#ff4444"
                        stroke="white"
                        strokeWidth="2"
                      />
                      <text
                        x={x}
                        y={y - 10}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#ff4444"
                        fontWeight="bold"
                      >
                        {peak.frequency.toFixed(1)}Hz
                      </text>
                    </g>
                  );
                })}
              </>
            )}

            {/* No data message */}
            {data.length === 0 && (
              <text x={chartWidth / 2} y={chartHeight / 2} textAnchor="middle" fontSize="14" fill="#9ca3af">
                No FFT data available
              </text>
            )}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full mx-auto p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">4-Channel Vibration FFT Monitoring</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="font-semibold text-blue-800">Sampling Frequency</div>
            <div className="text-lg font-mono text-blue-600">{SAMPLING_FREQ.toLocaleString()} Hz</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="font-semibold text-green-800">FFT Size</div>
            <div className="text-lg font-mono text-green-600">{FFT_SIZE.toLocaleString()}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="font-semibold text-purple-800">Frequency Resolution</div>
            <div className="text-lg font-mono text-purple-600">{(SAMPLING_FREQ / FFT_SIZE).toFixed(2)} Hz/bin</div>
          </div>
        </div>
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
            <span>Auto-refresh: 4 seconds</span>
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

      {/* Peak Detection Cards */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Peak Detection Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <PeakCard 
            channelName="Channel 1" 
            peaks={calculateStats(vibrationData.Channel1).peaks} 
            color={colors.Channel1} 
          />
          <PeakCard 
            channelName="Channel 2" 
            peaks={calculateStats(vibrationData.Channel2).peaks} 
            color={colors.Channel2} 
          />
          <PeakCard 
            channelName="Channel 3" 
            peaks={calculateStats(vibrationData.Channel3).peaks} 
            color={colors.Channel3} 
          />
          <PeakCard 
            channelName="Channel 4" 
            peaks={calculateStats(vibrationData.Channel4).peaks} 
            color={colors.Channel4} 
          />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChannelChart 
          channelName="Channel 1" 
          data={vibrationData.Channel1} 
          color={colors.Channel1} 
        />
        <ChannelChart 
          channelName="Channel 2" 
          data={vibrationData.Channel2} 
          color={colors.Channel2} 
        />
        <ChannelChart 
          channelName="Channel 3" 
          data={vibrationData.Channel3} 
          color={colors.Channel3} 
        />
        <ChannelChart 
          channelName="Channel 4" 
          data={vibrationData.Channel4} 
          color={colors.Channel4} 
        />
      </div>

      {/* Summary Footer */}
      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">FFT Analysis Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.keys(colors).map(channel => {
            const stats = calculateStats(vibrationData[channel]);
            const dominantPeak = stats.peaks[0];
            return (
              <div key={channel} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[channel] }}></div>
                  <span className="font-semibold text-gray-700">{channel}</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Max: {stats.max.toFixed(4)}</div>
                  {/* <div>RMS: {stats.rms.toFixed(4)}</div>
                  {dominantPeak && (
                    <div className="font-semibold text-blue-600">
                      Peak: {dominantPeak.frequency.toFixed(1)} Hz
                    </div>
                  )} */}
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