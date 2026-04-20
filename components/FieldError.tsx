/**
 * フォーム項目のエラーメッセージ表示。
 * Server Action の ActionResult.fieldErrors を受け取って表示。
 */
export function FieldError({
  errors,
  name,
}: {
  errors?: Record<string, string>;
  name: string;
}) {
  const msg = errors?.[name];
  if (!msg) return null;
  return (
    <p id={`${name}-error`} className="mt-1 text-xs text-red-600" role="alert">
      {msg}
    </p>
  );
}
