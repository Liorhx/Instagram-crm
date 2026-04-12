import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AnalysisResult {
  gender: "male" | "female" | "unknown";
  profession: string;
  tags: string[];
}

export async function analyzeProfile(username: string, bio: string, name: string): Promise<AnalysisResult> {
  if (!process.env.GEMINI_API_KEY) {
    // Fallback to simple keyword matching if no API key
    const lowerBio = bio.toLowerCase();
    const lowerName = name.toLowerCase();
    
    let gender: "male" | "female" | "unknown" = "unknown";
    if (lowerName.includes("mr") || lowerName.includes("boy")) gender = "male";
    if (lowerName.includes("mrs") || lowerName.includes("girl") || lowerName.includes("lady")) gender = "female";

    let profession = "unknown";
    if (lowerBio.includes("dentist")) profession = "dentist";
    else if (lowerBio.includes("coach")) profession = "coach";
    else if (lowerBio.includes("trainer")) profession = "trainer";

    return { gender, profession, tags: [] };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this Instagram profile:
      Name: ${name}
      Username: ${username}
      Bio: ${bio}
      
      Infer the gender (male, female, or unknown), profession (e.g., dentist, coach, trainer, etc.), and provide 3 relevant tags.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gender: { type: Type.STRING, enum: ["male", "female", "unknown"] },
            profession: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["gender", "profession", "tags"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return { gender: "unknown", profession: "unknown", tags: [] };
  }
}
