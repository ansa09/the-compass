import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

interface HeartChartProps {
  scores: {
    criterion_name: string;
    score: number;
    criterion_tier: string;
  }[];
}

export default function HeartChart({ scores }: HeartChartProps) {
  // Transform scores for Recharts format
  const chartData = scores.map((s) => ({
    subject: s.criterion_name,
    score: s.score,
    fullMark: 10,
  }));

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData}>
            <PolarGrid stroke="#fecdd3" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#3f3f46', fontSize: 12 }}
            />
            <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: '#71717a' }} />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#f43f5e"
              fill="#fb7185"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-6 space-y-2 w-full max-w-md">
        {scores.map((score, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  score.criterion_tier === 'dealbreaker'
                    ? 'bg-rose-600'
                    : score.criterion_tier === 'important'
                    ? 'bg-rose-400'
                    : 'bg-rose-200'
                }`}
              />
              <span className="text-navy-700">{score.criterion_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-warm-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-500"
                  style={{ width: `${(score.score / 10) * 100}%` }}
                />
              </div>
              <span className="text-navy-800 font-semibold w-8 text-right">
                {score.score}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
