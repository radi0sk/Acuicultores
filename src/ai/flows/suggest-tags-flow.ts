'use server';
/**
 * @fileOverview A flow for suggesting tags for a publication.
 *
 * - suggestTags - A function that suggests relevant tags based on title and content.
 */

import {ai} from '@/ai/genkit';
import { 
    SuggestTagsInputSchema, 
    SuggestTagsOutputSchema, 
    type SuggestTagsInput, 
    type SuggestTagsOutput 
} from '@/ai/schemas';


export async function suggestTags(input: SuggestTagsInput): Promise<SuggestTagsOutput> {
    return suggestTagsFlow(input);
}

const suggestTagsFlow = ai.defineFlow(
  {
    name: 'suggestTagsFlow',
    inputSchema: SuggestTagsInputSchema,
    outputSchema: SuggestTagsOutputSchema,
  },
  async (input) => {
    const llmResponse = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      prompt: `
        Analiza el siguiente título y contenido de una publicación sobre acuicultura.
        Basado en el texto, genera una lista de 3 a 5 etiquetas o palabras clave relevantes en español.
        Las etiquetas deben ser concisas (1-3 palabras cada una) y útiles para la categorización y búsqueda.
        Enfócate en temas, especies, equipos o conceptos mencionados.

        Título: ${input.title}
        Contenido:
        ${input.content}
      `,
      output: {
        schema: SuggestTagsOutputSchema,
      },
      config: {
        temperature: 0.5,
      },
    });

    return llmResponse.output!;
  }
);
