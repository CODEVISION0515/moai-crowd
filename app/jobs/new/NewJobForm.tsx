"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createJob } from "./actions";
import { FieldError } from "@/components/FieldError";
import { FormToast } from "@/components/FormToast";

type Category = { slug: string; label: string };

export default function NewJobForm({ categories }: { categories: Category[] }) {
  const [state, action] = useActionState(createJob, null);
  const errors = state && "fieldErrors" in state ? state.fieldErrors : undefined;

  return (
    <form action={action} className="card space-y-5" noValidate>
      <FormToast state={state} />
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
          placeholder="例: LP制作をお願いします"
          aria-invalid={errors?.title ? "true" : undefined}
          aria-describedby={errors?.title ? "title-error" : undefined}
        />
        <FieldError errors={errors} name="title" />
      </div>
      <div>
        <label htmlFor="description" className="label">
          詳細説明 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={8}
          className={`input ${errors?.description ? "input-error" : ""}`}
          placeholder="目的・対象・納期・求めるスキルなど"
          aria-invalid={errors?.description ? "true" : undefined}
          aria-describedby={errors?.description ? "description-error" : undefined}
        />
        <FieldError errors={errors} name="description" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="label">カテゴリ</label>
          <select id="category" name="category" className="input">
            {categories?.map((c) => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="budget_type" className="label">形態</label>
          <select id="budget_type" name="budget_type" className="input">
            <option value="fixed">固定報酬</option>
            <option value="hourly">時給</option>
          </select>
        </div>
        <div>
          <label htmlFor="budget_min" className="label">予算 最低 (円)</label>
          <input
            id="budget_min"
            name="budget_min"
            type="number"
            min="0"
            className={`input ${errors?.budget_min ? "input-error" : ""}`}
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
            aria-invalid={errors?.budget_max ? "true" : undefined}
          />
          <FieldError errors={errors} name="budget_max" />
        </div>
        <div>
          <label htmlFor="skills" className="label">希望スキル (カンマ区切り)</label>
          <input id="skills" name="skills" className="input" placeholder="React, Figma, SEO" />
        </div>
        <div>
          <label htmlFor="deadline" className="label">締切</label>
          <input id="deadline" name="deadline" type="date" className="input" />
        </div>
      </div>
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? "投稿中…" : "案件を公開する"}
    </button>
  );
}
