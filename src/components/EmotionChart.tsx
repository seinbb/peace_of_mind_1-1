import { motion } from "motion/react";
import { EmotionItem } from "../types";
import { Smile, AlertCircle, Frown, Flame, ShieldAlert, CloudRain } from "lucide-react";

interface EmotionChartProps {
  emotions: EmotionItem[];
}

const EMOTION_STYLES: Record<string, { color: string; bg: string; icon: any; desc: string; textColor: string }> = {
  "불안": {
    color: "bg-[#7C98E8]",
    bg: "bg-[#ECEFF9]",
    textColor: "text-[#7C98E8]",
    icon: ShieldAlert,
    desc: "마음이 무겁고 앞날이 소란스러울 때 밀려오는 고요한 파란 파도"
  },
  "슬픔": {
    color: "bg-[#9E7CE8]",
    bg: "bg-[#F2ECF9]",
    textColor: "text-[#9E7CE8]",
    icon: Frown,
    desc: "가슴 속에 조용히 내리는 차분하고 깊은 라벤더빛 빗방울"
  },
  "스트레스": {
    color: "bg-[#E8927C]",
    bg: "bg-[#FDF1EE]",
    textColor: "text-[#E8927C]",
    icon: AlertCircle,
    desc: "생각이 너무 복잡해져 마음에 열이 오르는 따스한 불꽃"
  },
  "분노": {
    color: "bg-[#B05B5B]",
    bg: "bg-[#F9ECEC]",
    textColor: "text-[#B05B5B]",
    icon: Flame,
    desc: "나를 지키고 싶은 마음에 솟구치는 붉고 강렬한 울컥함"
  },
  "무기력": {
    color: "bg-[#6BB5B5]",
    bg: "bg-[#ECF9F9]",
    textColor: "text-[#6BB5B5]",
    icon: CloudRain,
    desc: "잠시 모든 힘이 비워진 듯 묵묵히 자리를 지키는 차분한 청록빛 구름"
  },
  "기쁨": {
    color: "bg-[#4A634A]",
    bg: "bg-[#E8F0E8]",
    textColor: "text-[#4A634A]",
    icon: Smile,
    desc: "마음속 어딘가에서 살며시 고개를 미는 화사한 초록 햇살"
  }
};

export default function EmotionChart({ emotions }: EmotionChartProps) {
  // Sort emotions by percentage descending to find dominant one
  const sortedEmotions = [...emotions].sort((a, b) => b.percentage - a.percentage);
  const dominantEmotion = sortedEmotions[0];
  const dominantStyle = EMOTION_STYLES[dominantEmotion.name] || { color: "bg-[#A89F94]", bg: "bg-[#F0EBE3]", textColor: "text-[#A89F94]", icon: Smile, desc: "" };
  const DominantIcon = dominantStyle.icon;

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-[#EBE3D5]">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-[#A89F94] flex items-center gap-1.5">
          <span>오늘 밤 나의 마음 기상도</span>
        </h4>
        <span className="text-[10px] font-mono text-[#A89F94] bg-[#F7F3EE] px-2 py-0.5 rounded-full border border-[#EBE3D5]">
          합계 100%
        </span>
      </div>

      {dominantEmotion && dominantEmotion.percentage > 0 ? (
        <div className="mb-6 p-4 rounded-2xl bg-[#F7F3EE] border border-[#EBE3D5] flex items-start gap-3">
          <div className={`p-2 rounded-xl ${dominantStyle.bg} ${dominantStyle.textColor}`}>
            <DominantIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#A89F94] font-bold">가장 짙은 마음의 색</div>
            <div className="text-sm font-bold text-[#5A524C]">
              {dominantEmotion.name} ({dominantEmotion.percentage}%)
            </div>
            <p className="text-xs text-[#8A8073] mt-0.5 leading-relaxed">
              {dominantStyle.desc}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-6 text-xs text-[#A89F94] text-center py-2">
          고요하고 고른 감정 상태예요.
        </div>
      )}

      {/* Grid containing emotion bars */}
      <div className="space-y-4">
        {emotions.map((item, index) => {
          const style = EMOTION_STYLES[item.name] || { color: "bg-[#A89F94]", bg: "bg-[#F0EBE3]", textColor: "text-[#A89F94]", icon: Smile, desc: "" };
          const Icon = style.icon;

          return (
            <div key={item.name} className="group">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-[#5A524C] flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-[#A89F94] group-hover:text-[#5A524C] transition-colors" />
                  {item.name}
                </span>
                <span className="font-mono font-bold text-[#5A524C]">
                  {item.percentage}%
                </span>
              </div>
              
              <div className="h-2 w-full bg-[#F0EBE3] rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percentage}%` }}
                  transition={{ duration: 1.2, delay: index * 0.1, ease: "easeOut" }}
                  className={`h-full ${style.color} rounded-full`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
