import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { BookOpenCheck, ClipboardList, GraduationCap, ImageIcon, Lightbulb, Printer, Square } from "lucide-react";

import { Markdown } from "@/lib/markdown";
import { streamImage } from "@/lib/stream-image";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Teacher Mate — worksheets, memos, lesson plans & explanations" },
      {
        name: "description",
        content:
          "Teacher Mate generates CAPS-style worksheets with memos, lesson plans, concept explanations and classroom diagrams for Grades 4 to 12, in any subject.",
      },
      { property: "og:title", content: "Teacher Mate — AI teaching assistant" },
      {
        property: "og:description",
        content: "Generate worksheets with memos, lesson plans, explanations and diagrams for Grades 4 to 12.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TeacherMate,
});

type Mode = "worksheet" | "lesson-plan" | "explanation" | "image";

const MODES: { id: Mode; label: string; hint: string; icon: typeof BookOpenCheck }[] = [
  { id: "worksheet", label: "Worksheet + Memo", hint: "Questions with a full answer key", icon: ClipboardList },
  { id: "lesson-plan", label: "Lesson Plan", hint: "Phases, timing, activities", icon: BookOpenCheck },
  { id: "explanation", label: "Explain a Concept", hint: "Step by step with examples", icon: Lightbulb },
  { id: "image", label: "Diagram / Picture", hint: "A visual aid for the topic", icon: ImageIcon },
];

