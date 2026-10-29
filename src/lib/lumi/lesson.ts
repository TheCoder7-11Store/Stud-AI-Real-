import { z } from "zod";

export const boardActionSchema = z.object({
  id: z.string(),
  kind: z.enum(["note", "equation", "rect", "ellipse", "arrow", "line", "label", "highlight", "erase", "clear"]),
  text: z.string(),
  x: z.number(), y: z.number(), x2: z.number(), y2: z.number(),
  target: z.string(),
}).strict();
export const lessonStepSchema = z.object({
  title: z.string(), narration: z.string(),
  actions: z.array(boardActionSchema),
  question: z.string().nullable(),
}).strict();
export const lessonSchema = z.object({ title: z.string(), steps: z.array(lessonStepSchema) }).strict();
export type BoardAction = z.infer<typeof boardActionSchema>;
export type LessonStep = z.infer<typeof lessonStepSchema>;
export type Lesson = z.infer<typeof lessonSchema>;

export function applyBoardAction(board: BoardAction[], action: BoardAction): BoardAction[] {
  if (action.kind === "clear") return [];
  if (action.kind === "erase") return board.filter(item => item.id !== action.target);
  if (action.kind === "highlight") return [...board.filter(item => item.id !== action.id), action];
  return [...board.filter(item => item.id !== action.id), action];
}
export function lessonTranscript(lesson: Lesson) {
  return `# ${lesson.title}\n\n` + lesson.steps.map(step =>
    `## ${step.title}\n${step.narration}\n${step.actions.filter(a => a.kind === "note" || a.kind === "equation").map(a => a.kind === "equation" ? `$$${a.text}$$` : `- ${a.text}`).join("\n")}\n${step.question ? `Quick check: ${step.question}` : ""}`
  ).join("\n\n");
}