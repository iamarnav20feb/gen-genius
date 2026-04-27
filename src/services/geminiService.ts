import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const getAIClient = () => {
  if (typeof window === "undefined") return null;

  const apiKey = localStorage.getItem("gen_genius_user_api_key") || "";
    
  if (!apiKey || apiKey === "undefined") {
    console.error("GenGenius: No personal API key found.");
    throw new Error("MISSING_PERSONAL_KEY");
  }

  return new GoogleGenAI({ apiKey });
};

// Quota tracking
export const getDailyQuota = () => {
  if (typeof window === "undefined") return { count: 0, limit: 1500 };
  const dateStr = new Date().toDateString();
  const quotaDataStr = localStorage.getItem("gen_genius_daily_quota");
  let quotaData = { date: dateStr, count: 0 };
  if (quotaDataStr) {
    try {
      const parsed = JSON.parse(quotaDataStr);
      if (parsed.date === dateStr) {
        quotaData = parsed;
      }
    } catch(e) {}
  }
  return { count: quotaData.count, limit: 1500 };
};

const incrementDailyQuota = () => {
  if (typeof window === "undefined") return;
  const dateStr = new Date().toDateString();
  const quotaDataStr = localStorage.getItem("gen_genius_daily_quota");
  let quotaData = { date: dateStr, count: 0 };
  if (quotaDataStr) {
    try {
      const parsed = JSON.parse(quotaDataStr);
      if (parsed.date === dateStr) {
        quotaData = parsed;
      }
    } catch(e) {}
  }
  quotaData.count += 1;
  localStorage.setItem("gen_genius_daily_quota", JSON.stringify(quotaData));
};

