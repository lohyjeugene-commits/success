import { SINGAPORE_AREAS } from "@/lib/constants/singapore-areas";
import { ActivityPicker } from "./activity-picker";

type GroupFormProps = {
  errorMessage?: string;
  message?: string;
  redirectTo: string;
  submitAction: (formData: FormData) => void | Promise<void>;
  submitLabel?: string;
};

const maxMemberOptions = [2, 3, 4, 5, 6, 8, 10];

export function GroupForm({
  errorMessage,
  message,
  redirectTo,
  submitAction,
  submitLabel = "Create Group",
}: GroupFormProps) {
  return (
    <form action={submitAction} className="mt-6 space-y-5">
      <input type="hidden" name="redirect_to" value={redirectTo} />
      <input type="hidden" name="success_key" value="message" />
      <input type="hidden" name="error_key" value="error" />

      <div className="space-y-3">
        {message && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="title"
          className="block text-sm font-medium text-slate-700"
        >
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          placeholder="Morning Basketball Run"
          required
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <ActivityPicker />

      <div className="space-y-2">
        <label
          htmlFor="area"
          className="block text-sm font-medium text-slate-700"
        >
          Area
        </label>
        <select
          id="area"
          name="area"
          required
          defaultValue=""
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="" disabled>
            Select an area
          </option>
          {SINGAPORE_AREAS.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="max_members"
          className="block text-sm font-medium text-slate-700"
        >
          Max Members
        </label>
        <select
          id="max_members"
          name="max_members"
          defaultValue="6"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          {maxMemberOptions.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="inline-flex items-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        {submitLabel}
      </button>
    </form>
  );
}
