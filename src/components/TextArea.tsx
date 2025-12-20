import React from 'react';

interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  rows?: number;
  showCounter?: boolean;
  className?: string;
}

const TextArea: React.FC<TextAreaProps> = ({
  value,
  onChange,
  placeholder = '',
  required = false,
  disabled = false,
  maxLength,
  rows = 4,
  showCounter = false,
  className = '',
}) => {
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        rows={rows}
        className={`
          w-full 
          px-4 
          py-3 
          rounded-xl 
          border-2 
          border-pink-200 
          bg-white 
          text-gray-900 
          placeholder-gray-400
          focus:outline-none 
          focus:border-pink-400 
          focus:ring-4 
          focus:ring-pink-100 
          disabled:bg-gray-100 
          disabled:cursor-not-allowed 
          disabled:opacity-60
          transition-all 
          duration-200
          resize-none
          ${className}
        `}
      />
      {showCounter && maxLength && (
        <div className="absolute bottom-3 right-3 text-xs text-gray-400">
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  );
};

export default TextArea;