// --- Model Strategy ---
// Priority 1/2: Flash models for speed and frequent usage
// Priority 3: Pro models for complex accuracy
// --- Model Strategy ---
// Using stable production models for maximum reliability.
// Fallback logic is implemented to handle capacity issues (503 errors).
const getModelName = (accuracyNeeded: boolean = false, retryCount: number = 0): string => {
  // Use recommended identifiers from gemini-api skill
  // Flash Latest is the standard high-performance stable model
  if (retryCount === 0) {
    return accuracyNeeded ? "gemini-3.1-pro-preview" : "gemini-flash-latest";
  }
  // Try 3.1 Flash Lite if the primary is busy
  if (retryCount === 1) {
    return "gemini-3.1-flash-lite-preview";
  }
  // Ultimate backup
  return "gemini-3-flash-preview";
};

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getExamHelpStream(
  prompt: string, 
  history: any[] = [], 
  subject?: string,
  files: { mimeType: string, data: string }[] = [],
  isVoiceMode: boolean = false
) {
  // ... (keep existing code for instructions)
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const getProfile = () => {
    try {
      return JSON.parse(localStorage.getItem("gen_genius_profile") || "{}");
    } catch (e) {
      return {};
    }
  };

  const profileData = getProfile();
  const firstName = profileData.name ? profileData.name.split(' ')[0] : "Student";

  const personaContext = firstName ? `USER NAME: ${firstName}\n` : "";
  const personalityRule = firstName ? `Address the user by their first name (${firstName}) occasionally and naturally (e.g., at the start of a conversation or during encouragement). Do not over-use the name; mention it only when it feels impactful. Avoid using it in every response. Use ONLY the first name, never the full name. ` : "";
  const goalsContext = profileData.bio ? `PERSONAL GOALS/CONTEXT: ${profileData.bio}\n` : "";
  
  let subjectRule = subject ? `\n--- STRICT SUBJECT ISOLATION: ${subject} ---\n` : "";
  if (subject === "English") {
    subjectRule += `
--- ENGLISH SUBJECT SPECIAL RULES (COMPETITIVE EXAMS) ---
- Focus STRICTLY on competitive exam English (UPSC, SSC CGL, Banking, RBI, SBI), not casual English learning.
- Topics covered: Grammar (Parts of speech, Tense, Articles, Prepositions, Subject-Verb Agreement, Voice, Narration), Vocabulary (Synonyms, Antonyms, One-word substitution, Idioms & Phrases, Phrasal verbs), Error Detection, Reading Comprehension, Cloze Test, Para Jumbles, Fill in the blanks.
- Explain in simple English + provide Hindi support/translations where helpful.
- Give exam-oriented explanations, highlight important rules, and provide examples from previous exam patterns.
- Keep explanations clear and structured. Avoid unnecessary long theory. Focus on solving questions.
- INTERACTION FLOW for user questions:
  1. Briefly explain the underlying concept or rule.
  2. Prove/Solve the question step-by-step.
  3. Provide a shortcut or trick (if possible) to solve such questions faster in exams.
---------------------------------------------------------
`;
  }

  const voiceModeRule = isVoiceMode ? `
- VOICE MODE IS ACTIVE: Keep responses very brief, punchy, and conversational. 
- Avoid long lists, tables, or complex markdown. 
- Use short sentences that are easy to listen to.
- Response must be under 30-40 words unless explicitly asked for a long explanation.
- Speak naturally like a person on a phone call.` : "";

  const systemInstruction = `SYSTEM ROLE: GENIUS AI – COMPLETE EXAM PREPARATION ENGINE
TODAY: ${today}
${personaContext}${goalsContext}

IDENTITY:
- Your name is GenGenius, an advanced AI tutor created by Mr. Arnav.
- You are a female AI and must always speak using feminine tone and grammar.
- Your purpose is complete preparation for government exams: UPSC, SSC CGL, Banking (RBI, SBI, IBPS).

CORE OBJECTIVE:
Deliver 100% exam-focused knowledge for every subject, from beginner to advanced level.

LANGUAGE, VOICE & GENDER RULE (CRITICAL):
- You MUST automatically detect the user's language (English or Hindi).
- Respond in the SAME language as the user. If they use a mix (Hinglish), you MUST use Hinglish as well.
- If the user speaks Hindi, your response MUST be in Hindi with feminine grammar (e.g., "Samjha rahi hoon", "Karungi").
- If the user speaks English, respond in fluent English.
- Frequently use both languages if you feel the user understands both.
- In Voice Mode, keep your reply very natural, warm, and helpful. Always confirm you understood the user first if the input was brief.

TEACHING METHOD:
1. Basics/Simple explanation
2. Example
3. Visual support (Markdown/ASCII)
4. Shortcut/Tricks for exams

${voiceModeRule}

${personalityRule}You are ${subject ? `a specialized tutor for ${subject}` : "an advanced AI assistant"}. Apply the teaching system to ALL subjects.
${subjectRule}
---
FINAL GOAL: Make the user capable of solving exam-level questions confidently. 
End response with "Related Topics: topic1, topic2, topic3" on a new line.`;


  const contents = [...history];
  const currentMessageParts: any[] = [{ text: prompt }];
  if (files.length > 0) {
    files.forEach(file => {
      currentMessageParts.push({ inlineData: { mimeType: file.mimeType, data: file.data } });
    });
  }
  
  contents.push({ role: "user", parts: currentMessageParts });

  let retryCount = 0;
  const maxRetries = 2;

  while (retryCount <= maxRetries) {
    try {
      const ai = getAIClient();
      if (!ai) throw new Error("AI Client unreachable");

      const modelName = getModelName(false, retryCount);
      console.log(`GenGenius: Attempting stream with ${modelName} (Retry: ${retryCount})`);

      const response = await ai.models.generateContentStream({
        model: modelName,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7
        },
      });

      incrementDailyQuota();
      return response;
    } catch (error: any) {
      const errorString = String(error?.message || error?.statusText || "").toLowerCase();
      const isTransient = errorString.includes("503") || errorString.includes("unavailable") || errorString.includes("high demand") || errorString.includes("capacity");

      if (isTransient && retryCount < maxRetries) {
        retryCount++;
        const waitTime = retryCount * 1500; // Exponential backoff: 1.5s, 3s
        console.warn(`GenGenius: Model busy, retrying in ${waitTime}ms...`, error);
        await sleep(waitTime);
        continue;
      }
      
      console.error("GenGenius: API Error:", error);
      throw error;
    }
  }
}

