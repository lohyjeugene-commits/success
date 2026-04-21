type DisplayNameFieldProps = {
  currentDisplayName?: string | null;
  inputId: string;
};

export function DisplayNameField({
  currentDisplayName,
  inputId,
}: DisplayNameFieldProps) {
  if (currentDisplayName) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        Joining as <span className="font-semibold">{currentDisplayName}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-slate-700"
      >
        Display Name
      </label>
      <input
        id={inputId}
        name="display_name"
        type="text"
        required
        placeholder="Ethan"
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />
      <p className="text-xs text-slate-500">
        You only need to enter this once. We&apos;ll reuse it on later visits.
      </p>
    </div>
  );
}
