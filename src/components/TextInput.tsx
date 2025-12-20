import React from 'react';
import { LucideIcon } from 'lucide-react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  type?: 'text' | 'email' | 'tel' | 'url' | 'number';
  maxLength?: number;
  icon?: LucideIcon;
  className?: string;
}

const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  placeholder = '',
  required = false,
  disabled = false,
  type = 'text',
  maxLength,
  icon: Icon,
  className = '',
}) => {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-500 pointer-events-none z-10" />
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        className={`
          w-full 
          ${Icon ? 'pl-11' : 'pl-4'} 
          pr-4 
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
          ${className}
        `}
      />
    </div>
  );
};

export default TextInput;
