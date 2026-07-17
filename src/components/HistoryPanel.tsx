import { DiaryLog } from "../types";
import { BookOpen, Trash2, Calendar, Smile, AlertCircle, Heart } from "lucide-react";
import { motion } from "motion/react";

interface HistoryPanelProps {
  logs: DiaryLog[];
  activeLogId: string | null;
  onSelectLog: (log: DiaryLog) => void;
  onDeleteLog: (id: string) => void;
}

export default function HistoryPanel({
  logs,
  activeLogId,
  onSelectLog,
  onDeleteLog,
}: HistoryPanelProps) {
  // Simple date formatter
  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return `${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  // Generate SVG Sparkline for Emotion Trends
  const renderTrendChart = () => {
    if (logs.length < 2) return null;

    // We'll map the last 7 logs chronologically
    const trendLogs = [...logs].reverse().slice(-7);
    
    const width = 360;
    const height = 80;
    const padding = 15;
    
    const maxVal = 100;
    
    // Create points for Joy ("기쁨") and Distress ("스트레스" + "불안")
    const joyPoints = trendLogs.map((log, index) => {
      const joy = log.analysis.emotion.find((e) => e.name === "기쁨")?.percentage || 0;
      const x = padding + (index * (width - 2 * padding)) / (trendLogs.length - 1);
      const y = height - padding - (joy / maxVal) * (height - 2 * padding);
      return { x, y, val: joy };
    });

    const stressPoints = trendLogs.map((log, index) => {
      const stress = log.analysis.emotion.find((e) => e.name === "스트레스")?.percentage || 0;
      const anxiety = log.analysis.emotion.find((e) => e.name === "불안")?.percentage || 0;
      const totalDistress = Math.min(100, stress + anxiety);
      const x = padding + (index * (width - 2 * padding)) / (trendLogs.length - 1);
      const y = height - padding - (totalDistress / maxVal) * (height - 2 * padding);
      return { x, y, val: totalDistress };
    });

    const createPath = (points: { x: number; y: number }[]) => {
      if (points.length === 0) return "";
      return points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), "");
    };

    return (
      <div className="bg-[#F7F3EE] rounded-2xl p-4 border border-[#EBE3D5] mb-6">
        <div className="flex items-center justify-between mb-3 text-xs text-[#A89F94]">
          <span className="font-bold uppercase tracking-wider text-[10px]">최근 감정 흐름 변화</span>
          <div className="flex gap-3">
            <span className="flex items-center gap-1 text-[10px]">
              <span className="w-2 h-2 rounded-full bg-[#4A634A] inline-block" /> 기쁨
            </span>
            <span className="flex items-center gap-1 text-[10px]">
              <span className="w-2 h-2 rounded-full bg-[#E8927C] inline-block" /> 스트레스+불안
            </span>
          </div>
        </div>
        
        <div className="relative h-20 w-full overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            {/* Joy Path */}
            <path
              d={createPath(joyPoints)}
              fill="none"
              stroke="#4A634A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {joyPoints.map((p, i) => (
              <circle
                key={`joy-${i}`}
                cx={p.x}
                cy={p.y}
                r="3"
                fill="#4A634A"
                className="hover:r-5 transition-all cursor-pointer"
              />
            ))}

            {/* Distress Path */}
            <path
              d={createPath(stressPoints)}
              fill="none"
              stroke="#E8927C"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {stressPoints.map((p, i) => (
              <circle
                key={`stress-${i}`}
                cx={p.x}
                cy={p.y}
                r="3"
                fill="#E8927C"
                className="hover:r-5 transition-all cursor-pointer"
              />
            ))}
          </svg>
        </div>
        <div className="flex justify-between text-[10px] text-[#A89F94] mt-1 font-mono">
          <span>{formatDate(trendLogs[0].date).split(" ")[0]}</span>
          <span>{formatDate(trendLogs[trendLogs.length - 1].date).split(" ")[0]} ({trendLogs.length}회 기록)</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-[#EBE3D5]">
      <h3 className="text-xs font-bold uppercase tracking-widest text-[#A89F94] mb-4 flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-[#E8927C]" />
        <span>마음 보관함 (나의 우체통)</span>
      </h3>

      {renderTrendChart()}

      {logs.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-[#EBE3D5] rounded-2xl bg-[#F7F3EE]/50">
          <Calendar className="w-6 h-6 text-[#A89F94] mx-auto mb-2 opacity-60" />
          <p className="text-xs text-[#A89F94] leading-relaxed font-medium">
            보관함에 저장된 편지가 아직 없습니다.<br />
            일기를 작성하고 첫 마음 편지를 받아보세요.
          </p>
        </div>
      ) : (
        <div className="max-h-[380px] overflow-y-auto space-y-3 pr-1">
          {logs.map((log) => {
            const isActive = log.id === activeLogId;
            const dominant = [...log.analysis.emotion].sort((a, b) => b.percentage - a.percentage)[0];
            const isHighRisk = log.analysis.risk_level === "high_risk";

            return (
              <motion.div
                key={log.id}
                whileHover={{ y: -1 }}
                className={`p-4 rounded-2xl border transition-all text-left relative cursor-pointer group ${
                  isActive
                    ? "bg-[#FDF1EE] border-[#E8927C] shadow-sm"
                    : isHighRisk
                    ? "bg-[#F9ECEC]/60 border-[#EFD5D5] hover:bg-[#F9ECEC]/80"
                    : "bg-[#F7F3EE]/40 border-[#EBE3D5] hover:bg-[#F7F3EE]/85"
                }`}
                onClick={() => onSelectLog(log)}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <span className="text-[10px] font-mono text-[#A89F94] flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(log.date)}
                  </span>
                  
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLog(log.id);
                    }}
                    className="p-1 rounded-md text-[#A89F94] hover:text-[#B05B5B] hover:bg-[#F9ECEC]/50 transition-all"
                    title="기록 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs font-semibold text-[#5A524C] truncate pr-6 mb-1 font-batang">
                  {log.user_diary}
                </div>

                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[9px] font-semibold bg-[#F0EBE3] text-[#5A524C] px-1.5 py-0.5 rounded border border-[#EBE3D5]/50">
                    {log.selected_mode === "solution" ? "선배 조언" : "단짝 공감"}
                  </span>

                  {dominant && dominant.percentage > 0 && (
                    <span className="text-[9px] font-bold bg-[#E8F0E8] text-[#4A634A] px-1.5 py-0.5 rounded border border-[#CFDFCF]">
                      {dominant.name} {dominant.percentage}%
                    </span>
                  )}

                  {isHighRisk && (
                    <span className="text-[9px] bg-[#F9ECEC] text-[#B05B5B] px-1.5 py-0.5 rounded font-extrabold border border-[#EFD5D5] animate-pulse flex items-center gap-0.5">
                      <Heart className="w-2.5 h-2.5 fill-current text-[#B05B5B]" />
                      비상 케어
                    </span>
                  )}

                  {log.reflection_response && (
                    <span className="text-[9px] bg-[#E8F0E8] text-[#4A634A] px-1.5 py-0.5 rounded border border-[#CFDFCF] font-bold">
                      필사 완료
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
