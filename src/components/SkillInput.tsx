/**
 * Skill entry: free text with suggestions from the shared vocabulary.
 *
 * Deliberately *not* a closed picker. The backend creates unknown skills on
 * demand, so a recruiter must be able to type one the seed never anticipated.
 * Suggestions exist to steer them toward the canonical spelling - which keeps
 * the vocabulary clean and matching accurate - without ever blocking input.
 *
 * Aliases are resolved server-side, so typing "reactjs" here is correct and
 * will come back as "React".
 */

import { X } from "lucide-react";
import { useState } from "react";
import { useListSkillsQuery } from "@/app/api";
import { Input } from "@/components/ui";

export function SkillInput({
  value,
  onChange,
  invalid,
}: {
  value: string[];
  onChange: (skills: string[]) => void;
  invalid?: boolean;
}) {
  const [draft, setDraft] = useState("");

  const { data } = useListSkillsQuery(
    { q: draft.trim(), page_size: 6 },
    { skip: draft.trim().length < 2 },
  );

  const alreadyAdded = (name: string) =>
    value.some((existing) => existing.toLowerCase() === name.toLowerCase());

  const suggestions = (data?.items ?? []).filter((skill) => !alreadyAdded(skill.name));

  function add(name: string) {
    const cleaned = name.trim();
    if (!cleaned || alreadyAdded(cleaned)) {
      setDraft("");
      return;
    }
    onChange([...value, cleaned]);
    setDraft("");
  }

  function remove(index: number) {
    onChange(value.filter((_, position) => position !== index));
  }

  return (
    <div>
      <div
        className={`rounded-lg bg-white px-2 py-2 ring-1 ring-inset ${
          invalid ? "ring-rose-400" : "ring-slate-300"
        }`}
      >
        {value.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5 px-1">
            {value.map((skill, index) => (
              <span
                key={`${skill}-${index}`}
                className="inline-flex items-center gap-1 rounded-md bg-brand-50 py-1 pl-2 pr-1 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-100"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Remove ${skill}`}
                  className="rounded p-0.5 hover:bg-brand-100"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
        <Input
          value={draft}
          placeholder={value.length ? "Add another skill…" : "e.g. Python, then press Enter"}
          className="border-0 ring-0 focus:ring-0"
          aria-label="Add a skill"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // Enter and comma both commit; Backspace on an empty box removes
            // the last chip, which is the convention people expect here.
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              add(draft);
            } else if (event.key === "Backspace" && !draft && value.length) {
              remove(value.length - 1);
            }
          }}
          onBlur={() => draft.trim() && add(draft)}
        />
      </div>

      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500">Suggestions:</span>
          {suggestions.map((skill) => (
            <button
              key={skill.id}
              type="button"
              onClick={() => add(skill.name)}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
            >
              {skill.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
