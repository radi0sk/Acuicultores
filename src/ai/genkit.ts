// src/ai/genkit.ts
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Initialize the Genkit AI platform with the Google AI plugin.
// This configuration allows the application to use Google's generative AI models.
// By defining this in a central file, we ensure that the same AI instance is used
// across all server-side flows, preventing re-initialization and making it
// easy to manage AI-related configurations.
export const ai = genkit({
  plugins: [
    googleAI({
      // Specify the API version to use. It is recommended to use the latest stable version.
      apiVersion: 'v1beta',
    }),
  ],
  // Log events to the console for debugging and monitoring.
  // This is useful for tracking flow execution, errors, and performance.
  logSink: 'stdout',
  // Enable OpenTelemetry for tracing and metrics, which can be exported
  // to observability platforms like Google Cloud Trace and Prometheus.
  enableTracing: true,
});
