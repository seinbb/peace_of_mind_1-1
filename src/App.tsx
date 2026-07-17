import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  HeartHandshake, Sparkles, Mail, Send, Printer, 
  HelpCircle, Phone, RefreshCw, Bookmark, Info, Star, ChevronRight
} from "lucide-react";
import { DiaryLog, AnalysisResult } from "./types";
import LoadingOverlay from "./components/LoadingOverlay";
import EmotionChart from "./components/EmotionChart";
import HistoryPanel from "./components/HistoryPanel";

export default function App() {
  const [userDiary, setUserDiary] = useState("");
  const [selectedMode, setSelectedMode] = useState<"solution" | "empathy">("empathy");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLog, setActiveLog] = useState<DiaryLog | null>(null);
  const [logs, setLogs] = useState<DiaryLog[]>([]);
  const [reflectionResponse, setReflectionResponse] = useState("");

  // Load from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("maeumswim_logs");
      if (saved) {
        const parsed = JSON.parse(saved);
        setLogs(parsed);
        if (parsed.length > 0) {
          setActiveLog(parsed[0]);
          setReflectionResponse(parsed[0].reflection_response || "");
        }
      }
    } catch (e) {
      console.error("Failed to load logs from localStorage:", e);
    }
  }, []);

  // Save to LocalStorage
  const saveLogs = (updatedLogs: DiaryLog[]) => {
    setLogs(updatedLogs);
    try {
      localStorage.setItem("maeumswim_logs", JSON.stringify(updatedLogs));
    } catch (e) {
      console.error("Failed to save logs to localStorage:", e);
    }
  };

  // Submit diary
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userDiary.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_diary: userDiary,
          selected_mode: selectedMode,
        }),
      });

      if (!response.ok) {
        let errorMessage = "정서 분석을 요청하는 중 오류가 발생했습니다.";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errData = await response.json();
            errorMessage = errData.error || errorMessage;
          } else {
            const text = await response.text();
            console.error("Non-JSON error response received:", text);
            errorMessage = `서버 오류 (${response.status}): 서버가 준비 중이거나 주소가 올바르지 않습니다.`;
          }
        } catch (e) {
          console.error("Error reading response error body:", e);
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Expected JSON success response, but received:", text);
        throw new Error("서버에서 올바르지 않은 응답 형식이 반환되었습니다. 다시 시도해 주세요.");
      }

      const analysisResult: AnalysisResult = await response.json();

      const newLog: DiaryLog = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        user_diary: userDiary,
        selected_mode: selectedMode,
        analysis: analysisResult,
        reflection_response: "",
      };

      const updatedLogs = [newLog, ...logs];
      saveLogs(updatedLogs);
      setActiveLog(newLog);
      setReflectionResponse("");
      setUserDiary(""); // clear text
    } catch (err: any) {
      setError(err.message || "서버와 연결할 수 없습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  // Update reflection response
  const handleSaveReflection = () => {
    if (!activeLog) return;
    const updated = logs.map((log) => {
      if (log.id === activeLog.id) {
        return { ...log, reflection_response: reflectionResponse };
      }
      return log;
    });
    saveLogs(updated);
    setActiveLog({ ...activeLog, reflection_response: reflectionResponse });
    
    // Add micro feedback
    const originalText = reflectionResponse;
    alert("필사 답안이 온전히 마음보관함에 저장되었습니다. 오늘 밤도 참 잘했어요.");
  };

  // Delete a log
  const handleDeleteLog = (id: string) => {
    const updated = logs.filter((log) => log.id !== id);
    saveLogs(updated);
    if (activeLog?.id === id) {
      if (updated.length > 0) {
        setActiveLog(updated[0]);
        setReflectionResponse(updated[0].reflection_response || "");
      } else {
        setActiveLog(null);
        setReflectionResponse("");
      }
    }
  };

  // Select a log from history
  const handleSelectLog = (log: DiaryLog) => {
    setActiveLog(log);
    setReflectionResponse(log.reflection_response || "");
  };

  // Print current postcard
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3A3530] font-sans pb-16 antialiased">
      {/* Loading Overlay */}
      {loading && <LoadingOverlay />}

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#FDFBF7]/80 backdrop-blur-md border-b border-[#EBE3D5] py-4 px-6 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E8927C] flex items-center justify-center text-white shadow-sm shadow-[#E8927C]/20">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 id="app-title" className="text-xl font-bold text-[#5A524C] tracking-tight">
                  마음쉼
                  <span className="font-normal text-xs ml-2 text-[#A89F94]">| 청소년 정서지원 AI</span>
                </h1>
              </div>
              <p className="text-[10px] text-[#A89F94] font-medium tracking-wide">따뜻한 위로와 분석으로 다독이는 일기 우체통</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Dynamic Status Badges matching Design HTML */}
            <div className="hidden sm:flex gap-2">
              <span className={`px-3 py-1 bg-[#E8F0E8] text-[#4A634A] rounded-full text-[10px] font-semibold uppercase tracking-wider border border-[#CFDFCF]`}>
                Mode: {selectedMode === "empathy" ? "Empathy" : "Solution"}
              </span>
              <span className={`px-3 py-1 ${activeLog?.analysis.risk_level === "high_risk" ? "bg-[#F9ECEC] text-[#B05B5B] border-[#EFD5D5] animate-pulse" : "bg-[#F7F3EE] text-[#A89F94] border-[#EBE3D5]"} rounded-full text-[10px] font-semibold uppercase tracking-wider border`}>
                Risk: {activeLog?.analysis.risk_level === "high_risk" ? "High Risk" : "Normal"}
              </span>
            </div>
            <span className="text-xs text-[#A89F94] bg-[#F7F3EE] px-3 py-1.5 rounded-full font-mono border border-[#EBE3D5]">
              오늘: {new Date().toLocaleDateString("ko-KR")}
            </span>
          </div>
        </div>
      </header>

      {/* Core Body Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-8">
        
        {/* Banner Grid for warm introduction */}
        <div className="bg-[#E8927C] rounded-3xl p-6 md:p-8 text-white shadow-md shadow-[#E8927C]/10 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 opacity-10">
            <Mail className="w-96 h-96" />
          </div>
          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold mb-4 text-orange-50">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>오늘 밤은 조금 쉬어갈까요?</span>
            </div>
            <h2 className="text-xl md:text-3xl font-extrabold tracking-tight leading-tight font-serif italic">
              말하지 못해 삼켜둔 감정,<br />
              마음쉼 우체통에 편안히 흘려보내세요.
            </h2>
            <p className="text-xs md:text-sm text-white/95 mt-3 leading-relaxed">
              마음쉼은 청소년의 심층적인 마음 흐름을 정성껏 분석해 드립니다.<br />
              100% 내 편이 되어 함께 아파해주는 <strong className="underline">단짝 친구의 공감</strong>, 혹은 지혜롭고 이성적인 시선으로 단단한 조언을 해주는 <strong className="underline">다정한 멘토의 선배 조언</strong>을 만나보세요.
            </p>
          </div>
        </div>

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Column 1: Diary Desk (lg:span-4) */}
          <section className="lg:col-span-4 bg-white/50 border border-[#EBE3D5] rounded-3xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4 border-b border-[#EBE3D5]/60 pb-3">
              <div className="w-8 h-8 rounded-full bg-[#F7F3EE] flex items-center justify-center text-[#A89F94]">
                <Bookmark className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#A89F94]">마음 기록장</h3>
                <p className="text-[10px] text-[#A89F94] font-medium mt-0.5">속에 담아둔 마음을 한 장의 일기로 적기</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Mode Selection */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#A89F94] block mb-2">답변 모드 선택</label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Empathy Mode */}
                  <button
                    type="button"
                    onClick={() => setSelectedMode("empathy")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedMode === "empathy"
                        ? "border-[#E8927C] bg-[#FDF1EE] ring-2 ring-[#E8927C]/10"
                        : "border-[#EBE3D5] bg-[#F7F3EE]/40 text-[#A89F94] hover:bg-[#F7F3EE]"
                    }`}
                  >
                    <div className="text-xs font-bold text-[#5A524C] flex items-center gap-1">
                      <Star className={`w-3.5 h-3.5 ${selectedMode === "empathy" ? "text-[#E8927C] fill-current" : "text-[#A89F94]"}`} />
                      단짝의 공감
                    </div>
                    <p className="text-[9px] text-[#A89F94] mt-1 leading-normal">
                      내 편이 되어 따뜻하고 감성적으로 위로해요.
                    </p>
                  </button>

                  {/* Solution Mode */}
                  <button
                    type="button"
                    onClick={() => setSelectedMode("solution")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedMode === "solution"
                        ? "border-[#E8927C] bg-[#FDF1EE] ring-2 ring-[#E8927C]/10"
                        : "border-[#EBE3D5] bg-[#F7F3EE]/40 text-[#A89F94] hover:bg-[#F7F3EE]"
                    }`}
                  >
                    <div className="text-xs font-bold text-[#5A524C] flex items-center gap-1">
                      <Info className={`w-3.5 h-3.5 ${selectedMode === "solution" ? "text-[#E8927C] fill-current" : "text-[#A89F94]"}`} />
                      선배의 조언
                    </div>
                    <p className="text-[9px] text-[#A89F94] mt-1 leading-normal">
                      근본적 해결책과 실천 방안을 제시해요.
                    </p>
                  </button>
                </div>
              </div>

              {/* Diary Textarea */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#A89F94] block mb-2">오늘의 일기 한 토막</label>
                <div className="relative">
                  <textarea
                    value={userDiary}
                    onChange={(e) => setUserDiary(e.target.value)}
                    rows={12}
                    maxLength={1000}
                    placeholder="오늘 어떤 하루를 보냈나요? 나를 속상하게 한 일, 누구에게도 털어놓지 못했던 불안이나 슬픔을 온전히 쏟아내보세요. 마음쉼의 필사 서신에 온기를 더할게요."
                    className="w-full text-sm p-4 rounded-2xl border border-[#EBE3D5] bg-[#F7F3EE]/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E8927C]/20 focus:border-[#E8927C] leading-relaxed resize-none font-batang text-[#3A3530]"
                  />
                  <span className="absolute bottom-3 right-3 text-[10px] font-mono text-[#A89F94]">
                    {userDiary.length}/1000자
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!userDiary.trim()}
                className={`w-full py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  userDiary.trim()
                    ? "bg-[#E8927C] hover:bg-[#df8169] text-white shadow-md shadow-[#E8927C]/15 active:scale-98 cursor-pointer"
                    : "bg-[#F0EBE3] text-[#A89F94] cursor-not-allowed border border-[#EBE3D5]/40"
                }`}
              >
                <Send className="w-4 h-4" />
                <span>우체통에 일기 넣기</span>
              </button>
            </form>

            {error && (
              <div className="mt-4 p-3.5 bg-[#F9ECEC] border border-[#EFD5D5] rounded-2xl text-xs text-[#B05B5B] leading-normal flex items-start gap-2">
                <span className="font-bold">안내:</span>
                <span>{error}</span>
              </div>
            )}
          </section>

          {/* Column 2: Postcard Desk (lg:col-span-5) */}
          <section className="lg:col-span-5 flex flex-col gap-6">
            
            <AnimatePresence mode="wait">
              {activeLog ? (
                <motion.div
                  key={activeLog.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  {/* Layered Postcard with Rotating Shadow Effect */}
                  <div className="relative">
                    
                    {/* Artistic Flair layered cards rotation shadow effect */}
                    <div className="absolute inset-0 bg-white shadow-2xl rounded-sm transform rotate-1 border border-[#F0EBE3]" />
                    
                    {/* Foreground Postcard content */}
                    <div className="relative bg-white shadow-xl rounded-sm p-8 md:p-10 flex flex-col border border-[#F0EBE3] z-10">
                      
                      {/* Postcard Header */}
                      <div className="flex justify-between items-start mb-8">
                        <div className="border-b-2 border-[#E8927C] pb-2">
                          <p className="text-xs font-serif italic text-[#A89F94]">To. 힘든 하루를 견뎌낸 너에게</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handlePrint}
                            className="p-1.5 rounded-full hover:bg-[#F7F3EE] text-[#A89F94] hover:text-[#5A524C] transition-colors"
                            title="편지 인쇄하기"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          
                          {/* Post Office vintage stamp */}
                          <div className="w-16 h-20 border-2 border-[#E8927C] p-1 flex flex-col items-center justify-center opacity-40 select-none">
                            <div className="text-[9px] text-center font-serif leading-tight uppercase font-semibold text-[#E8927C]">
                              Maeum<br />Swim<br />Post
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Summary Line */}
                      <div className="mb-6 bg-[#F7F3EE] border-l-4 border-[#E8927C] p-4 rounded-r-xl">
                        <div className="text-[9px] uppercase tracking-widest text-[#A89F94] font-bold">Summary</div>
                        <p className="text-xs font-serif italic text-[#5A524C] mt-1">
                          &ldquo;{activeLog.analysis.summary}&rdquo;
                        </p>
                      </div>

                      {/* High Risk Notice Banner */}
                      {activeLog.analysis.risk_level === "high_risk" && (
                        <div className="p-4 bg-[#F9ECEC] rounded-2xl border border-[#EFD5D5] mb-6 flex flex-col gap-2 shadow-inner">
                          <div className="flex items-center gap-1.5 text-[#B05B5B] font-bold text-xs">
                            <Phone className="w-4 h-4 animate-bounce text-[#B05B5B]" />
                            <span>🚨 비상 안부 헬프라인 안내</span>
                          </div>
                          <p className="text-[11px] text-[#8A5050] leading-relaxed font-medium">
                            마음쉼은 소중한 네 마음과 안전을 늘 지키고 싶어. 네 힘겨운 고민을 언제든지 아무 조건 없이 귀 기울여 들어줄 수 있는 전문기관들이 아래에 상시 대기하고 있어. 절대 혼자 이겨내려고 애쓰지 말고 꼭 문을 두드려줘.
                          </p>
                          <div className="grid grid-cols-1 gap-2 mt-1">
                            <a href="tel:109" className="flex items-center justify-between text-xs font-bold text-[#B05B5B] bg-white p-2.5 rounded-xl border border-[#EFD5D5] hover:bg-[#F9ECEC]/30 transition-colors">
                              <span>자살예방상담전화</span>
                              <span className="text-[#B05B5B] flex items-center gap-0.5">109 <ChevronRight className="w-3.5 h-3.5" /></span>
                            </a>
                            <a href="tel:1388" className="flex items-center justify-between text-xs font-bold text-[#B05B5B] bg-white p-2.5 rounded-xl border border-[#EFD5D5] hover:bg-[#F9ECEC]/30 transition-colors">
                              <span>청소년상담전화</span>
                              <span className="text-[#B05B5B] flex items-center gap-0.5">1388 <ChevronRight className="w-3.5 h-3.5" /></span>
                            </a>
                            <a href="tel:129" className="flex items-center justify-between text-xs font-bold text-[#B05B5B] bg-white p-2.5 rounded-xl border border-[#EFD5D5] hover:bg-[#F9ECEC]/30 transition-colors">
                              <span>보건복지상담센터</span>
                              <span className="text-[#B05B5B] flex items-center gap-0.5">129 <ChevronRight className="w-3.5 h-3.5" /></span>
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Analog Ledger Postcard text */}
                      <div className="letter-paper min-h-[300px] text-[#4A443E] text-base font-batang relative">
                        {/* Letter contents with lines mapped beautifully */}
                        <div className="whitespace-pre-wrap leading-[2.4rem] pr-2">
                          {activeLog.analysis.empathy_message}
                        </div>
                      </div>

                      {/* Postcard Footer signature */}
                      <div className="mt-8 flex justify-end">
                        <div className="text-right">
                          <p className="text-xs text-[#A89F94] font-serif">오늘도 고생 많았어.</p>
                          <p className="text-lg font-serif italic text-[#E8927C] font-semibold">From. 마음쉼</p>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Reflection desk */}
                  <div className="bg-white/50 border border-[#EBE3D5] rounded-3xl p-6 shadow-xs">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-[#E8F0E8] flex items-center justify-center text-[#4A634A]">
                        <Star className="w-4 h-4 fill-current" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#A89F94]">오늘 밤의 필사 데스크</h4>
                        <p className="text-[10px] text-[#A89F94] mt-0.5">차분한 마감과 내면의 대화를 완성해 봅니다</p>
                      </div>
                    </div>

                    <div className="p-4 bg-[#F7F3EE] rounded-2xl border-l-4 border-[#E8927C] mb-4">
                      <div className="text-[9px] uppercase tracking-widest text-[#A89F94] font-bold mb-1">성찰 질문</div>
                      <p className="text-sm font-serif leading-relaxed text-[#5A524C]">
                        {activeLog.analysis.reflection_question}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <textarea
                        value={reflectionResponse}
                        onChange={(e) => setReflectionResponse(e.target.value)}
                        placeholder="이 질문에 떠오르는 나만의 생각이나 다짐을 한 두줄 자유롭게 적어 마음을 매듭지어 보세요."
                        rows={3}
                        className="w-full text-xs p-3 rounded-2xl border border-[#EBE3D5] bg-[#F7F3EE]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E8927C]/20 focus:border-[#E8927C] leading-relaxed resize-none font-batang text-[#3A3530]"
                      />
                      <button
                        onClick={handleSaveReflection}
                        disabled={!reflectionResponse.trim()}
                        className={`w-full py-2.5 rounded-2xl text-xs font-bold transition-all ${
                          reflectionResponse.trim()
                            ? "bg-[#4A634A] text-white hover:bg-[#3d523d] shadow-sm active:scale-98 cursor-pointer"
                            : "bg-[#F0EBE3] text-[#A89F94] cursor-not-allowed border border-[#EBE3D5]/40"
                        }`}
                      >
                        필사 저장하기
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty-postcard"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white/50 border border-[#EBE3D5] rounded-3xl p-8 text-center py-24 shadow-xs"
                >
                  <div className="w-16 h-16 rounded-full bg-[#F7F3EE] flex items-center justify-center text-[#A89F94] mx-auto mb-4 border border-[#EBE3D5]">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-[#5A524C] uppercase tracking-wider">비어있는 편지함</h4>
                  <p className="text-xs text-[#A89F94] leading-relaxed max-w-xs mx-auto mt-2 font-medium">
                    왼쪽 우체통에 깊은 고민 일기를 담아 넣어주세요. 마음쉼 분석가가 곧바로 마법 같은 따뜻한 아날로그 엽서를 배달해 드립니다.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Column 3: Emotion & History Panel (lg:col-span-3) */}
          <section className="lg:col-span-3 flex flex-col gap-6">
            {/* Emotion chart overlay */}
            {activeLog && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <EmotionChart emotions={activeLog.analysis.emotion} />
              </motion.div>
            )}

            {/* History logs panel */}
            <HistoryPanel
              logs={logs}
              activeLogId={activeLog?.id || null}
              onSelectLog={handleSelectLog}
              onDeleteLog={handleDeleteLog}
            />
          </section>

        </div>
      </main>

      {/* Stay Connected Footer matching Design HTML */}
      <footer className="mt-16 flex justify-center items-center gap-4 text-[10px] text-[#A89F94] tracking-widest uppercase font-bold text-center px-6">
         <span>Stay Connected</span>
         <span className="w-1 h-1 bg-[#A89F94] rounded-full"></span>
         <span>Helpline: 1388 / 109</span>
         <span className="w-1 h-1 bg-[#A89F94] rounded-full"></span>
         <span>Analog Archive Vol. 12</span>
      </footer>
    </div>
  );
}
