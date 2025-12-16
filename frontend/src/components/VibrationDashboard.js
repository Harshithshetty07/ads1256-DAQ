import React, { useState, useEffect } from 'react';
import { Activity, Zap, Radio, TrendingUp } from 'lucide-react';
import ChannelChart from './LineChart';

const VibrationDashboard = () => {
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
  const SAMPLING_FREQ = 128000;
  const FFT_SIZE = 8192;
  const FFT_MAGNITUDE = 2048;

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

  useEffect(() => {
    fetchVibrationData();
    const interval = setInterval(fetchVibrationData, 4000);
    return () => clearInterval(interval);
  }, []);

  const binToFrequency = (binIndex) => {
    return (binIndex * SAMPLING_FREQ) / FFT_SIZE;
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

  const colors = {
    Channel1: '#10b981',
    Channel2: '#3b82f6', 
    Channel3: '#8b5cf6',
    Channel4: '#ec4899'
  };

  const PeakCard = ({ channelName, peaks, color }) => {
    return (
      <div className="bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6 border border-slate-700 hover:border-slate-600 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full animate-pulse" style={{ backgroundColor: color }}></div>
          <h3 className="text-base sm:text-lg font-bold text-slate-100">{channelName}</h3>
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 ml-auto text-slate-400" />
        </div>
        <div className="space-y-2">
          {peaks.length > 0 ? (
            peaks.map((peak, index) => (
              <div key={index} className="flex justify-between items-center p-2 sm:p-3 bg-slate-700 bg-opacity-50 rounded-lg text-xs sm:text-sm border border-slate-600 hover:border-slate-500 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full" style={{ backgroundColor: color }}></span>
                  <span className="font-mono font-semibold text-cyan-400">
                    {peak.frequency >= 1000 ? `${(peak.frequency/1000).toFixed(2)} kHz` : `${peak.frequency.toFixed(1)} Hz`}
                  </span>
                </div>
                <div>
                  <span className="font-mono font-bold text-emerald-400">{peak.magnitude.toFixed(4)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-slate-500 text-xs sm:text-sm text-center py-6 sm:py-8">No peaks detected</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-2 sm:p-4 lg:p-6">
      <div className="max-w-[2000px] mx-auto">
        {/* Header Section */}
        <div className="mb-4 sm:mb-6 lg:mb-8 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 border border-slate-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Radio className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-cyan-400 animate-pulse" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-slate-100">
                Vibration FFT Monitor
              </h1>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm">
              <div className="bg-slate-800 bg-opacity-80 backdrop-blur-sm p-2 sm:p-3 lg:p-4 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                  <div className="font-bold text-slate-300 text-base">Sampling Freq</div>
                </div>
                <div className="text-base sm:text-lg lg:text-xl font-mono font-bold text-cyan-400">{SAMPLING_FREQ.toLocaleString()} Hz</div>
              </div>
              <div className="bg-slate-800 bg-opacity-80 backdrop-blur-sm p-2 sm:p-3 lg:p-4 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                  <div className="font-bold text-slate-300 text-base">FFT Size</div>
                </div>
                <div className="text-base sm:text-lg lg:text-xl font-mono font-bold text-emerald-400">{FFT_SIZE.toLocaleString()}</div>
              </div>
              <div className="bg-slate-800 bg-opacity-80 backdrop-blur-sm p-2 sm:p-3 lg:p-4 rounded-xl border border-slate-700 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                  <div className="font-bold text-slate-300 text-base">Display Range</div>
                </div>
                <div className="text-base sm:text-lg lg:text-xl font-mono font-bold text-purple-400">0 - 60 kHz</div>
              </div>
            </div>
          
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 lg:gap-6 text-xs sm:text-sm">
              <div className="flex items-center gap-2 bg-slate-800 bg-opacity-80 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-slate-700">
                <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${loading ? 'bg-yellow-400 animate-ping' : 'bg-emerald-400'}`}></div>
                <span className="font-medium text-slate-200">{loading ? 'Updating...' : 'Live'}</span>
              </div>
              {/* {lastUpdate && (
                <div className="flex items-center gap-2 text-slate-300 bg-slate-800 bg-opacity-60 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-slate-700">
                  <span className="hidden sm:inline">Last Update:</span>
                  <span className="font-mono">{lastUpdate.toLocaleTimeString()}</span>
                </div>
              )} */}
              {error && (
                <div className="flex items-center gap-2 text-red-200 bg-red-900 bg-opacity-50 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-red-700">
                  <span className="font-medium">⚠ {error}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Peak Detection Section */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-100 mb-3 sm:mb-4 lg:mb-6 flex items-center gap-2 sm:gap-3">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-cyan-400" />
            Peak Detection
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <PeakCard channelName="Channel 1" peaks={calculateStats(vibrationData.Channel1).peaks} color={colors.Channel1} />
            <PeakCard channelName="Channel 2" peaks={calculateStats(vibrationData.Channel2).peaks} color={colors.Channel2} />
            <PeakCard channelName="Channel 3" peaks={calculateStats(vibrationData.Channel3).peaks} color={colors.Channel3} />
            <PeakCard channelName="Channel 4" peaks={calculateStats(vibrationData.Channel4).peaks} color={colors.Channel4} />
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8">
          <ChannelChart 
            channelName="Channel 1" 
            data={vibrationData.Channel1} 
            color={colors.Channel1}
            samplingFreq={SAMPLING_FREQ}
            fftSize={FFT_SIZE}
          />
          <ChannelChart 
            channelName="Channel 2" 
            data={vibrationData.Channel2} 
            color={colors.Channel2}
            samplingFreq={SAMPLING_FREQ}
            fftSize={FFT_SIZE}
          />
          <ChannelChart 
            channelName="Channel 3" 
            data={vibrationData.Channel3} 
            color={colors.Channel3}
            samplingFreq={SAMPLING_FREQ}
            fftSize={FFT_SIZE}
          />
          <ChannelChart 
            channelName="Channel 4" 
            data={vibrationData.Channel4} 
            color={colors.Channel4}
            samplingFreq={SAMPLING_FREQ}
            fftSize={FFT_SIZE}
          />
        </div>
      </div>
    </div>
  );
};

export default VibrationDashboard;