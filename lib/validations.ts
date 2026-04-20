import { z } from "zod";

// ── Helpers ──────────────────────────────────────

/** FormData → plain object → Zod validation */
export function parseFormData<T>(
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  formData: FormData,
):
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors: Record<string, string> } {
  const raw: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    raw[key] = value;
  });
  const result = schema.safeParse(raw);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "_";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    const msg = result.error.issues.map((i) => i.message).join(", ");
    return { success: false, error: msg, fieldErrors };
  }
  return { success: true, data: result.data };
}

const csvToArray = z
  .string()
  .default("")
  .transform((s) => s.split(",").map((v) => v.trim()).filter(Boolean));

const optionalString = z
  .string()
  .optional()
  .transform((s) => (s?.trim() ? s.trim() : null));

const optionalUrl = z
  .string()
  .optional()
  .transform((s) => {
    const v = s?.trim();
    if (!v) return null;
    return v;
  });

const positiveInt = z
  .union([z.string(), z.number()])
  .transform((v) => Number(v) || null)
  .pipe(z.number().int().positive().nullable());

const optionalPositiveInt = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => {
    const n = Number(v);
    return n > 0 ? n : null;
  });

// ── Profile Schemas ──────────────────────────────

export const updateBasicSchema = z.object({
  display_name: z.string().min(1, "表示名は必須です").max(50),
  handle: z.string().regex(/^[a-z0-9_]{3,20}$/, "ハンドルは英小文字・数字・_の3〜20文字"),
  tagline: optionalString,
  bio: optionalString,
  skills: csvToArray,
  hourly_rate: optionalPositiveInt,
  location: optionalString,
  years_experience: optionalPositiveInt,
  languages: csvToArray,
  service_areas: csvToArray,
  availability: z.enum(["available", "busy", "limited", "unavailable"]).default("available"),
  work_hours: optionalString,
  github_username: z
    .string()
    .optional()
    .transform((s) => (s?.trim() ? s.trim().replace(/^@/, "") : null)),
  moai_badge_display: z
    .union([z.literal("on"), z.string(), z.undefined()])
    .transform((v) => v === "on"),
  region: z
    .union([z.literal("okinawa"), z.literal("fukuoka"), z.literal("other"), z.literal("")])
    .optional()
    .transform((v) => (v === "" || !v ? null : v)),
});
export type UpdateBasicInput = z.infer<typeof updateBasicSchema>;

export const updateSocialSchema = z.object({
  twitter: optionalString,
  instagram: optionalString,
  github: optionalString,
  linkedin: optionalUrl,
  behance: optionalUrl,
  youtube: optionalUrl,
  tiktok: optionalString,
  website: optionalUrl,
});
export type UpdateSocialInput = z.infer<typeof updateSocialSchema>;

export const addPortfolioSchema = z.object({
  title: z.string().min(1, "タイトルは必須です").max(200),
  description: optionalString,
  image_url: optionalUrl,
  external_url: optionalUrl,
  tags: csvToArray,
  client_name: optionalString,
  completed_at: optionalString,
});

export const addWorkExpSchema = z.object({
  company: z.string().min(1, "会社名は必須です"),
  title: z.string().min(1, "役職は必須です"),
  description: optionalString,
  start_date: z.string().min(1, "開始日は必須です"),
  end_date: optionalString,
  is_current: z.union([z.literal("on"), z.string(), z.undefined()])
    .transform((v) => v === "on"),
});

export const addEducationSchema = z.object({
  school: z.string().min(1, "学校名は必須です"),
  degree: optionalString,
  field: optionalString,
  start_date: optionalString,
  end_date: optionalString,
});

export const addCertificationSchema = z.object({
  name: z.string().min(1, "資格名は必須です"),
  issuer: optionalString,
  issued_date: optionalString,
  credential_url: optionalUrl,
});

// ── Job Schemas ──────────────────────────────────

export const createJobSchema = z.object({
  title: z.string().min(1, "タイトルは必須です").max(100),
  description: z.string().min(1, "説明は必須です"),
  category: z.string().default("other"),
  skills: csvToArray,
  budget_min: optionalPositiveInt,
  budget_max: optionalPositiveInt,
  budget_type: z.enum(["fixed", "hourly"]).default("fixed"),
  deadline: optionalString,
});

export const createProposalSchema = z.object({
  cover_letter: z.string().min(10, "メッセージは10文字以上で入力してください"),
  proposed_amount_jpy: z.number().int().positive("提案金額は1円以上です"),
  proposed_days: z.number().int().positive().nullable().optional(),
});

// ── Contract Schemas ─────────────────────────────

export const acceptProposalSchema = z.object({
  proposal_id: z.string().uuid("無効な応募IDです"),
});

export const approveDeliverableSchema = z.object({
  deliverable_id: z.string().uuid("無効な成果物IDです"),
});

export const requestRevisionSchema = z.object({
  deliverable_id: z.string().uuid("無効な成果物IDです"),
  revision_note: z.string().min(1, "修正内容を入力してください"),
});

// ── Onboarding Schemas ───────────────────────────

export const onboardingStep1Schema = z.object({
  display_name: z.string().min(1, "表示名は必須です").max(50),
  handle: z.string().regex(/^[a-z0-9_]{3,20}$/, "英小文字・数字・_の3〜20文字"),
  tagline: optionalString,
});

export const onboardingStep2Schema = z.object({
  skills: csvToArray,
  bio: optionalString,
  role: z.enum(["both", "worker_only", "client_only"]).default("both"),
});

// ── AI Schemas ───────────────────────────────────

export const draftJobInputSchema = z.object({
  idea: z.string().min(5, "アイデアを5文字以上で入力してください").max(2000),
});

export const draftProposalInputSchema = z.object({
  jobId: z.string().uuid(),
});

// ── Delete Schemas ───────────────────────────────

export const deleteByIdSchema = z.object({
  id: z.string().uuid("無効なIDです"),
});

// ── Review Schema ────────────────────────────────

export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: optionalString,
});

// ── Credit Purchase ──────────────────────────────

export const creditCheckoutSchema = z.object({
  packageId: z.string().min(1, "パッケージIDは必須です"),
});

// ── Post Schema ──────────────────────────────────

export const createPostSchema = z.object({
  kind: z.enum(["discussion", "question", "showcase"]).default("discussion"),
  title: z.string().min(1, "タイトルは必須です").max(200),
  body: z.string().min(1, "本文は必須です"),
  tags: csvToArray,
});

// ── Refund Schema ────────────────────────────────

export const refundContractSchema = z.object({
  contract_id: z.string().uuid("無効な契約IDです"),
  reason: z.string().min(1, "返金理由は必須です").max(500),
});

// ── Invoice Schema ───────────────────────────────

export const createInvoiceSchema = z.object({
  recipient_handle: z
    .string()
    .min(1, "宛先ハンドルは必須です")
    .regex(/^[a-z0-9_]{3,20}$/, "宛先はハンドル形式（英小文字・数字・_の3〜20文字）で入力してください"),
  subject: z.string().min(1, "件名は必須です").max(200),
  amount: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .pipe(z.number().int().positive("金額は1円以上で入力してください")),
  tax_rate: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      const n = Number(v);
      return isFinite(n) && n >= 0 ? n : 10;
    }),
  due_date: optionalString,
  notes: optionalString,
});
