import React, { useState, useEffect } from 'react';

const MagnitudeFrequencyChart = () => {
  const [dataPoints, setDataPoints] = useState([
    { magnitude: 10, frequency: 150 },
    { magnitude: 15, frequency: 300 },
    { magnitude: 20, frequency: 500 },
    { magnitude: 25, frequency: 800 },
    { magnitude: 30, frequency: 1200 },
    { magnitude: 35, frequency: 1600 },
    { magnitude: 40, frequency: 1900 },
    { magnitude: 45, frequency: 2100 },
    { magnitude: 0, frequency: 0 }  // Fixed point at origin
  ]);

  // Function to generate frequency based on magnitude with some randomness
  const generateFrequencyFromMagnitude = (magnitude) => {
    if (magnitude === 0) return 0; // Keep origin fixed
    // Base frequency calculation: higher magnitude = higher frequency
    const baseFrequency = magnitude * 45; // Scale factor to spread across 0-2300
    // Add some randomness (±20% variation)
    const variation = baseFrequency * 0.2 * (Math.random() - 0.5);
    return Math.max(0, Math.min(2300, Math.floor(baseFrequency + variation)));
  };

  // Update data points every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setDataPoints(prevPoints => {
        const newPoints = prevPoints.map((point, index) => {
          if (index === prevPoints.length - 1) {
            // Keep the last point (origin) fixed
            return { magnitude: 0, frequency: 0 };
          }
          
          // Generate new magnitude (keeping some stability)
          const baseMagnitude = 5 + index * 5; // Base pattern
          const variation = 10 * (Math.random() - 0.5); // ±5 variation
          const newMagnitude = Math.max(0, Math.min(50, Math.floor(baseMagnitude + variation)));
          
          // Generate frequency based on magnitude
          const newFrequency = generateFrequencyFromMagnitude(newMagnitude);
          
          return { magnitude: newMagnitude, frequency: newFrequency };
        });
        
        return newPoints;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Magnitude vs Frequency Chart</h2>
        <p className="text-gray-600">Live updating chart showing the relationship between magnitude and frequency. Origin point (0,0) is fixed.</p>
      </div> */}
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <div style={{ height: '500px' }}>
          <svg width="100%" height="100%" viewBox="0 0 900 450" className="border rounded">
            <defs>
              <linearGradient id="gridGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f3f3f3" stopOpacity="0.5"/>
                <stop offset="100%" stopColor="transparent"/>
              </linearGradient>
            </defs>
            
            {/* Grid lines - Horizontal (for magnitude) */}
            {[0, 10, 20, 30, 40, 50].map(value => (
              <line 
                key={`h-grid-${value}`}
                x1="80" 
                y1={380 - (value / 50) * 320} 
                x2="820" 
                y2={380 - (value / 50) * 320} 
                stroke="#e0e0e0" 
                strokeWidth="1"
              />
            ))}
            
            {/* Grid lines - Vertical (for frequency) */}
            {[0, 500, 1000, 1500, 2000, 2300].map(value => (
              <line 
                key={`v-grid-${value}`}
                x1={80 + (value / 2300) * 740} 
                y1="60" 
                x2={80 + (value / 2300) * 740} 
                y2="380" 
                stroke="#e0e0e0" 
                strokeWidth="1"
              />
            ))}
            
            {/* Y-axis */}
            <line x1="80" y1="60" x2="80" y2="380" stroke="#333" strokeWidth="2"/>
            
            {/* X-axis */}
            <line x1="80" y1="380" x2="820" y2="380" stroke="#333" strokeWidth="2"/>
            
            {/* Y-axis title */}
            <text x="30" y="220" fill="#333" fontSize="14" fontWeight="bold" textAnchor="middle" transform="rotate(-90, 30, 220)">
              Magnitude
            </text>
            
            {/* X-axis title */}
            <text x="450" y="430" fill="#333" fontSize="14" fontWeight="bold" textAnchor="middle">
              Frequency
            </text>
            
            {/* Chart title */}
            <text x="450" y="30" fill="#263238" fontSize="18" fontWeight="bold" textAnchor="middle">
              Magnitude vs Frequency (Auto-updating)
            </text>
            
            {/* Y-axis labels (Magnitude) */}
            {[0, 10, 20, 30, 40, 50].map(value => (
              <text 
                key={`y-label-${value}`}
                x="70" 
                y={385 - (value / 50) * 320} 
                fill="#666" 
                fontSize="12" 
                textAnchor="end"
              >
                {value}
              </text>
            ))}
            
            {/* X-axis labels (Frequency) */}
            {[0, 500, 1000, 1500, 2000, 2300].map(value => (
              <text 
                key={`x-label-${value}`}
                x={80 + (value / 2300) * 740} 
                y="400" 
                fill="#666" 
                fontSize="12" 
                textAnchor="middle"
              >
                {value}
              </text>
            ))}
            
            {/* Data line connecting points */}
            <polyline
              fill="none"
              stroke="#008FFB"
              strokeWidth="3"
              points={
                dataPoints
                  .sort((a, b) => a.frequency - b.frequency) // Sort by frequency for proper line connection
                  .map(point => 
                    `${80 + (point.frequency / 2300) * 740},${380 - (point.magnitude / 50) * 320}`
                  ).join(' ')
              }
            />
            
            {/* Data points */}
            {dataPoints.map((point, index) => (
              <circle
                key={`point-${index}`}
                cx={80 + (point.frequency / 2300) * 740}
                cy={380 - (point.magnitude / 50) * 320}
                r={point.magnitude === 0 && point.frequency === 0 ? "8" : "6"}
                fill={point.magnitude === 0 && point.frequency === 0 ? "#FF6B6B" : "#008FFB"}
                stroke="#fff"
                strokeWidth="2"
              />
            ))}
            
            {/* Data labels */}
            {dataPoints.map((point, index) => (
              <g key={`label-group-${index}`}>
                <rect
                  x={75 + (point.frequency / 2300) * 740}
                  y={375 - (point.magnitude / 50) * 320 - 35}
                  width="45"
                  height="30"
                  textAnchor="middle"
                  fill={point.magnitude === 0 && point.frequency === 0 ? "#FF6B6B" : "#333"}
                  rx="3"
                  opacity="0.9"
                />
                <text
                  x={97 + (point.frequency / 2300) * 740}
                  y={370 - (point.magnitude / 50) * 320 - 25}
                  fill="white"
                  fontSize="10"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  M:{point.magnitude}
                </text>
                <text
                  x={97 + (point.frequency / 2300) * 740}
                  y={370 - (point.magnitude / 50) * 320 - 15}
                  fill="white"
                  fontSize="10"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  F:{point.frequency}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
      
      {/* Legend */}
      {/* <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
          <span>Data Points</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span>Origin (0,0) - Fixed</span>
        </div>
        <div className="text-gray-500">
          Updates every 2 seconds
        </div>
      </div> */}
    </div>
  );
};

export default MagnitudeFrequencyChart;