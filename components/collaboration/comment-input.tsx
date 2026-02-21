"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/browser";

interface CommentInputProps {
  onSubmit: (content: string, mentions?: string[]) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  initialValue?: string;
  submitLabel?: string;
  isReply?: boolean;
  autoFocus?: boolean;
}

interface UserSuggestion {
  id: string;
  email: string;
}

export function CommentInput({
  onSubmit,
  onCancel,
  placeholder = "Write a comment... (use @ to mention)",
  initialValue = "",
  submitLabel = "Comment",
  isReply = false,
  autoFocus = false,
}: CommentInputProps) {
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // @mention state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const [mentionedUserIds, setMentionedUserIds] = useState<Set<string>>(
    new Set(),
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch user suggestions when mention query changes
  useEffect(() => {
    if (!showMentions || mentionQuery.length < 1) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const fetchUsers = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("profiles")
          .select("id, email")
          .ilike("email", `%${mentionQuery}%`)
          .limit(5);

        if (!cancelled && data) {
          setSuggestions(data as UserSuggestion[]);
          setMentionIndex(0);
        }
      } catch {
        // If profiles table doesn't exist, fall back to empty
        if (!cancelled) setSuggestions([]);
      }
    };

    const debounce = setTimeout(fetchUsers, 200);
    return () => {
      cancelled = true;
      clearTimeout(debounce);
    };
  }, [showMentions, mentionQuery]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setContent(value);

      const cursorPos = e.target.selectionStart;
      // Check if we're in an @mention context
      const textBeforeCursor = value.slice(0, cursorPos);
      const atIndex = textBeforeCursor.lastIndexOf("@");

      if (
        atIndex >= 0 &&
        (atIndex === 0 || /\s/.test(textBeforeCursor[atIndex - 1]))
      ) {
        const query = textBeforeCursor.slice(atIndex + 1);
        if (!query.includes(" ") && query.length <= 50) {
          setShowMentions(true);
          setMentionQuery(query);
          setMentionStart(atIndex);
          return;
        }
      }

      setShowMentions(false);
      setMentionQuery("");
    },
    [],
  );

  const insertMention = useCallback(
    (user: UserSuggestion) => {
      const before = content.slice(0, mentionStart);
      const after = content.slice(
        mentionStart + mentionQuery.length + 1, // +1 for @
      );
      const mention = `@${user.email} `;
      setContent(before + mention + after);
      setMentionedUserIds((prev) => new Set([...prev, user.id]));
      setShowMentions(false);
      setMentionQuery("");

      // Refocus textarea
      setTimeout(() => {
        const pos = before.length + mention.length;
        textareaRef.current?.setSelectionRange(pos, pos);
        textareaRef.current?.focus();
      }, 0);
    },
    [content, mentionStart, mentionQuery],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showMentions || suggestions.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % suggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex(
          (i) => (i - 1 + suggestions.length) % suggestions.length,
        );
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(suggestions[mentionIndex]);
      } else if (e.key === "Escape") {
        setShowMentions(false);
      }
    },
    [showMentions, suggestions, mentionIndex, insertMention],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content, [...mentionedUserIds]);
      setContent("");
      setMentionedUserIds(new Set());
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent(initialValue);
    onCancel?.();
  };

  const charCount = content.length;
  const maxChars = 10000;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <Label htmlFor="comment" className="sr-only">
          {placeholder}
        </Label>
        <Textarea
          ref={textareaRef}
          id="comment"
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={isReply ? 3 : 4}
          className="resize-none"
          autoFocus={autoFocus}
          disabled={isSubmitting}
        />

        {/* @mention suggestions dropdown */}
        {showMentions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute bottom-full left-0 z-20 mb-1 w-64 rounded-md border bg-popover p-1 shadow-md"
          >
            {suggestions.map((user, i) => (
              <button
                key={user.id}
                type="button"
                className={`flex w-full items-center rounded-sm px-2 py-1.5 text-sm ${
                  i === mentionIndex ? "bg-accent text-accent-foreground" : ""
                }`}
                onClick={() => insertMention(user)}
                onMouseEnter={() => setMentionIndex(i)}
              >
                <span className="truncate">{user.email}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {charCount} / {maxChars}
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || isSubmitting || charCount > maxChars}
          >
            {isSubmitting ? "Posting..." : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
