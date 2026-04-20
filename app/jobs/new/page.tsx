import { createClient } from "@/lib/supabase/server";
import AIDraftPanel from "./AIDraftPanel";
import NewJobForm from "./NewJobForm";

export default async function NewJobPage() {
  const sb = await createClient();
  const { data: categories } = await sb
    .from("categories")
    .select("slug, label")
    .order("sort_order");
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">案件を投稿する</h1>
      <AIDraftPanel />
      <NewJobForm categories={categories ?? []} />
    </div>
  );
}
