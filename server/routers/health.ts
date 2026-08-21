import { randomUUID } from "crypto";
import { z } from "zod";
import { invokeLLM, listLLMModels, type MessageContent } from "../_core/llm";
import { storagePut } from "../storage";
import { publicProcedure, router } from "../_core/trpc";
import {
  CARE_COACH_SYSTEM,
  cleanHealthText,
  HEALTH_CHAT_SYSTEM,
  needsUrgentHelp,
  REPORT_ANALYSIS_SYSTEM,
  urgentHelpReply,
} from "../healthSafety";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(1400),
});

const reportSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "health_document_context",
    strict: true,
    schema: {
      type: "object",
      properties: {
        overview: { type: "string" },
        signals: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              plainLanguage: { type: "string" },
              direction: { type: "string", enum: ["stated", "worth_discussing", "missing_context"] },
            },
            required: ["title", "plainLanguage", "direction"],
            additionalProperties: false,
          },
        },
        nextSteps: { type: "array", items: { type: "string" } },
        questionsForClinician: { type: "array", items: { type: "string" } },
        safetyNotice: { type: "string" },
      },
      required: ["overview", "signals", "nextSteps", "questionsForClinician", "safetyNotice"],
      additionalProperties: false,
    },
  },
};

const carePlanSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "wellbeing_routine_plan",
    strict: true,
    schema: {
      type: "object",
      properties: {
        reflection: { type: "string" },
        actions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              action: { type: "string" },
              cadence: { type: "string" },
            },
            required: ["title", "action", "cadence"],
            additionalProperties: false,
          },
        },
        clinicianPrompt: { type: "string" },
        safetyNote: { type: "string" },
      },
      required: ["reflection", "actions", "clinicianPrompt", "safetyNote"],
      additionalProperties: false,
    },
  },
};

async function preferredModel() {
  const { data } = await listLLMModels();
  const model = data.find((item) => item.id.includes("gemini") && item.id.includes("flash"))
    ?? data.find((item) => item.id.includes("mini"))
    ?? data[0];
  if (!model) throw new Error("No AI model is currently available.");
  return model.id;
}

function llmText(response: Awaited<ReturnType<typeof invokeLLM>>) {
  const content = response.choices[0]?.message.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("The AI service returned an empty response. Please try again.");
  }
  return content;
}

export const healthRouter = router({
  chat: publicProcedure
    .input(z.object({ messages: z.array(chatMessageSchema).min(1).max(10) }))
    .mutation(async ({ input }) => {
      const latestUserText = input.messages.filter((message) => message.role === "user").at(-1)?.content ?? "";
      if (needsUrgentHelp(latestUserText)) return { answer: urgentHelpReply(), urgent: true };

      const response = await invokeLLM({
        model: await preferredModel(),
        messages: [{ role: "system", content: HEALTH_CHAT_SYSTEM }, ...input.messages],
        maxTokens: 520,
      });
      return { answer: llmText(response), urgent: false };
    }),

  analyzeDocument: publicProcedure
    .input(z.object({
      fileName: z.string().min(1).max(120),
      mimeType: z.enum(["application/pdf", "image/png", "image/jpeg", "text/plain"]),
      fileData: z.string().max(850_000).optional(),
      reportText: z.string().max(6000).optional(),
    }).refine((input) => Boolean(input.fileData || input.reportText), "Provide a supported document or report text."))
    .mutation(async ({ input }) => {
      const model = await preferredModel();
      let userContent: string | MessageContent[];
      const contextPrompt = "Explain only the facts that appear in this health document. Return the requested structured educational summary.";

      if (input.reportText) {
        userContent = `${contextPrompt}\n\nDocument text:\n${cleanHealthText(input.reportText)}`;
      } else {
        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
        const buffer = Buffer.from(input.fileData ?? "", "base64");
        const { url } = await storagePut(`healthmate-report-review/${randomUUID()}-${safeName}`, buffer, input.mimeType);
        userContent = input.mimeType === "application/pdf"
          ? [{ type: "text", text: contextPrompt }, { type: "file_url", file_url: { url, mime_type: "application/pdf" } }]
          : [{ type: "text", text: contextPrompt }, { type: "image_url", image_url: { url, detail: "high" } }];
      }

      const response = await invokeLLM({
        model,
        messages: [{ role: "system", content: REPORT_ANALYSIS_SYSTEM }, { role: "user", content: userContent }],
        response_format: reportSchema,
        maxTokens: 1100,
      });
      try {
        return JSON.parse(llmText(response));
      } catch {
        return {
          overview: llmText(response),
          signals: [],
          nextSteps: ["Bring the original document to a licensed clinician who knows your health history."],
          questionsForClinician: ["Which parts of this report matter most in my personal context?"],
          safetyNotice: "This informational summary is not a diagnosis or a substitute for professional medical care.",
        };
      }
    }),

  careCoach: publicProcedure
    .input(z.object({ focus: z.enum(["sleep", "energy", "nutrition", "movement", "stress"]), routine: z.string().min(8).max(900) }))
    .mutation(async ({ input }) => {
      if (needsUrgentHelp(input.routine)) {
        return { urgent: true, reflection: urgentHelpReply(), actions: [], clinicianPrompt: "", safetyNote: "" };
      }
      const response = await invokeLLM({
        model: await preferredModel(),
        messages: [{ role: "system", content: CARE_COACH_SYSTEM }, { role: "user", content: `My wellbeing focus is ${input.focus}. My routine context: ${cleanHealthText(input.routine)}` }],
        response_format: carePlanSchema,
        maxTokens: 850,
      });
      try {
        return { urgent: false, ...JSON.parse(llmText(response)) };
      } catch {
        return {
          urgent: false,
          reflection: "A steady routine is easier to build when it begins with one small cue you can repeat on ordinary days.",
          actions: [
            { title: "Choose a close-out cue", action: "Set one short, screen-free transition that signals the end of study time.", cadence: "Most evenings" },
            { title: "Prepare tomorrow lightly", action: "Write one priority for the next day before you finish your evening routine.", cadence: "Weekdays" },
            { title: "Notice the pattern", action: "Keep a brief note about what helps you feel ready for the next day without drawing conclusions.", cadence: "Weekly" },
          ],
          clinicianPrompt: "Is there anything in my health history, symptoms, or medicines that should shape my routine choices?",
          safetyNote: "These are general wellbeing ideas, not medical advice. A licensed clinician should personalise guidance for health concerns, symptoms, or medicines.",
        };
      }
    }),
});
