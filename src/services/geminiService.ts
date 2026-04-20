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
const getModelName = (accuracyNeeded: boolean = false): string => {
  return accuracyNeeded ? "gemini-3.1-pro-preview" : "gemini-3.1-flash-lite-preview";
};

export async function getExamHelpStream(
  prompt: string, 
  history: any[] = [], 
  subject?: string,
  files: { mimeType: string, data: string }[] = [],
  isVoiceMode: boolean = false
) {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const profile = JSON.parse(localStorage.getItem("gen_genius_profile") || "{}");
  
  const personaContext = profile.name ? `USER NAME: ${profile.name}\n` : "";
  const personalityRule = profile.name ? `Always address the user by their name: ${profile.name}. ` : "";
  const goalsContext = profile.bio ? `PERSONAL GOALS/CONTEXT: ${profile.bio}\n` : "";
  
  const modelName = getModelName(/* prioritize flash for speed/free-usage */ false);
  
  const subjectRule = subject ? `\n--- STRICT SUBJECT ISOLATION: ${subject} ---\n` : "";

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
- If user is doing well -> appreciate briefly.

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
  const modelName = getModelName(/* static often implies more complexity, use Pro */ true);
  
  const profile = JSON.parse(localStorage.getItem("gen_genius_profile") || "{}");
  const personaContext = profile.name ? `User Name: ${profile.name}. ` : "";
  const personalityRule = profile.name ? `Always address user by name: ${profile.name}. ` : "";
  const goalsContext = profile.bio ? `Context/Goals: ${profile.bio}. ` : "";

  const systemInstruction = `SYSTEM ROLE: GENIUS AI PERSONALITY – "GenGenius"
IDENTITY: Female AI developed by Mr. Arnav.
RULES: Use strict feminine tone/grammar (Hindi: rahe hu, rahi hu). Smart, slightly strict, supportive mentor.
${personaContext}${personalityRule}${goalsContext}Subject: ${subject || "General"}.`;

  const contents = [...history];
  const currentMessageParts: any[] = [{ text: prompt }];
  // ... files ...
  
  // ... (simplified for brevity here)

  try {
    const ai = getAIClient();
    if (!ai) throw new Error("AI Client unreachable");

    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: { systemInstruction }
    });
    return response.text;
  } catch (error: any) {
    console.error("GenGenius: Static API Error:", error);
    throw error;
  }
}
