import { Mail, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * Collects email addresses to invite to a group. This is ONLY for people the
 * user can't add directly from the members dropdown (not in the system, or in
 * the system but outside the user's access). Directly-addable users go through
 * <AsyncMultiSelectUsers/> instead. The parent owns the email list.
 */
export default function GroupInviteEmails({
  emails,
  onChange,
  disabled
}: {
  emails: string[];
  onChange: (emails: string[]) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");

  const addEmail = () => {
    const email = value.trim().toLowerCase();
    if (!isValidEmail(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (emails.includes(email)) {
      toast.error("That email is already added");
      setValue("");
      return;
    }
    onChange([...emails, email]);
    setValue("");
  };

  const removeEmail = (email: string) =>
    onChange(emails.filter((e) => e !== email));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="email"
            placeholder="Invite by email"
            className="pl-9"
            value={value}
            disabled={disabled}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addEmail();
              }
            }}
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="gap-1"
          disabled={disabled}
          onClick={addEmail}
        >
          <Plus className="h-3.5 w-3.5" />
          Invite
        </Button>
      </div>

      {emails.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {emails.map((email) => (
            <Badge
              key={email}
              variant="outline"
              className="flex items-center gap-1 text-blue-600 border-blue-200"
            >
              <Mail className="h-3 w-3" />
              {email}
              <button
                type="button"
                onClick={() => removeEmail(email)}
                className="ml-1 hover:text-red-500"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      {emails.length > 0 && (
        <p className="text-xs text-gray-400">
          People not in your list will get an email invite to join this group.
        </p>
      )}
    </div>
  );
}
