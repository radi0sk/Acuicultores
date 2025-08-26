
/**
 * @fileOverview Centralized Zod schemas and TypeScript types for AI flows.
 * This file consolidates all data structures used as inputs or outputs
 * for Genkit flows, making them easily importable and manageable.
 */

import {z} from 'zod';

// Schema for enhancing a publication
export const EnhancePublicationInputSchema = z.object({
  title: z.string().describe('The original title of the publication.'),
  content: z.string().describe('The original content of the publication.'),
  customInstructions: z.string().optional().describe('Optional custom instructions for the AI on how to improve the content.'),
});
export type EnhancePublicationInput = z.infer<typeof EnhancePublicationInputSchema>;

export const EnhancePublicationOutputSchema = z.object({
  title: z.string().describe('The AI-generated or improved title for the post.'),
  introduction: z.string().describe('The AI-generated introduction paragraph.'),
  sections: z.array(z.object({
    subtitle: z.string().describe('The subtitle for the section.'),
    content: z.string().describe('The content for the section.'),
  })).describe('An array of sections.'),
  conclusion: z.string().describe('The AI-generated concluding paragraph.'),
  generatedImageUrl: z.string().describe("URL de la imagen generada por IA"),
  suggestedTags: z.array(z.string()).describe("Suggested tags for the publication.")
});
export type EnhancePublicationOutput = z.infer<typeof EnhancePublicationOutputSchema>;


// Schema for suggesting tags
export const SuggestTagsInputSchema = z.object({
  title: z.string().describe('The title of the publication.'),
  content: z.string().describe('The content of the publication.'),
});
export type SuggestTagsInput = z.infer<typeof SuggestTagsInputSchema>;

export const SuggestTagsOutputSchema = z.object({
  tags: z.array(z.string()).describe('An array of 1-3 word tags relevant to the content.'),
});
export type SuggestTagsOutput = z.infer<typeof SuggestTagsOutputSchema>;

    