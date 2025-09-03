
'use server';
/**
 * @fileOverview A flow for enhancing a publication with AI.
 *
 * - enhancePublication - A function that develops a full article from a topic and generates an image.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { 
    EnhancePublicationInputSchema, 
    EnhancePublicationOutputSchema,
    type EnhancePublicationInput,
    type EnhancePublicationOutput 
} from '@/ai/schemas';

export async function enhancePublication(input: EnhancePublicationInput): Promise<EnhancePublicationOutput> {
  console.log('[AI_FLOW_START] enhancePublicationFlow: Received input ->', JSON.stringify(input, null, 2));
  return enhancePublicationFlow(input);
}

// Define the main flow
const enhancePublicationFlow = ai.defineFlow(
  {
    name: 'enhancePublicationFlow',
    inputSchema: EnhancePublicationInputSchema,
    outputSchema: EnhancePublicationOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-pro-latest',
      prompt: `
        Eres un experto en acuicultura, ambientalismo y legislación guatemalteca. Tu tarea es desarrollar un artículo profesional basado en el título y contenido proporcionado.

        **Instrucciones clave:**
        1. **Enfoque en Guatemala:** Todos los aspectos regulatorios deben referirse específicamente a las leyes y normativas de Guatemala.
        2. **Integración de contenido:** Si el usuario proporcionó contenido, mejóralo y expándelo sin perder su esencia.
        3. **Estructura profesional:** Usa una estructura clara con introducción, secciones relevantes y conclusión.
        4. **Imagen relevante:** Genera una imagen profesional que represente el tema principal.

        **Datos de entrada:**
        - Título: ${input.title}
        - Contenido existente: ${input.content || "El usuario no ha proporcionado contenido adicional."}
        - Instrucciones personalizadas: ${input.customInstructions || "Ninguna"}

        **Requisitos de salida:**
        - Artículo completo con estructura profesional
        - Lenguaje claro y técnico adecuado para profesionales de acuicultura
        - Referencias a normativas guatemaltecas cuando sea relevante
        - Imagen generada de alta calidad relacionada al tema
        - Etiquetas sugeridas relevantes
      `,
      output: { 
        schema: EnhancePublicationOutputSchema,
      },
      config: {
        temperature: 0.7,
      }
    });

    if (!output) {
      throw new Error("La IA no pudo generar una respuesta.");
    }

    return output;
  }
);

