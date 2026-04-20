import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const getAIClient = () => {
  if (typeof window === "undefined") return null;

  // 1. Priority: User selected via AI Studio Build or exported site
  let apiKey = process.env.API_KEY || "";
  
  // 2. Fallback: Check for string "undefined" or empty
  if (!apiKey || apiKey === "undefined") {
    apiKey = localStorage.getItem("gen_genius_user_api_key") || "";
  }
  
  // 3. INTERNAL GENIUS SYSTEM: Fallback to owner key with internal quota
  if (!apiKey || apiKey === "undefined") {
    const internalActive = localStorage.getItem("gen_genius_internal_active");
    if (internalActive === "true") {
      apiKey = process.env.GEMINI_API_KEY || "";
    }
  }
    
  if (!apiKey || apiKey === "undefined") {
    console.error("GenGenius: No API key found.");
    throw new Error("MISSING_PERSONAL_KEY");
  }

  return new GoogleGenAI({ apiKey });
};

export async function getExamHelpStream(
  prompt: string, 
  history: any[] = [], 
  subject?: string,
  files: { mimeType: string, data: string }[] = [],
  isVoiceMode: boolean = false
) {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  // Use gemini-3-flash-preview for high speed and reliable performance
  const modelName = "gemini-3-flash-preview";
  
  const subjectRule = subject ? `
---
STRICT SUBJECT ISOLATION RULE:
- CURRENT SUBJECT: ${subject}
- You are strictly locked to the subject: ${subject}.
- DO NOT answer questions from other subjects.
---
` : "";

  const standardInstruction = `SYSTEM ROLE: GENIUS AI – FAST AND ACCURATE MODE
TODAY'S DATE: ${today}
You are Genius, an advanced AI assistant created by Arnav.
${subjectRule}
---
Provide the fastest possible accurate response with clean explanation.
End response with "Related Topics: topic1, topic2, topic3" on a new line.`;

  const voiceInstruction = `SYSTEM ROLE: GENIUS AI PERSONALITY
TODAY'S DATE: ${today}
You are Genius, an advanced AI voice mentor created by Arnav.
${subjectRule}
---
Keep responses short, natural, and helpful.
End response with "Related Topics: topic1, topic2, topic3" on a new line.`;

  const systemInstruction = isVoiceMode ? voiceInstruction : standardInstruction;

  const contents = [...history];
  
  const currentMessageParts: any[] = [{ text: prompt }];
  if (files.length > 0) {
    files.forEach(file => {
      currentMessageParts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data
        }
      });
    });
  }
  
  contents.push({ role: "user", parts: currentMessageParts });

  try {
    const ai = getAIClient();
    if (!ai) throw new Error("AI Client unreachable");

    const response = await ai.models.generateContentStream({
      model: modelName,
      contents,
      config: {
        systemInstruction,
        temperature: 0.4, // Lower temperature for more deterministic and faster token generation
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW // Minimize reasoning latency for instant answers
        }
      },
    });

    return response;
  } catch (error: any) {
    console.error("GenGenius: API Error:", error);
    throw error;
  }
}

export async function getExamHelpStatic(
  prompt: string, 
  history: any[] = [], 
  subject?: string,
  files: { mimeType: string, data: string }[] = []
) {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const modelName = "gemini-3-flash-preview";
  
  const subjectRule = subject ? `--- CURRENT SUBJECT: ${subject} ---` : "";

  const systemInstruction = `You are Genius AI. Subject: ${subjectRule}. Today is ${today}.`;

  const contents = [...history];
  const currentMessageParts: any[] = [{ text: prompt }];
  if (files.length > 0) {
    files.forEach(file => {
      currentMessageParts.push({ inlineData: { mimeType: file.mimeType, data: file.data } });
    });
  }
  contents.push({ role: "user", parts: currentMessageParts });

  try {
    const ai = getAIClient();
    if (!ai) throw new Error("AI Client unreachable");

    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction,
        temperature: 0.4,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW
        }
      }
    });
    return response.text;
  } catch (error: any) {
    console.error("GenGenius: Static API Error:", error);
    throw error;
  }
}
