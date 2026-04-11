import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getSmartDispatchAdvice(
  bookingLocation: { lat: number; lng: number },
  availableDrivers: any[]
) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        You are an AI dispatch assistant for FuelresQ India.
        Booking Location: ${JSON.stringify(bookingLocation)}
        Available Drivers: ${JSON.stringify(availableDrivers)}
        
        Analyze the best driver to assign based on distance and current status in an Indian city context (like Bangalore).
        Return a JSON object with the recommended driverId and a brief reasoning.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedDriverId: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            estimatedArrivalMinutes: { type: Type.NUMBER }
          },
          required: ["recommendedDriverId", "reasoning", "estimatedArrivalMinutes"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Dispatch Error:", error);
    return null;
  }
}

export async function predictDemand(historicalData: any[]) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Analyze this historical fuel delivery data and predict high-demand areas for the next 4 hours in Dubai.
        Data: ${JSON.stringify(historicalData)}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              area: { type: Type.STRING },
              demandLevel: { type: Type.STRING }, // 'High', 'Medium', 'Low'
              recommendedDrivers: { type: Type.INTEGER }
            }
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return [];
  }
}
