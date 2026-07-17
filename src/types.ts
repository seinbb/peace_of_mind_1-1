export interface EmotionItem {
  name: "불안" | "슬픔" | "스트레스" | "분노" | "무기력" | "기쁨";
  percentage: number;
}

export interface AnalysisResult {
  response_mode: "solution" | "empathy";
  emotion: EmotionItem[];
  summary: string;
  empathy_message: string;
  reflection_question: string;
  risk_level: "normal" | "warning" | "high_risk";
}

export interface DiaryLog {
  id: string;
  date: string; // ISO String
  user_diary: string;
  selected_mode: "solution" | "empathy";
  analysis: AnalysisResult;
  reflection_response?: string;
}
