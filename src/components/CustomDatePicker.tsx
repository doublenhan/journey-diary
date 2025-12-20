import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomDatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  theme?: {
    colors: {
      primary?: string;
      border?: string;
    };
  };
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  selected,
  onChange,
  placeholder = 'Select date',
  required = false,
  minDate,
  maxDate,
  theme,
}) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  // Use theme colors if provided, otherwise use default pink
  const primaryColor = theme?.colors?.primary || '#ec4899';
  const borderColor = theme?.colors?.border || '#fbcfe8';
  const iconColor = theme?.colors?.primary || '#ec4899';

  const renderCustomHeader = ({
    date,
    changeYear,
    changeMonth,
    decreaseMonth,
    increaseMonth,
    prevMonthButtonDisabled,
    nextMonthButtonDisabled,
  }: any) => (
    <div className="flex items-center justify-between px-2 py-2 rounded-t-xl" style={{ 
      background: `linear-gradient(135deg, ${primaryColor}08, ${primaryColor}15)` 
    }}>
      <button
        onClick={decreaseMonth}
        disabled={prevMonthButtonDisabled}
        type="button"
        className="p-1 hover:bg-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-5 h-5" style={{ color: primaryColor }} />
      </button>

      <div className="flex gap-2">
        <select
          value={months[date.getMonth()]}
          onChange={({ target: { value } }) => changeMonth(months.indexOf(value))}
          className="text-sm font-medium px-3 py-1.5 rounded-lg border-2 bg-white text-gray-700 focus:outline-none focus:ring-2 transition-all cursor-pointer"
          style={{ 
            borderColor: borderColor,
            '--tw-ring-color': `${primaryColor}33`
          } as React.CSSProperties}
        >
          {months.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          value={date.getFullYear()}
          onChange={({ target: { value } }) => changeYear(parseInt(value))}
          className="text-sm font-medium px-3 py-1.5 rounded-lg border-2 bg-white text-gray-700 focus:outline-none focus:ring-2 transition-all cursor-pointer"
          style={{ 
            borderColor: borderColor,
            '--tw-ring-color': `${primaryColor}33`
          } as React.CSSProperties}
        >
          {years.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={increaseMonth}
        disabled={nextMonthButtonDisabled}
        type="button"
        className="p-1 hover:bg-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-5 h-5" style={{ color: primaryColor }} />
      </button>
    </div>
  );

  return (
    <div className="custom-datepicker-wrapper" style={{
      '--datepicker-primary': primaryColor,
      '--datepicker-border': borderColor,
    } as React.CSSProperties}>
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none z-10" style={{ color: iconColor }} />
        <DatePicker
          selected={selected}
          onChange={onChange}
          dateFormat="dd-MMM-yyyy"
          placeholderText={placeholder}
          required={required}
          minDate={minDate}
          maxDate={maxDate}
          renderCustomHeader={renderCustomHeader}
          showPopperArrow={false}
          className="custom-datepicker-input w-full pl-11 pr-4 py-3 rounded-xl border-2 bg-white text-gray-900 focus:outline-none focus:ring-4 transition-all"
          calendarClassName="custom-calendar shadow-2xl border-2 rounded-xl"
          wrapperClassName="w-full"
        />
      </div>
    </div>
  );
};

export default CustomDatePicker;
