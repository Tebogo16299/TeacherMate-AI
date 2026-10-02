# Teacher Mate — Project Documentation

## 1. Overview
Teacher Mate is an AI content generator for South African teachers (Grades 4–12). It creates complete, CAPS-aligned teaching material for **any subject and any topic**, including:

- **Worksheets with a memo**: numbered questions with marks, plus a fully worked answer memo and teacher notes.
- **Lesson plans**: objectives, prior knowledge, resources, timed lesson phases, assessment, differentiation and homework.
- **Concept explanations**: a step-by-step explanation with worked examples, common mistakes, memory tricks and practice questions with answers.
- **Diagrams / pictures**: labelled visual aids you can print.

## 2. Problem Solved
The first version was hard-coded and only produced content about fractions. Teacher Mate uses AI, so it writes new content for whatever grade, subject and topic the teacher types in.

## 3. How to Use
1. Choose what you need: Worksheet + Memo, Lesson Plan, Explain a Concept, or Diagram / Picture.
2. Pick the **Grade** (4–12) and **Language**.
3. Pick the **Subject** and type a **Topic** (e.g. "photosynthesis", "the Great Trek").
4. Set the **number of questions** and **level** (Foundation, Grade level, Challenging, Exam standard).
5. Add any extra instructions (optional), e.g. "45-minute lesson, no calculators".
6. Click **Generate**. The content appears as it is written. Click **Stop** to cancel.
7. Click **Print / Save as PDF** to print or save the result.

## 4. Features
- 9 grades (4–12) and 27 subjects, including SA home languages
- Output in English, Afrikaans, isiZulu, Sepedi, Setswana or isiXhosa
- South African context (Rand currency, local names and examples)
- Live streaming output
- Print-friendly layout (controls are hidden when printing)

## 5. Technology
| Part | Technology |
| --- | --- |
| Framework | TanStack Start (React 19, Vite) |
| Styling | Tailwind CSS v4 |
| Text AI | Lovable AI Gateway — OpenAI GPT model |
| Image AI | Lovable AI Gateway — OpenAI image model |
| Hosting | Lovable (edge runtime) |

## 6. Project Structure
| File | Purpose |
| --- | --- |
| `src/routes/index.tsx` | Main page: form, buttons, output area |
| `src/routes/api/generate.ts` | Server endpoint for text generation |
| `src/routes/api/generate-image.ts` | Server endpoint for image generation |
| `src/lib/teacher.server.ts` | AI prompts and text-generation logic |
| `src/lib/image-gateway.server.ts` | Image generation request |
| `src/lib/stream-image.ts` | Reads streamed image data in the browser |
| `src/lib/markdown.tsx` | Formats AI output (headings, lists, tables) |
| `src/styles.css` | Theme, fonts and print styles |

## 7. How It Works
1. The teacher fills in the form and clicks Generate.
2. The browser sends the details to `/api/generate` (text) or `/api/generate-image` (images).
3. The server builds a detailed prompt and sends it to the AI with a secret key that stays on the server.
4. The AI response streams back and is displayed live as formatted text or as an image.

## 8. Running Locally
```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
A `LOVABLE_API_KEY` environment variable is required for AI generation.

## 9. Limitations & Future Ideas
- Always check AI content before using it in class.
- Future ideas: save past worksheets, user accounts, export to Word, and question banks per topic.

## 10. Credits
Built by Tebogo Rakoto with [Lovable](https://lovable.dev).
