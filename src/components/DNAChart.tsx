import React from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip
} from 'recharts';
import { motion } from 'framer-motion';

export interface DNAScore {
  logical: number;   // 0-100
  verbal: number;    // 0-100
  creative: number;  // 0-100
}

interface Props {
  scores: DNAScore;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  accentColor?: string;
}

const sizeMap = { sm: 200, md: 280, lg: 360 };

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { value: number; payload: { subject: string } }[] }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-white/15 rounded-lg px-3 py-2 text-sm">
        <p className="text-white/60">{payload[0].payload.subject}</p>
        <p className="text-white font-bold text-base">{payload[0].value}<span className="text-white/40 text-xs">/100</span></p>
      </div>
    );
  }
  return null;
};

const DNAChart: React.FC<Props> = ({
  scores,
  size = 'md',
  showLabels = true,
  accentColor = '#60a5fa',
}) => {
  const data = [
    { subject: 'Logical', value: scores.logical, fullMark: 100 },
    { subject: 'Verbal', value: scores.verbal, fullMark: 100 },
    { subject: 'Creative', value: scores.creative, fullMark: 100 },
  ];

  const dimension = sizeMap[size];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="flex flex-col items-center gap-4"
    >
      {/* Chart */}
      <div style={{ width: dimension, height: dimension }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid
              stroke="rgba(255,255,255,0.08)"
              gridType="polygon"
            />
            <PolarAngleAxis
              dataKey="subject"
              tick={{
                fill: 'rgba(255,255,255,0.5)',
                fontSize: 12,
                fontFamily: 'Outfit',
                fontWeight: 600,
              }}
            />
            <Radar
              name="DNA"
              dataKey="value"
              stroke={accentColor}
              fill={accentColor}
              fillOpacity={0.25}
              strokeWidth={2}
              dot={{ r: 4, fill: accentColor, stroke: accentColor }}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Score pills */}
      {showLabels && (
        <div className="flex gap-3 flex-wrap justify-center">
          {[
            { label: 'Logical', value: scores.logical, color: '#60a5fa' },
            { label: 'Verbal', value: scores.verbal, color: '#a78bfa' },
            { label: 'Creative', value: scores.creative, color: '#34d399' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-white/60 text-xs">{label}</span>
              <span className="text-white font-bold text-xs">{value}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default DNAChart;
