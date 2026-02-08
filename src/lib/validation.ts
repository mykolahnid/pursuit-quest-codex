import { z } from "zod";

const integerStringSchema = z
  .string()
  .trim()
  .regex(/^\d+$/, "Enter a whole number.");

const answer1Schema = integerStringSchema
  .transform(Number)
  .pipe(z.number().int().min(1, "Answer 1 must be between 1 and 100.").max(100, "Answer 1 must be between 1 and 100."));

const answer2Schema = integerStringSchema
  .transform(Number)
  .pipe(z.number().int().min(0, "Answer 2 must be between 0 and 100.").max(100, "Answer 2 must be between 0 and 100."));

const participantSchema = z.object({
  answer1: answer1Schema,
  answer2: answer2Schema,
});

const positiveIntegerSchema = integerStringSchema.transform(Number).pipe(z.number().int().min(1));

function formStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export function parseParticipantAnswer1(answer1: string):
  | { success: true; answer1: number }
  | { success: false; message: string } {
  const parsed = answer1Schema.safeParse(answer1);

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  return { success: true, answer1: parsed.data };
}

export function parseParticipantAnswers(formData: FormData):
  | { success: true; data: { answer1: number; answer2: number } }
  | { success: false; message: string } {
  const parsed = participantSchema.safeParse({
    answer1: formStringValue(formData.get("answer1")),
    answer2: formStringValue(formData.get("answer2")),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  return { success: true, data: parsed.data };
}

export function parseRandomDataCount(formData: FormData):
  | { success: true; count: number }
  | { success: false; message: string } {
  const parsed = positiveIntegerSchema.safeParse(formStringValue(formData.get("count")));

  if (!parsed.success) {
    return { success: false, message: "Random row count must be a positive integer." };
  }

  if (parsed.data > 1000) {
    return { success: false, message: "Random row count must be at most 1000." };
  }

  return { success: true, count: parsed.data };
}
