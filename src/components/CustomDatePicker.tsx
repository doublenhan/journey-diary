import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar } from 'lucide-react';

interface CustomDatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  selected,
  onChange,
  placeholder = 'Select date',
  required = false,
  minDate,
  maxDate,
}) => {
  return (
    <div className="custom-datepicker-wrapper">
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-500 pointer-events-none z-10" />
        <DatePicker
          selected={selected}
          onChange={onChange}
          dateFormat="dd-MMM-yyyy"
          placeholderText={placeholder}
          required={required}
          minDate={minDate}
          maxDate={maxDate}
          className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-pink-200 bg-white text-gray-900 focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all"
          calendarClassName="custom-calendar"
          wrapperClassName="w-full"
          showPopperArrow={false}
        />
      </div>
    </div>
  );
};

export default CustomDatePicker;
