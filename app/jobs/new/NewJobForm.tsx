"use client";

import { useActionState } from "react";
import { createJob } from "./actions";
import { FieldError } from "@/components/FieldError";
import { FormToast } from "@/components/FormToast";
import { SubmitButton } from "@/components/SubmitButton";

type Category = { slug: string; label: string };

export default function NewJobForm({
  categories,
  assigneeHandle,
  assigneeDisplayName,
}: {
  categories: Category[];
  assigneeHandle?: string | null;
  assigneeDisplayName?: string | null;
}) {
  const [state, action] = useActionState(createJob, null);
  const errors = state && "fieldErrors" in state ? state.fieldErrors : undefined;

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormToast state={state} />
      {assigneeHandle && <input type="hidden" name="assignee_handle" value={assigneeHandle} />}

      {/* ① 基本情報 */}
      <section className="card space-y-5">
        <SectionHeader n={1} title="基本情報" desc="案件の概要を入力します" />
        <div>
          <label htmlFor="title" className="label">
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            required
            maxLength={100}
            className={`input ${errors?.title ? "input-error" : ""}`}
            placeholder="例: コーポレートサイトのLP制作をお願いします"
            aria-invalid={errors?.title ? "true" : undefined}
            aria-describedby={errors?.title ? "title-error" : undefined}
          />
          <p className="mt-1 text-xs text-moai-muted">100文字以内。具体的に書くほど応募が集まりやすくなります</p>
          <FieldError errors={errors} name="title" />
        </div>
        <div>
          <label htmlFor="category" className="label">カテゴリ</label>
          <select id="category" name="category" className="input">
            {categories?.map((c) => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>
        </div>
      </section>

      {/* ② 詳細・スキル */}
      <section className="card space-y-5">
        <SectionHeader n={2} title="詳細・スキル" desc="求める成果物・スキル・進め方を記載" />
        <div>
          <label htmlFor="description" className="label">
            詳細説明 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={9}
            className={`input ${errors?.description ? "input-error" : ""}`}
            placeholder={`例:\n・目的: 新サービスのリード獲得LP\n・対象: 中小企業の経営者\n・分量: 1ページ (FV+特徴3つ+導入事例+お問い合わせ)\n・希望: スマホ対応・お問い合わせフォーム連携\n・参考: https://...`}
            aria-invalid={errors?.description ? "true" : undefined}
            aria-describedby={errors?.description ? "description-error" : undefined}
          />
          <FieldError errors={errors} name="description" />
        </div>
        <div>
          <label htmlFor="skills" className="label">希望スキル (カンマ区切り)</label>
          <input id="skills" name="skills" className="input" placeholder="React, Figma, SEO" />
          <p className="mt-1 text-xs text-moai-muted">マッチするスキルを持つワーカーに優先表示されます</p>
        </div>
      </section>

      {/* ③ 予算・期限 */}
      <section className="card space-y-5">
        <SectionHeader n={3} title="予算・期限" desc="ワーカーが応募判断するための情報" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="budget_type" className="label">形態</label>
            <select id="budget_type" name="budget_type" className="input">
              <option value="fixed">固定報酬</option>
              <option value="hourly">時給</option>
            </select>
          </div>
          <div>
            <label htmlFor="deadline" className="label">締切</label>
            <input id="deadline" name="deadline" type="date" className="input" />
          </div>
          <div>
            <label htmlFor="budget_min" className="label">予算 最低 (円)</label>
            <input
              id="budget_min"
              name="budget_min"
              type="number"
              min="0"
              className={`input ${errors?.budget_min ? "input-error" : ""}`}
              placeholder="50000"
              aria-invalid={errors?.budget_min ? "true" : undefined}
            />
            <FieldError errors={errors} name="budget_min" />
          </div>
          <div>
            <label htmlFor="budget_max" className="label">予算 最高 (円)</label>
            <input
              id="budget_max"
              name="budget_max"
              type="number"
              min="0"
              className={`input ${errors?.budget_max ? "input-error" : ""}`}
              placeholder="200000"
              aria-invalid={errors?.budget_max ? "true" : undefined}
            />
            <FieldError errors={errors} name="budget_max" />
          </div>
        </div>
        <p className="text-xs text-moai-muted leading-relaxed bg-moai-cloud/60 rounded-lg p-3">
          💡 発注者の手数料は <strong className="text-moai-ink">4%</strong>。例: 予算10万円なら追加4,000円で計104,000円が請求額となります。
        </p>
      </section>

      {/* ④ 応募者の絞り込み (オプション) */}
      {!assigneeHandle && (
        <section className="card space-y-3">
          <SectionHeader n={4} title="応募者の絞り込み" desc="任意。指定すると応募が制限されます" />
          <label className="flex items-start gap-2 p-3 rounded-lg border border-moai-border hover:bg-moai-cloud cursor-pointer transition-colors">
            <input type="checkbox" name="alumni_only" className="mt-0.5 h-4 w-4 text-moai-primary" />
            <div>
              <div className="text-sm font-medium">🎓 MOAI卒業生からの応募のみ受け付ける</div>
              <div className="text-[11px] text-moai-muted mt-0.5">
                品質担保・手数料5%の卒業生に限定。一般応募を弾きます
              </div>
            </div>
          </label>
          <label className="flex items-start gap-2 p-3 rounded-lg border border-moai-border hover:bg-moai-cloud cursor-pointer transition-colors">
            <input type="checkbox" name="mentor_required" className="mt-0.5 h-4 w-4 text-moai-primary" />
            <div>
              <div className="text-sm font-medium">👨‍🏫 メンター監修つき</div>
              <div className="text-[11px] text-moai-muted mt-0.5">
                在校生・新人受注者の案件で、メンターが品質チェックします
              </div>
            </div>
          </label>
        </section>
      )}

      {assigneeHandle && assigneeDisplayName && (
        <p className="text-xs text-moai-muted text-center">
          📌 この案件は <strong>{assigneeDisplayName}</strong> さんに通知され、本人のみ応募可能になります
        </p>
      )}

      <SubmitButton block pendingLabel="投稿中…">案件を公開する</SubmitButton>
    </form>
  );
}

function SectionHeader({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 -mb-1">
      <div className="step-indicator-num step-indicator-num-active shrink-0 mt-0.5">{n}</div>
      <div className="min-w-0">
        <h2 className="text-base font-bold leading-tight">{title}</h2>
        <p className="text-xs text-moai-muted mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
