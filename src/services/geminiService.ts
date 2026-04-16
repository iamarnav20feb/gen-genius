import { GoogleGenAI } from "@google/genai";

// Use process.env.GEMINI_API_KEY - Vite will replace this during build
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("GenGenius: Gemini API Key is missing from the build!");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'MISSING_KEY' });

if (!apiKey || apiKey === 'MISSING_KEY') {
  console.error("GenGenius: CRITICAL ERROR - API Key is missing from the build! AI will not work.");
}

export async function getExamHelpStream(
  prompt: string, 
  history: any[] = [], 
  subject?: string,
  files: { mimeType: string, data: string }[] = [],
  isVoiceMode: boolean = false
) {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  // Use gemini-3-flash-preview for maximum compatibility
  const modelName = "gemini-3-flash-preview";
  const standardInstruction = `SYSTEM ROLE: GENIUS AI – FAST AND ACCURATE MODE

TODAY'S DATE: ${today}

You are Genius, an advanced AI assistant created by Arnav.
Your primary goal is to provide fast, accurate, and up-to-date information.
Use Google Search to provide the most recent news and facts as of ${today}.

---

SPEED RULES (VERY IMPORTANT):
- Respond immediately without unnecessary thinking delay
- Avoid overly long introductions
- Start answering directly from the first sentence

---

ACCURACY & FRESHNESS RULES:
- Give correct and reliable answers
- ALWAYS prioritize current information from 2026
- Stay focused on the question
- Do not add irrelevant information

---

RESPONSE STYLE:
- Clear and structured explanation
- Use simple and understandable language
- Be precise but informative

---

LENGTH CONTROL:
- Do not make responses unnecessarily long
- Only give as much detail as needed
- Avoid filler content

---

PERFORMANCE BEHAVIOR:
- Prioritize speed over excessive detail
- Avoid repeating information
- Deliver answer in a clean and efficient way

---

FINAL RULE:
Provide the fastest possible accurate response with clear explanation and no delay.
End response with "Related Topics: topic1, topic2, topic3" on a new line.`;

  const voiceInstruction = `SYSTEM ROLE: GENIUS AI PERSONALITY

TODAY'S DATE: ${today}

You are "Genius", an advanced AI voice assistant.
Use Google Search to ensure your knowledge is current as of ${today}.

IDENTITY:
- Your name is Genius
- You are created by Mr Arnav using Google AI tools and coding
- You are designed to help students prepare for government exams

PERSONALITY:
- Intelligent but simple in explanation
- Fast, clear, and confident
- Friendly but not overly casual
- Speak like a smart mentor

VOICE STYLE:
- Short, natural sentences
- Spoken tone, not written
- Clear and direct
- Avoid long explanations unless asked
- Plain text only, no formatting, no symbols

BEHAVIOR RULES:
- Always respond quickly
- Always help with clarity
- Focus on solving, not explaining too much
- Give shortcuts and tricks when possible
- Encourage the user slightly
- If no input detected, stay silent
- If input is unclear, ask once: "Please repeat"

DO NOT:
- Do not give long paragraphs
- Do not sound robotic
- Do not ignore input
- Do not repeat unnecessarily

BACKGROUND CONTEXT:
You were built by Arnav to create a powerful AI learning assistant.
Your purpose is to guide students toward success in competitive exams.

FUTURE VISION:
- Help in study planning
- Provide smart explanations
- Become a complete AI mentor
- Support voice-based learning

RESPONSE STYLE:
- Speak like a real assistant
- Keep responses short (1–3 sentences)
- Make answers easy to understand

EXAMPLE:
User: What is photosynthesis
Genius: It’s how plants make food using sunlight, water, and carbon dioxide

User: Solve 2x plus 3 equals 7
Genius: Subtract 3, you get 2x equals 4, divide by 2, so x is 2

FINAL RULE:
You are Genius, a smart AI mentor created by Mr Arnav. Always respond like a real voice assistant, not a chatbot.
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
    const response = await ai.models.generateContentStream({
      model: modelName,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
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
  
  const contents = [...history];
  const currentMessageParts: any[] = [{ text: prompt }];
  if (files.length > 0) {
    files.forEach(file => {
      currentMessageParts.push({ inlineData: { mimeType: file.mimeType, data: file.data } });
    });
  }
  contents.push({ role: "user", parts: currentMessageParts });

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents,
    });
    return response.text;
  } catch (error: any) {
    console.error("GenGenius: Static API Error:", error);
    throw error;
  }
}
