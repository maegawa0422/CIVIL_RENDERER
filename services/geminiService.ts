
import { GoogleGenAI, Modality } from "@google/genai";

// Material type definition to be used in the App and service
export interface Material {
  id: string;
  file: File;
  name: string;
}

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};

const base64ToGenerativePart = (base64Data: string) => {
    const mimeType = base64Data.match(/data:(.*);base64,/)?.[1] ?? 'image/png';
    const data = base64Data.split(',')[1];
    return {
        inlineData: { data, mimeType },
    };
};

const callGeminiApi = async (parts: any[]): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const resultPart = response.candidates?.[0]?.content?.parts?.[0];
        if (resultPart && resultPart.inlineData) {
            return `data:${resultPart.inlineData.mimeType};base64,${resultPart.inlineData.data}`;
        } else {
            // The 'text' property on GenerateContentResponse is a non-optional string getter, so optional chaining is not needed.
            const errorText = response.text.trim();
            if (errorText) {
                throw new Error(`The API returned an error: ${errorText}`);
            }
            throw new Error("The API did not return an image. Please try again with a different prompt or image.");
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            throw new Error(`${error.message}`);
        }
        throw new Error("An unknown error occurred while rendering the image.");
    }
};

export const renderImage = async (baseImageFile: File, materials: Omit<Material, 'id'>[], prompt: string): Promise<string> => {
    const baseImagePart = await fileToGenerativePart(baseImageFile);
    const materialImageParts = await Promise.all(materials.map(m => fileToGenerativePart(m.file)));

    let textContent = `Render the base image with photorealistic quality. `;
    if (materials.length > 0) {
        const materialDescriptions = materials.map(m => `[${m.name}]`).join(', ');
        textContent += `Use the provided material images as references for different surfaces. The materials provided are: ${materialDescriptions}. Please apply these materials to the appropriate surfaces in the base image based on their names (e.g., apply the material named 'concrete' to concrete surfaces). `;
    }
    textContent += `User's detailed prompt: ${prompt}`;

    const textPart = { text: textContent };
    
    const parts = [baseImagePart, ...materialImageParts, textPart];
    return callGeminiApi(parts);
};

export const reRenderImage = async (originalImageBase64: string, checkbackFile: File | null, prompt: string): Promise<string> => {
    const originalImagePart = base64ToGenerativePart(originalImageBase64);
    const parts: any[] = [originalImagePart];
    let textContent = '';

    if (checkbackFile) {
        const checkbackPart = await fileToGenerativePart(checkbackFile);
        parts.push(checkbackPart);
        textContent = `This is a previously generated image. Re-render it based on the user's markups in the provided check-back image and the following instructions. This is an iterative refinement, so apply the changes to the existing image: ${prompt}`;
    } else {
        // Updated prompt for better text-only and iterative re-rendering
        textContent = `This is a previously generated image. Please modify it based on the following instructions. This is an iterative refinement, so apply the changes to the existing image and generate a new version: ${prompt}`;
    }
    
    const textPart = { text: textContent };
    parts.push(textPart);
    
    return callGeminiApi(parts);
};