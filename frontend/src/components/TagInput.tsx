import React, { useState, useRef, KeyboardEvent } from 'react';

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const TagInput: React.FC<TagInputProps> = ({
  label,
  value = [],
  onChange,
  placeholder = 'Type and press Enter',
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag || value.includes(tag)) {
      setInputValue('');
      return;
    }
    onChange([...value, tag]);
    setInputValue('');
  }

  function removeTag(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeTag(value.length - 1);
    }
  }

  return (
    <div className="flex flex-col gap-1.5" data-testid={`tag-input-${label.toLowerCase()}`}>
      <label className="text-sm font-medium text-text-primary">
        {label}
      </label>

      <div
        className={`flex flex-wrap gap-2 min-h-[44px] p-2 bg-white border rounded-xl transition-colors ${
          disabled
            ? 'border-blue-grey/30 bg-cream cursor-default'
            : 'border-blue-grey focus-within:border-slate-brand'
        }`}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {value.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            data-testid={`tag-chip-${tag}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sage-light/40 text-text-primary border border-sage-light"
          >
            <span>{tag}</span>
            {!disabled && (
              <button
                type="button"
                data-testid={`remove-tag-${tag}`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(i);
                }}
                className="text-sage-deep hover:text-terracotta leading-none font-bold"
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            )}
          </span>
        ))}

        {!disabled && (
          <input
            ref={inputRef}
            type="text"
            data-testid={`tag-text-input-${label.toLowerCase()}`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => inputValue.trim() && addTag(inputValue)}
            placeholder={value.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[140px] text-sm outline-none bg-transparent text-text-primary placeholder:text-text-muted"
          />
        )}
      </div>
    </div>
  );
};