const GRADES = ["Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];

const SUBJECTS = [
  "Mathematics",
  "Mathematical Literacy",
  "Natural Sciences",
  "Physical Sciences",
  "Life Sciences",
  "Technology",
  "Social Sciences (History)",
  "Social Sciences (Geography)",
  "Geography",
  "History",
  "English Home Language",
  "English First Additional Language",
  "Afrikaans",
  "isiZulu",
  "Sepedi",
  "Setswana",
  "Life Orientation",
  "Life Skills",
  "Economics",
  "Accounting",
  "Business Studies",
  "Economic and Management Sciences",
  "Computer Applications Technology",
  "Information Technology",
  "Agricultural Sciences",
  "Tourism",
  "Creative Arts",
  "Other",
];

const DIFFICULTIES = ["Foundation (easier)", "Grade level", "Challenging", "Exam standard"];
const LANGUAGES = ["English", "Afrikaans", "isiZulu", "Sepedi", "Setswana", "isiXhosa"];

const fieldClass =
  "w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25";
const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted-foreground";

function TeacherMate() {
  const [mode, setMode] = useState<Mode>("worksheet");
  const [grade, setGrade] = useState("Grade 7");
  const [subject, setSubject] = useState("Mathematics");
  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState("Grade level");
  const [language, setLanguage] = useState("English");
  const [notes, setNotes] = useState("");

  const [text, setText] = useState("");
  const [image, setImage] = useState<{ url: string; final: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = () => abortRef.current?.abort();

  async function generate() {
    if (!topic.trim()) {
      setError("Please type a topic first, for example “equivalent fractions” or “photosynthesis”.");
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError(null);
    setText("");
    setImage(null);

    try {
      if (mode === "image") {
        const prompt = `A clean, labelled educational classroom diagram for ${grade} ${subject}, topic: ${topic}. ${
          notes || ""
        } Clear printable style on a white background, accurate labels in ${language}, no watermarks, suitable for a school worksheet.`;
        await streamImage(
          "/api/generate-image",
          { prompt },
          (url, final) => setImage({ url, final }),
          controller.signal,
        );
      } else {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: mode,
            grade,
            subject,
            topic,
            questionCount,
            difficulty,
            language,
            notes,
          }),
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          throw new Error((await response.text().catch(() => "")) || "Generation failed.");
        }
        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        let acc = "";
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          acc += chunk.value;
          setText(acc);
        }
        if (!acc.trim()) throw new Error("The AI returned nothing. Please try again.");
      }
    } catch (caught) {
      if (!(caught instanceof Error) || caught.name !== "AbortError") {
        setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  const hasOutput = Boolean(text || image);

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-5">
          <span className="flex size-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <GraduationCap className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl leading-tight font-bold">Teacher Mate</h1>
            <p className="text-sm opacity-80">
              Worksheets, memos, lesson plans, explanations and diagrams — any subject, Grades 4–12.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[22rem_1fr]">
        <section className="no-print space-y-4 rounded-lg border border-border bg-card p-4">
          <div>
            <span className={labelClass}>What do you need?</span>
            <div className="grid grid-cols-2 gap-2">
              {MODES.map((item) => {
                const Icon = item.icon;
                const active = mode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMode(item.id)}
                    className={`rounded-md border p-2.5 text-left transition ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/40 hover:bg-secondary"
                    }`}
                  >
                    <Icon className="mb-1 size-4" />
                    <span className="block text-sm font-bold leading-tight">{item.label}</span>
                    <span className={`block text-xs ${active ? "opacity-80" : "text-muted-foreground"}`}>
                      {item.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="grade">
                Grade
              </label>
              <select id="grade" className={fieldClass} value={grade} onChange={(e) => setGrade(e.target.value)}>
                {GRADES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="language">
                Language
              </label>
              <select
                id="language"
                className={fieldClass}
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {LANGUAGES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="subject">
              Subject
            </label>
            <select id="subject" className={fieldClass} value={subject} onChange={(e) => setSubject(e.target.value)}>
              {SUBJECTS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="topic">
              Topic
            </label>
            <input
              id="topic"
              className={fieldClass}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. equivalent fractions, photosynthesis, the Great Trek"
            />
          </div>

          {mode !== "image" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="count">
                  Questions
                </label>
                <input
                  id="count"
                  type="number"
                  min={1}
                  max={40}
                  className={fieldClass}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Math.max(1, Math.min(40, Number(e.target.value) || 1)))}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="difficulty">
                  Level
                </label>
                <select
                  id="difficulty"
                  className={fieldClass}
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  {DIFFICULTIES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className={labelClass} htmlFor="notes">
              Anything else? (optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              className={fieldClass}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. include word problems about taxi fares, 45 minute lesson, no calculators"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={generate}
              disabled={busy}
              className="flex-1 rounded-md bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground transition hover:brightness-95 disabled:opacity-60"
            >
              {busy ? "Generating…" : "Generate"}
            </button>
            {busy && (
              <button
                type="button"
                onClick={stop}
                className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2.5 text-sm font-bold text-foreground transition hover:bg-secondary"
              >
                <Square className="size-3.5" /> Stop
              </button>
            )}
          </div>
        </section>

        <section className="min-w-0">
          {error && (
            <p className="no-print mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}

          {hasOutput && (
            <div className="no-print mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-md border border-input bg-card px-3 py-2 text-sm font-bold text-foreground transition hover:bg-secondary"
              >
                <Printer className="size-4" /> Print / Save as PDF
              </button>
            </div>
          )}

          <div className="print-sheet rounded-lg border border-border bg-card p-6">
            {!hasOutput && !busy && (
              <div className="py-16 text-center">
                <GraduationCap className="mx-auto mb-3 size-10 text-muted-foreground" />
                <h2 className="text-lg font-bold">Your teaching material appears here</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Choose what you need, pick a grade and subject, type any topic, and Teacher Mate writes the full
                  content — including the answer memo.
                </p>
              </div>
            )}

            {busy && !hasOutput && (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Teacher Mate is writing your {MODES.find((m) => m.id === mode)?.label.toLowerCase()}…
              </p>
            )}

            {image && (
              <img
                src={image.url}
                alt={`${subject} diagram about ${topic}`}
                className={`mx-auto w-full max-w-xl rounded-md transition-[filter] duration-500 ${
                  image.final ? "blur-0" : "blur-2xl"
                }`}
              />
            )}

            {text && <Markdown text={text} />}
          </div>
        </section>
      </main>
    </div>
  );
}
