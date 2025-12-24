import React from 'react';
import { Activity } from 'lucide-react';

const ChannelChart = ({ channelName, data, color, samplingFreq, fftSize }) => {
  const maxFreq = 60000;

  const binToFrequency = (binIndex) => {
    return (binIndex * samplingFreq) / fftSize;
  };

  const findPeaks = (magnitudeData, minHeight = 0.1, minDistance = 5) => {
    if (!magnitudeData || magnitudeData.length === 0) return [];
    
    const peaks = [];
    
    for (let i = minDistance; i < magnitudeData.length - minDistance; i++) {
      const current = magnitudeData[i];
      
      if (current < minHeight) continue;
      
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
    
    return peaks.sort((a, b) => b.magnitude - a.magnitude).slice(0, 5);
  };

  const calculateStats = (data) => {
    if (!data || data.length === 0) return { 
      min: 0, max: 0, avg: 0, rms: 0, peaks: [] 
    };
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const avg = data.reduce((sum, val) => sum + val, 0) / data.length;
    const rms = Math.sqrt(data.reduce((sum, val) => sum + val * val, 0) / data.length);
    const peaks = findPeaks(data);
    
    return { min, max, avg, rms, peaks };
  };

  const stats = calculateStats(data);

  const generatePath = (width, height, padding) => {
    if (!data || data.length === 0) return '';
    
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const yMin = 0;
    const yMax = data.length > 0 ? Math.max(...data) : 1;
    const yRange = yMax - yMin;
    
    const points = data.map((magnitude, index) => {
      const frequency = binToFrequency(index);
      if (frequency > maxFreq) return null;
      
      const x = padding.left + (frequency / maxFreq) * plotWidth;
      const y = padding.top + plotHeight - ((magnitude - yMin) / Math.max(yRange, 0.001)) * plotHeight;
      return `${x},${y}`;
    }).filter(point => point !== null);
    
    return `M ${points.join(' L ')}`;
  };

  return (
    <div className="bg-slate-800 rounded-2xl shadow-xl p-3 sm:p-4 lg:p-6 border border-slate-700 hover:border-slate-600 hover:shadow-2xl transition-all duration-300">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full animate-pulse" style={{ backgroundColor: color }}></div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-100">{channelName}</h3>
          <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4 text-xs sm:text-sm">
        <div className="bg-slate-900 bg-opacity-60 p-2 sm:p-3 rounded-lg border border-slate-700">
          <div className="text-slate-400 font-medium">Max Magnitude</div>
          <div className="font-mono font-bold text-emerald-400 text-sm sm:text-base">{stats.max.toFixed(4)}</div>
        </div>
        <div className="bg-slate-900 bg-opacity-60 p-2 sm:p-3 rounded-lg border border-slate-700">
          <div className="text-slate-400 font-medium">Peak Count</div>
          <div className="font-mono font-bold text-cyan-400 text-sm sm:text-base">{stats.peaks.length}</div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="bg-slate-950 p-2 sm:p-3 lg:p-4 rounded-xl border border-slate-800 overflow-x-auto">
        <svg viewBox="0 0 1200 300" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          <defs>
            {/* Gradient for chart fill */}
            <linearGradient id={`gradient-${channelName}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.4"/>
              <stop offset="100%" stopColor={color} stopOpacity="0.05"/>
            </linearGradient>
            
            {/* Glow effect for the line */}
            <filter id={`glow-${channelName}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Grid pattern */}
            <pattern id={`grid-${channelName}`} width="40" height="30" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="1"/>
            </pattern>
          </defs>

          {/* Grid background */}
          <rect width="1200" height="300" fill={`url(#grid-${channelName})`} />
          
          {/* Data visualization */}
          {data.length > 0 && (
            <>
              {/* Area fill */}
              <path
                d={`${generatePath(1200, 300, {top: 20, right: 40, bottom: 50, left: 60})} L 1160 280 L 60 280 Z`}
                fill={`url(#gradient-${channelName})`}
              />
              
              {/* Main line */}
              <path
                d={generatePath(1200, 300, {top: 20, right: 40, bottom: 20, left: 60})}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                filter={`url(#glow-${channelName})`}
              />

              {/* Peak markers */}
              {stats.peaks.filter(peak => peak.frequency <= maxFreq).slice(0, 3).map((peak, index) => {
                const plotWidth = 1200 - 60 - 40;
                const plotHeight = 300 - 20 - 50;
                const yMin = 0;
                const yMax = Math.max(...data);
                const yRange = yMax - yMin;
                const x = 60 + (peak.frequency / maxFreq) * plotWidth;
                const y = 20 + plotHeight - ((peak.magnitude - yMin) / Math.max(yRange, 0.001)) * plotHeight;
                return (
                  <g key={index}>
                    <circle 
                      cx={x} 
                      cy={y} 
                      r="5" 
                      fill="#ef4444" 
                      stroke="#f8fafc" 
                      strokeWidth="2" 
                      className="animate-pulse"
                    />
                    <text 
                      x={x} 
                      y={y - 12} 
                      textAnchor="middle" 
                      fontSize="11" 
                      fill="#f8fafc" 
                      fontWeight="bold"
                    >
                      {peak.frequency >= 1000 ? `${(peak.frequency/1000).toFixed(1)}kHz` : `${peak.frequency.toFixed(0)}Hz`}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {/* Axes */}
          <line x1="60" y1="20" x2="60" y2="280" stroke="#64748b" strokeWidth="2" opacity="0.5"/>
          <line x1="60" y1="280" x2="1160" y2="280" stroke="#64748b" strokeWidth="2" opacity="0.5"/>
          
          {/* Axis labels */}
          <text 
            x="30" 
            y="140" 
            textAnchor="middle" 
            fontSize="12" 
            fill="#cbd5e1" 
            fontWeight="bold" 
            transform="rotate(-90, 30, 155)"
          >
            Magnitude (g)
          </text>
          <text 
            x="610" 
            y="300" 
            textAnchor="middle" 
            fontSize="10" 
            fill="#cbd5e1" 
            fontWeight="bold"
          >
            Frequency kHz
          </text>


          {/* Y-axis tick marks and labels */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const yMin = 0;
            const yMax = data.length > 0 ? Math.max(...data) : 1;
            const yRange = yMax - yMin;
            const y = 20 + 230 * (1 - ratio);
            const value = yMin + ratio * yRange;
            return (
              <g key={ratio}>
                <line x1="55" y1={y} x2="60" y2={y} stroke="#64748b" strokeWidth="1.5"/>
                <text x="50" y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
                  {value.toFixed(3)}
                </text>
              </g>
            );
          })}


          {/* X-axis tick marks and labels */}
          {[0, 1000, 2000, 3000, 4000, 5000, 16000].map(frequency => {
            const ratio = frequency / maxFreq;
            const x = 60 + 11000 * ratio;
            return (
              <g key={frequency}>
                <line x1={x} y1="280" x2={x} y2="285" stroke="#64748b" strokeWidth="1.5"/>
                <text 
                  x={x} 
                  y="295" 
                  textAnchor="middle" 
                  fontSize="10" 
                  fill="#94a3b8"
                >
                  {frequency >= 1000 ? `${(frequency / 1000).toFixed(0)}k` : frequency}
                </text>
              </g>
            );
          })}

          {/* No data message */}
          {data.length === 0 && (
            <text x="600" y="150" textAnchor="middle" fontSize="14" fill="#64748b">
              No FFT data available
            </text>
          )}
        </svg>
      </div>
    </div>
  );
};

export default ChannelChart;