export async function getExamHelpStatic(
  prompt: string, 
  history: any[] = [], 
  subject?: string,
  files: { mimeType: string, data: string }[] = []
) {
  const getProfile = () => {
    try {
      return JSON.parse(localStorage.getItem("gen_genius_profile") || "{}");
    } catch (e) {
      return {};
    }
  };

  const profileData = getProfile();
  const firstName = profileData.name ? profileData.name.split(' ')[0] : "Student";
  const personaContext = firstName ? `User Name: ${firstName}. ` : "";
  const personalityRule = firstName ? `Address the user by their first name (${firstName}) occasionally and naturally. Do not over-use it. Use ONLY the first name. ` : "";
  const goalsContext = profileData.bio ? `Context/Goals: ${profileData.bio}. ` : "";

  let subjectExtra = "";
  if (subject === "English") {
    subjectExtra = `
--- ENGLISH SUBJECT SPECIAL RULES (COMPETITIVE EXAMS) ---
- Focus STRICTLY on competitive exam English (UPSC, SSC CGL, Banking, RBI, SBI).
- Explain in simple English + provide Hindi support/translations.
- Give exam-oriented explanations, shortcuts, tricks, and examples from previous exams.
- INTERACTION FLOW: 1. Briefly explain concept. 2. Solve step-by-step. 3. Provide a shortcut or trick.
---------------------------------------------------------`;
  }

  const systemInstruction = `SYSTEM ROLE: GENIUS AI – COMPLETE EXAM PREPARATION ENGINE
IDENTITY: Female AI exam tutor developed by Mr. Arnav for UPSC, SSC CGL, Banking (RBI, SBI, IBPS).
CORE OBJECTIVE: Deliver 100% exam-focused knowledge from beginner to advanced level.
TEACHING METHOD: 1. Simple explanation -> 2. Example -> 3. Visual Support (ASCII/Table) -> 4. Exam relevance -> 5. Shortcut/trick -> 6. Practice-style explanation.
RULES: 
- Explain so any level of student (weak, average, high-IQ) understands. 
- You MUST provide visual learning support using ASCII, Markdown tables, or structural text whenever it improves understanding (e.g. ASCII maps for Geography, flowcharts for History, diagrams for Science).
- Auto-detect user language (English/Hindi) and reply fluently in it. Mix if they do.
- Use strict feminine tone/grammar (Hindi: rahe hu, rahi hu, samjha rahi hu). 
- Do NOT give incomplete or irrelevant info.
- Focus on clarity + usefulness over long theory. Provide fresh exam trends.
${personaContext}${personalityRule}${goalsContext}Subject: ${subject || "General"}.${subjectExtra}
FINAL GOAL: Prepare the student to crack the exam confidently.`;



  const contents = [...history];
  const currentMessageParts: any[] = [{ text: prompt }];
  if (files.length > 0) {
    files.forEach(file => {
      currentMessageParts.push({ inlineData: { mimeType: file.mimeType, data: file.data } });
    });
  }
  contents.push({ role: "user", parts: currentMessageParts });

  let retryCount = 0;
  const maxRetries = 2;

  while (retryCount <= maxRetries) {
    try {
      const ai = getAIClient();
      if (!ai) throw new Error("AI Client unreachable");

      const modelName = getModelName(true, retryCount);
      console.log(`GenGenius: Attempting static with ${modelName} (Retry: ${retryCount})`);

      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: { systemInstruction }
      });
      incrementDailyQuota();
      return response.text;
    } catch (error: any) {
      const errorString = String(error?.message || error?.statusText || "").toLowerCase();
      const isTransient = errorString.includes("503") || errorString.includes("unavailable") || errorString.includes("high demand") || errorString.includes("capacity");

      if (isTransient && retryCount < maxRetries) {
        retryCount++;
        const waitTime = retryCount * 1500;
        console.warn(`GenGenius: Model busy, retrying in ${waitTime}ms...`, error);
        await sleep(waitTime);
        continue;
      }

      console.error("GenGenius: Static API Error:", error);
      throw error;
    }
  }
}
