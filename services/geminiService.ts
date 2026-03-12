
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

const cropImageToAspectRatio = (imageBase64: string, targetAspectRatio: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const sourceWidth = img.width;
            const sourceHeight = img.height;
            const sourceAspectRatio = sourceWidth / sourceHeight;

            let cropWidth = sourceWidth;
            let cropHeight = sourceHeight;

            if (sourceAspectRatio > targetAspectRatio) {
                // Image is wider than target, crop width
                cropWidth = sourceHeight * targetAspectRatio;
            } else if (sourceAspectRatio < targetAspectRatio) {
                // Image is taller than target, crop height
                cropHeight = sourceWidth / targetAspectRatio;
            }

            const cropX = (sourceWidth - cropWidth) / 2;
            const cropY = (sourceHeight - cropHeight) / 2;
            
            const canvas = document.createElement('canvas');
            canvas.width = cropWidth;
            canvas.height = cropHeight;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }

            ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (err) => reject(err);
        img.src = imageBase64;
    });
};

const getImageAspectRatio = (imageFile: File): Promise<number> => {
     return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve(img.width / img.height);
        };
        img.onerror = (err) => reject(err);
        img.src = URL.createObjectURL(imageFile);
    });
};


export const renderImage = async (baseImageFile: File, materials: Omit<Material, 'id'>[], prompt: string, isEnhancementMode: boolean): Promise<string> => {
    const baseImagePart = await fileToGenerativePart(baseImageFile);
    const materialImageParts = await Promise.all(materials.map(m => fileToGenerativePart(m.file)));
    const targetAspectRatio = await getImageAspectRatio(baseImageFile);

    let textContent = '';
    
    if (isEnhancementMode) {
        textContent = `Enhance the provided image to a photorealistic level. The image is a nearly complete architectural rendering. Focus on improving lighting, shadows, textures, and adding realistic details to make it look like a real photograph. `;
    } else {
        textContent = `Render the base image with photorealistic quality. `;
    }

    if (materials.length > 0) {
        const materialDescriptions = materials.map(m => `[${m.name}]`).join(', ');
        if (isEnhancementMode) {
            textContent += `Use the provided material images to refine or replace existing textures where appropriate, based on their names (e.g., improve the texture of concrete surfaces using the 'concrete' material named '${materialDescriptions}'). `;
        } else {
            textContent += `Use the provided material images as references for different surfaces. The materials provided are: ${materialDescriptions}. Please apply these materials to the appropriate surfaces in the base image based on their names (e.g., apply the material named 'concrete' to concrete surfaces). `;
        }
    }
    textContent += `User's detailed prompt: ${prompt}`;
    
    const textPart = { text: textContent };
    
    const parts = [baseImagePart, ...materialImageParts, textPart];
    const rawResult = await callGeminiApi(parts);
    return cropImageToAspectRatio(rawResult, targetAspectRatio);
};

export const reRenderImage = async (originalImageBase64: string, checkbackFile: File | null, prompt: string): Promise<string> => {
    const originalImagePart = base64ToGenerativePart(originalImageBase64);

    // Get aspect ratio from the original (already cropped) base64 image
    const targetAspectRatio = await new Promise<number>((resolve, reject) => {
         const img = new Image();
         img.onload = () => resolve(img.width / img.height);
         img.onerror = reject;
         img.src = originalImageBase64;
    });

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
    
    const rawResult = await callGeminiApi(parts);
    return cropImageToAspectRatio(rawResult, targetAspectRatio);
};
