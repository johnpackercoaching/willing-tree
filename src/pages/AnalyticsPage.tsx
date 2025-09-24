import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Heart,
  Star,
  Calendar,
  Award,
  Target,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Download,
  BarChart3,
  Activity,
  Users,
  Zap
} from 'lucide-react';
import { usePremiumFeature, PremiumFeatures } from '../hooks/usePremiumFeature';
import { UpgradePrompt } from '../components/premium/UpgradePrompt';
import { Button } from '../components/Button';

// Mock data for analytics
const generateMockData = () => {
  const weeklyScores = Array.from({ length: 12 }, (_, i) => ({
    week: `Week ${i + 1}`,
    score: Math.floor(Math.random() * 30) + 70,
    trend: Math.random() > 0.5 ? 'up' : 'down',
    change: Math.floor(Math.random() * 10) + 1
  }));

  const innermostGrowth = [
    { month: 'Jan', wants: 12, wishes: 8, willing: 15 },
    { month: 'Feb', wants: 15, wishes: 10, willing: 18 },
    { month: 'Mar', wants: 18, wishes: 12, willing: 22 },
    { month: 'Apr', wants: 22, wishes: 15, willing: 25 },
    { month: 'May', wants: 25, wishes: 18, willing: 28 },
    { month: 'Jun', wants: 28, wishes: 20, willing: 32 }
  ];

  const topPerformingItems = [
    { id: 1, type: 'want', title: 'Weekly date nights', score: 95, completions: 12 },
    { id: 2, type: 'wish', title: 'Surprise flowers', score: 92, completions: 8 },
    { id: 3, type: 'want', title: 'Morning coffee together', score: 89, completions: 20 },
    { id: 4, type: 'willing', title: 'Help with chores', score: 88, completions: 15 },
    { id: 5, type: 'wish', title: 'Weekend getaway', score: 87, completions: 3 }
  ];

  const relationshipHealth = {
    overall: 85,
    communication: 88,
    intimacy: 82,
    support: 90,
    fun: 78,
    growth: 85
  };

  return { weeklyScores, innermostGrowth, topPerformingItems, relationshipHealth };
};

// Simple bar chart component using Tailwind
const SimpleBarChart = ({ data, height = 200 }: { data: any[], height?: number }) => {
  const maxValue = Math.max(...data.map(d => Math.max(d.wants || 0, d.wishes || 0, d.willing || 0)));

  return (
    <div className="flex items-end justify-between gap-2" style={{ height }}>
      {data.map((item, idx) => (
        <div key={idx} className="flex-1 flex flex-col items-center justify-end gap-1">
          <div className="flex gap-1 items-end w-full">
            <div
              className="flex-1 bg-gradient-to-t from-primary-500 to-primary-400 rounded-t"
              style={{ height: `${(item.wants / maxValue) * height * 0.8}px` }}
            />
            <div
              className="flex-1 bg-gradient-to-t from-willing-500 to-willing-400 rounded-t"
              style={{ height: `${(item.wishes / maxValue) * height * 0.8}px` }}
            />
            <div
              className="flex-1 bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t"
              style={{ height: `${(item.willing / maxValue) * height * 0.8}px` }}
            />
          </div>
          <span className="text-xs text-gray-600">{item.month}</span>
        </div>
      ))}
    </div>
  );
};

// Line chart component using SVG
const SimpleLineChart = ({ data, height = 200 }: { data: any[], height?: number }) => {
  const width = 400;
  const padding = 20;
  const maxScore = 100;
  const minScore = 0;

  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * (width - 2 * padding) + padding,
    y: height - ((d.score - minScore) / (maxScore - minScore)) * (height - 2 * padding) - padding
  }));

  const pathData = points.reduce((path, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    return `${path} L ${point.x} ${point.y}`;
  }, '');

  return (
    <div className="relative">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(val => {
          const y = height - ((val - minScore) / (maxScore - minScore)) * (height - 2 * padding) - padding;
          return (
            <g key={val}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e5e7eb" strokeWidth="1" />
              <text x={5} y={y + 3} fontSize="10" fill="#9ca3af">{val}</text>
            </g>
          );
        })}

        {/* Line */}
        <path d={pathData} fill="none" stroke="url(#gradient)" strokeWidth="3" />

        {/* Points */}
        {points.map((point, i) => (
          <g key={i}>
            <circle cx={point.x} cy={point.y} r="5" fill="#6366f1" />
            <circle cx={point.x} cy={point.y} r="3" fill="white" />
          </g>
        ))}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

// Health meter component
const HealthMeter = ({ label, value, color }: { label: string, value: number, color: string }) => {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700 w-24">{label}</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, delay: 0.2 }}
          className={`h-full ${color}`}
        />
      </div>
      <span className="text-sm font-semibold text-gray-800 w-10 text-right">{value}%</span>
    </div>
  );
};

