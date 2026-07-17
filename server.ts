import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API Client lazily and safely
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set. Please configure it in your Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Emergency Risk Keyword Scanner
const EMERGENCY_KEYWORDS = [
  "죽고 싶다", "죽고싶다", "죽고 싶어", "죽고싶어",
  "살기 싫다", "살기싫다", "살기 싫어", "살기싫어",
  "사라지고 싶다", "사라지고싶다", "사라지고 싶어", "사라지고싶어",
  "자해", "자살", "끝내고 싶다", "끝내고싶다", "끝내고 싶어", "끝내고싶어",
  "죽음", "목숨을 끊"
];

function scanEmergencyKeywords(text: string): boolean {
  const normalizedText = text.replace(/\s+/g, "").toLowerCase();
  for (const keyword of EMERGENCY_KEYWORDS) {
    const normalizedKeyword = keyword.replace(/\s+/g, "").toLowerCase();
    if (normalizedText.includes(normalizedKeyword)) {
      return true;
    }
  }
  return false;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Core Analysis API
app.post("/api/analyze", async (req, res) => {
  try {
    const { user_diary, selected_mode } = req.body;

    if (!user_diary || typeof user_diary !== "string") {
      res.status(400).json({ error: "일기 내용(user_diary)을 작성해 주세요." });
      return;
    }

    const mode = selected_mode === "solution" ? "solution" : "empathy";

    // 1. First Safety Check via Keyword Match
    const keywordTriggered = scanEmergencyKeywords(user_diary);

    // Prepare system instructions and query
    const systemInstruction = `
너는 청소년 정서지원 AI "마음쉼"의 핵심 마음 분석가이자 편지 작가이다.
사용자가 작성한 일기(user_diary)와 직접 선택한 답변 모드(selected_mode)를 분석하여, 깊은 정서 분석 지표와 세상에 하나뿐인 마음쉼 편지를 반환한다.

입력 값 구조:
- selected_mode: "solution" (문제 해결 초점) 또는 "empathy" (공감 초점)
- user_diary: 사용자의 고민글

🚨 최우선 안전 가이드라인 (Crucial Safety Rule) - 매우 중요!
사용자의 고민글에 [죽고 싶다, 살기 싫다, 사라지고 싶다, 자해, 끝내고 싶다, 자살] 등 자살 및 자해 징조를 뜻하는 맥락이나 키워드가 단 하나라도 포착되면, 사용자가 선택한 모드와 상관없이 시스템을 지체 없이 "비상 구호 모드"로 자동 전환한다.
1. risk_level을 반드시 "high_risk"로 설정한다.
2. response_mode는 강제로 "empathy"로 고정한다.
3. reflection_question은 복잡한 질문 대신 다음 문장으로 완전히 대체한다: "지금은 생각이 많아지는 밤이니 잠시 마음을 가라앉히고 큰 숨을 세 번만 들이쉬어 볼까?"
4. empathy_message에는 다음 필수 위로 문구와 공인 전문상담기관 연락처를 줄바꿈하여 기재한다:
   "지금 네 마음이 얼마나 무겁고 아플지 감히 다 헤아릴 수 없지만, 네 이야기를 밤새도록 들어줄 수 있는 따뜻한 어른들이 기다리고 있어. 절대 혼자 감당하지 마."
   줄바꿈 후 아래 기관 번호를 반드시 모두 포함해야 한다:
   자살예방상담전화(109), 청소년상담전화(1388), 보건복지상담센터(129)

🛠️ 답변 모드별 편지 생성 규칙 (Response Mode Rules)
선택된 'selected_mode'에 따라 "empathy_message"의 말투와 풀이 방향을 완벽히 이원화하라. (단, high_risk 제외)

1. "solution" 모드 (문제 해결 초점)
- 페르소나: 인생의 지혜롭고 든든한 등대 같은 다정한 인생 선배(멘토).
- 작성 스타일: 섣부른 감정적 호소는 덜어내고, 고민 이면에 있는 근본적인 원인을 짚어준다. 스스로 꼬인 문제를 단계적으로 해체하여 생각할 수 있도록 이성적인 관점을 제공한다.
- 실천 가이드: 일기 내용과 어우러지는 아주 구체적이고 사소한 행동 지침(Action Step)을 1~2가지 친근하게 제안한다. (예: 하루 10분 걷기, 생각 정리 노트 쓰기 등)
- 어조: 차분하고 단단하며 신뢰감을 주는 존댓말을 유지한다.

2. "empathy" 모드 (공감 초점)
- 페르소나: 어떤 상황에서도 100% 내 편이 되어 함께 울어주는 가장 소중한 단짝 친구.
- 작성 스타일: 섣부른 조언, 가르침, "이렇게 하면 해결될 거야" 식의 훈계를 절대 금지한다. "네 잘못이 아니야", "얼마나 외롭고 서글펐을지 감히 상상도 안 가"처럼 슬픔, 분노, 무기력의 감정을 온전히 수용하고 대변해 준다.
- 어조: 고운바탕 서체의 따뜻함이 전해지도록 줄노트 엽서 형태의 아름답고 감성적인 어휘를 사용한다. 아주 친근한 존댓말 또는 부드러운 반말을 어우러지게 섞어 사용한다.

일반 분석 규칙:
1. "emotion": 불안, 슬픔, 스트레스, 분노, 무기력, 기쁨의 6대 감정 percentage 합산 수치는 정확히 100이어야 한다.
2. "reflection_question": 사용자가 오늘 밤 차분히 일기를 마감하며 자기 내면을 필사 데스크에서 채울 수 있는 성찰적 질문을 작성한다.
`;

    const prompt = `
[선택한 모드 (selected_mode)]: "${mode}"
[일기 내용 (user_diary)]:
${user_diary}

위 입력 데이터를 정밀히 분석하여 요구사항에 정확히 부합하는 JSON 객체를 반환해줘.
`;

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            response_mode: {
              type: Type.STRING,
              description: "The response mode: 'solution' or 'empathy'."
            },
            emotion: {
              type: Type.ARRAY,
              description: "The percentage distribution of 6 key emotions. Sum of all percentages must be exactly 100.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: {
                    type: Type.STRING,
                    description: "Emotion name: '불안', '슬픔', '스트레스', '분노', '무기력', '기쁨'"
                  },
                  percentage: {
                    type: Type.INTEGER,
                    description: "Percentage value from 0 to 100."
                  }
                },
                required: ["name", "percentage"]
              }
            },
            summary: {
              type: Type.STRING,
              description: "A single sentence comforting summary of the diary."
            },
            empathy_message: {
              type: Type.STRING,
              description: "A warm analog letter written in Gowun Batang style, following the response mode guidelines."
            },
            reflection_question: {
              type: Type.STRING,
              description: "A deep self-reflection question for tonight."
            },
            risk_level: {
              type: Type.STRING,
              description: "The risk level: 'normal', 'warning', or 'high_risk'."
            }
          },
          required: ["response_mode", "emotion", "summary", "empathy_message", "reflection_question", "risk_level"]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No response returned from Gemini API");
    }

    // Parse output JSON
    let result = JSON.parse(responseText.trim());

    // 2. Second Safety Check / Override Verification
    // If keyword was detected, or Gemini returned high_risk, we enforce the CRUCIAL SAFETY OVERRIDES
    if (keywordTriggered || result.risk_level === "high_risk" || /죽고싶|살기싫|자해|자살|사라지고싶/.test(user_diary)) {
      result.risk_level = "high_risk";
      result.response_mode = "empathy";
      result.reflection_question = "지금은 생각이 많아지는 밤이니 잠시 마음을 가라앉히고 큰 숨을 세 번만 들이쉬어 볼까?";
      
      const safetyNotice = `지금 네 마음이 얼마나 무겁고 아플지 감히 다 헤아릴 수 없지만, 네 이야기를 밤새도록 들어줄 수 있는 따뜻한 어른들이 기다리고 있어. 절대 혼자 감당하지 마.\n\n언제든 아래 연락처로 마음을 털어놓아줘:\n- 자살예방상담전화(109)\n- 청소년상담전화(1388)\n- 보건복지상담센터(129)`;
      
      // Keep the AI's response but prefix or replace it with the mandatory message for safety compliance
      result.empathy_message = safetyNotice;

      // Force-balance emotions if needed
      result.emotion = [
        { name: "불안", percentage: 30 },
        { name: "슬픔", percentage: 30 },
        { name: "스트레스", percentage: 20 },
        { name: "분노", percentage: 10 },
        { name: "무기력", percentage: 10 },
        { name: "기쁨", percentage: 0 }
      ];
      result.summary = "도움의 따뜻한 손길이 네 곁에 언제나 머물고 있어.";
    }

    // Double-check the total emotion percentage sums up to 100
    if (Array.isArray(result.emotion)) {
      const sum = result.emotion.reduce((acc: number, curr: any) => acc + (curr.percentage || 0), 0);
      if (sum !== 100 && result.emotion.length > 0) {
        // Normalize to 100
        const diff = 100 - sum;
        result.emotion[0].percentage = Math.max(0, result.emotion[0].percentage + diff);
      }
    }

    res.json(result);
  } catch (error: any) {
    console.error("Analysis API Error:", error);
    res.status(500).json({ error: error.message || "정서 분석을 수행하지 못했습니다." });
  }
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[마음쉼] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
