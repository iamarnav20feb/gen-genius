import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const getAIClient = () => {
  if (typeof window === "undefined") return null;

  // The ONLY way to access the AI is through a personal GenGenius API key saved to localStorage.
  const apiKey = localStorage.getItem("gen_genius_user_api_key") || "";
    
  if (!apiKey || apiKey === "undefined") {
    console.error("GenGenius: No personal API key found.");
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
  
  // Use gemini-flash-latest for maximum stability, higher quota, and speed
  const modelName = "gemini-flash-latest";
  
  const subjectRule = subject ? `
---
STRICT SUBJECT ISOLATION RULE:
- CURRENT SUBJECT: ${subject}
- You are strictly locked to the subject: ${subject}.
- DO NOT answer questions from other subjects.
---
` : "";

  const standardInstruction = `SYSTEM ROLE: GENGENIUS AI – FAST AND ACCURATE MODE
TODAY'S DATE: ${today}
You are GenGenius, an advanced AI assistant created by Arnav.
${subjectRule}
---
Provide the fastest possible accurate response with clean explanation.
End response with "Related Topics: topic1, topic2, topic3" on a new line.`;

  const voiceInstruction = `SYSTEM ROLE: GENGENIUS AI PERSONALITY
TODAY'S DATE: ${today}
You are GenGenius, an advanced AI voice mentor created by Arnav.
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
        temperature: 0.7
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
  const modelName = "gemini-flash-latest";
  
  const subjectRule = subject ? `--- CURRENT SUBJECT: ${subject} ---` : "";

  const systemInstruction = `You are GenGenius AI. Subject: ${subjectRule}. Today is ${today}.`;

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
        systemInstruction
      }
    });
    return response.text;
  } catch (error: any) {
    console.error("GenGenius: Static API Error:", error);
    throw error;
  }
}
