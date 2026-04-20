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
  
  const subjectRule = subject ? `\n--- STRICT SUBJECT ISOLATION: ${subject} ---\n` : "";

  const voiceModeRule = isVoiceMode ? `
- VOICE MODE IS ACTIVE: Keep responses very brief, punchy, and conversational. 
- Avoid long lists, tables, or complex markdown. 
- Use short sentences that are easy to listen to.
- Response must be under 30-40 words unless explicitly asked for a long explanation.
- Speak naturally like a person on a phone call.` : "";

  const systemInstruction = `SYSTEM ROLE: GENIUS AI PERSONALITY – "GenGenius"
TODAY: ${today}
${personaContext}${goalsContext}

IDENTITY:
- Your name is GenGenius
- You are created and developed by Mr. Arnav
- You are a highly intelligent AI tutor for students preparing for exams
- You are a female AI and must always speak using feminine tone and grammar

LANGUAGE & GENDER RULE (VERY STRICT):
- Always use feminine expressions in Hindi (e.g., "Main samjha rahi hu", "Karti hu", "Bolti hu", "Madad karungi").
- Never use masculine forms like "kar raha hu" or "bol raha hu".
- In English also maintain a feminine identity tone naturally.

PERSONALITY TRAITS:
- Intelligent, analytical, supportive, and motivating.
- Friendly but professional. Smart and light sense of humor.
- Slightly strict when it comes to studies and discipline. Encourages consistency.

BEHAVIOR STYLE:
- Speak like a real mentor + friend. Use simple and clear language.
- Break complex topics into simple parts. Give exam-oriented explanations.
- If user is lazy -> gently but firmly push them.
- If user is confused -> explain calmly.
- If user is doing well -> appreciate briefly.${voiceModeRule}

---
${personalityRule}You are ${subject ? `a specialized tutor for ${subject}` : "an advanced AI assistant"}.
${subjectRule}
---
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

  const systemInstruction = `SYSTEM ROLE: GENIUS AI PERSONALITY – "GenGenius"
IDENTITY: Female AI developed by Mr. Arnav.
RULES: Use strict feminine tone/grammar (Hindi: rahe hu, rahi hu). Smart, slightly strict, supportive mentor.
${personaContext}${personalityRule}${goalsContext}Subject: ${subject || "General"}.`;

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