export const AnalyticsPage = () => {
  const premiumFeature = usePremiumFeature(PremiumFeatures.ANALYTICS_DASHBOARD);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  const mockData = useMemo(() => generateMockData(), []);

  // Show upgrade prompt for free users
  if (!premiumFeature.isAvailable || premiumFeature.requiresUpgrade) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="max-w-4xl mx-auto pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-100 to-willing-100 rounded-full mb-4">
              <BarChart3 className="w-10 h-10 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Unlock powerful insights into your relationship</p>
          </motion.div>

          <UpgradePrompt
            feature="Analytics Dashboard"
            description="Get detailed insights into your relationship health, track progress over time, and identify areas for growth. Premium members get access to comprehensive analytics, trend analysis, and data export capabilities."
            benefits={[
              'Relationship health score tracking',
              'Weekly and monthly trend analysis',
              'Performance metrics for wants & wishes',
              'Growth pattern identification',
              'Export data in CSV format',
              'Custom date range selection',
              'Comparative analytics',
              'Predictive insights'
            ]}
          />
        </div>
      </div>
    );
  }

  // Premium user dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
              <p className="text-gray-600">Track your relationship growth and insights</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Period selector */}
              <div className="flex bg-white rounded-lg shadow-sm p-1">
                {(['week', 'month', 'year'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedPeriod === period
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
              <Button
                variant="secondary"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={() => {
                  // Mock export functionality
                  alert('Export feature coming soon!');
                }}
              >
                Export
              </Button>
            </div>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Overall Score', value: 85, change: 5, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
              { label: 'Active Wants', value: 24, change: 3, icon: Heart, color: 'text-primary-600', bg: 'bg-primary-100' },
              { label: 'Completion Rate', value: 78, change: -2, icon: Target, color: 'text-willing-600', bg: 'bg-willing-100' },
              { label: 'Streak Days', value: 12, change: 12, icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-100' }
            ].map((metric, idx) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`${metric.bg} ${metric.color} p-2 rounded-lg`}>
                    <metric.icon className="w-5 h-5" />
                  </div>
                  <div className={`flex items-center text-sm font-medium ${
                    metric.change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.change > 0 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {Math.abs(metric.change)}%
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {metric.value}{metric.label.includes('Rate') || metric.label.includes('Score') ? '%' : ''}
                </div>
                <div className="text-sm text-gray-600">{metric.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Relationship Health Trends */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Weekly Score Trends</h2>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            <SimpleLineChart data={mockData.weeklyScores} />
            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />
                <span className="text-gray-600">Relationship Score</span>
              </div>
            </div>
          </motion.div>

          {/* Innermost Growth Patterns */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Growth Patterns</h2>
              <Sparkles className="w-5 h-5 text-gray-400" />
            </div>
            <SimpleBarChart data={mockData.innermostGrowth} />
            <div className="mt-4 flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary-500 rounded" />
                <span className="text-gray-600">Wants</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-willing-500 rounded" />
                <span className="text-gray-600">Wishes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded" />
                <span className="text-gray-600">Willing</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Relationship Health Meter */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Health Metrics</h2>
              <Heart className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-gray-900">{mockData.relationshipHealth.overall}%</div>
                <div className="text-sm text-gray-600">Overall Health</div>
              </div>
              <HealthMeter label="Communication" value={mockData.relationshipHealth.communication} color="bg-blue-500" />
              <HealthMeter label="Intimacy" value={mockData.relationshipHealth.intimacy} color="bg-pink-500" />
              <HealthMeter label="Support" value={mockData.relationshipHealth.support} color="bg-green-500" />
              <HealthMeter label="Fun" value={mockData.relationshipHealth.fun} color="bg-yellow-500" />
              <HealthMeter label="Growth" value={mockData.relationshipHealth.growth} color="bg-purple-500" />
            </div>
          </motion.div>

          {/* Top Performing Items */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Top Performing Items</h2>
              <Award className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {mockData.topPerformingItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + idx * 0.05 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      idx === 0 ? 'bg-yellow-500' :
                      idx === 1 ? 'bg-gray-400' :
                      idx === 2 ? 'bg-orange-600' : 'bg-gray-300'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{item.title}</div>
                      <div className="text-xs text-gray-500">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.type === 'want' ? 'bg-primary-100 text-primary-700' :
                          item.type === 'wish' ? 'bg-willing-100 text-willing-700' :
                          'bg-indigo-100 text-indigo-700'
                        }`}>
                          {item.type}
                        </span>
                        <span className="ml-2">{item.completions} completions</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{item.score}%</div>
                    <div className="text-xs text-gray-500">score</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Premium badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-100 to-willing-100 rounded-full">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">Premium Analytics Active</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};