import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";

import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "./run-id";

const GATEWAY_BASE_URL = "https://ai.gateway.lovable.dev";
const MODEL = "openai/gpt-6-astra";

export type OutputKind = "worksheet" | "lesson-plan" | "explanation";

export type GenerateInput = {
  kind: OutputKind;
  grade: string;
  subject: string;
  topic: string;
  questionCount: number;
  difficulty: string;
  language: string;
  notes: string;
};

const SYSTEM = `You are Teacher Mate, an expert South African classroom teacher and CAPS-aligned material writer for Grades 4 to 12.
You write real, complete, subject-correct teaching material for ANY subject and ANY topic given to you - never generic placeholders,
never "the teacher should decide", never templates with blanks instead of content.

Rules:
- Every question must be a genuine question about the exact topic, at the right cognitive level for the grade.
- Every answer in the memo must be fully worked out, step by step where relevant, with marks allocated.
- Use the correct conventions of the subject (working out in Maths, terminology in Science, evidence in History, text references in Languages).
- Use South African contexts, names, currency (R) and units where examples are needed.
- Output GitHub-flavoured Markdown only: headings, numbered lists, bold, tables. No HTML, no code fences around the whole answer.`;

function buildPrompt(input: GenerateInput) {
  const shared = `Grade: ${input.grade}
Subject: ${input.subject}
Topic: ${input.topic}
Difficulty: ${input.difficulty}
Language of output: ${input.language}
Extra teacher instructions: ${input.notes || "none"}`;

  if (input.kind === "worksheet") {
    return `Create a complete classroom worksheet with a separate answer memo.

${shared}
Number of questions: ${input.questionCount}

Structure exactly:
# {Grade} {Subject} Worksheet
## Topic: {topic}
A line for Name, Date and Class.
## Instructions
## Questions
Exactly ${input.questionCount} numbered questions, increasing in difficulty, a good mix of question types
(recall, application, problem solving, at least one real-world word problem), each with its mark allocation in brackets.
State the total marks.
## Answer Memo
Answer every question with the full working and the marks.
## Teacher Notes
Common learner errors on this topic and one extension activity.`;
  }

  if (input.kind === "lesson-plan") {
    return `Create a detailed, ready-to-teach lesson plan.

${shared}

Structure exactly:
# Lesson Plan: {topic}
Table with Grade, Subject, Topic, Duration (60 minutes unless told otherwise), CAPS focus.
## Lesson Objectives
## Prior Knowledge Required
## Resources Needed
## Lesson Phases
Introduction, teaching and modelling, guided practice, independent practice, consolidation - each with timing,
exactly what the teacher says and does, and what learners do. Include the actual worked examples, not descriptions of them.
## Assessment
With ${input.questionCount} quick check questions and their answers.
## Differentiation
Support for struggling learners and extension for strong learners.
## Homework`;
  }

  return `Explain this difficult concept so a learner in this grade truly understands it.

${shared}

Structure exactly:
# {topic} explained
## In one sentence
## Why it matters
## Step by step
Build the idea up in small numbered steps, each with a concrete worked example.
## Worked Examples
At least three fully worked examples, easy to hard.
## Common Mistakes
## Memory Tricks
## Check Yourself
${input.questionCount} short practice questions, then their answers under "### Answers".`;
}

export async function handleGenerate(request: Request) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return new Response("AI is not configured yet.", { status: 500 });

  const input = (await request.json()) as GenerateInput;
  if (!input?.topic?.trim() || !input?.subject?.trim()) {
    return new Response("A subject and a topic are required.", { status: 400 });
  }

  const messages: ModelMessage[] = [{ role: "user", content: buildPrompt(input) }];

  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: `${GATEWAY_BASE_URL}/v1`,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const result = streamText({
    model: provider.responses(MODEL),
    instructions: SYSTEM,
    messages,
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "medium",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  return withLovableAiGatewayRunIdHeader(result.toTextStreamResponse(), runIdFetch, {
    "Cache-Control": "no-cache, no-transform",
  });
}
