import React, { useState, useEffect } from 'react';
import { Heart, Gift, Baby, Cake, Calendar, Trash2, X } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date: string;
  type: 'dating' | 'wedding' | 'birthday' | 'child_birth' | 'child_birthday' | 'anniversary' | 'custom';
  description?: string;
  location?: string;
  icon?: React.ReactNode;
  color: string;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<Event, 'id'>) => void;
  onUpdate?: (id: string, event: Omit<Event, 'id'>) => void;
  onDelete?: (id: string) => void;
  theme: any;
  editingEvent?: Event | null;
}

const eventTypes = [
  {
    type: 'dating' as const,
    label: 'Started Dating',
    icon: <Heart className="w-5 h-5" />,
    color: '#ec4899',
    placeholder: 'The day we became official'
  },
  {
    type: 'wedding' as const,
    label: 'Wedding Day',
    icon: <Gift className="w-5 h-5" />,
    color: '#f59e0b',
    placeholder: 'Our special wedding day'
  },
  {
    type: 'birthday' as const,
    label: 'Birthday',
    icon: <Cake className="w-5 h-5" />,
    color: '#8b5cf6',
    placeholder: 'Birthday celebration'
  },
  {
    type: 'child_birth' as const,
    label: 'Child Birth',
    icon: <Baby className="w-5 h-5" />,
    color: '#06b6d4',
    placeholder: 'Welcome to the world'
  },
  {
    type: 'child_birthday' as const,
    label: "Child's Birthday",
    icon: <Baby className="w-5 h-5" />,
    color: '#10b981',
    placeholder: "Child's birthday"
  },
  {
    type: 'anniversary' as const,
    label: 'Anniversary',
    icon: <Heart className="w-5 h-5" />,
    color: '#ef4444',
    placeholder: 'Special anniversary'
  },
  {
    type: 'custom' as const,
    label: 'Custom Event',
    icon: <Calendar className="w-5 h-5" />,
    color: '#6366f1',
    placeholder: 'Custom special moment'
  }
];

const EventModal: React.FC<EventModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onUpdate, 
  onDelete, 
  theme, 
  editingEvent 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    type: 'custom' as 'dating' | 'wedding' | 'birthday' | 'child_birth' | 'child_birthday' | 'anniversary' | 'custom',
    description: '',
    location: ''
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEditing = !!editingEvent;

  useEffect(() => {
    if (editingEvent) {
      setFormData({
        title: editingEvent.title,
        date: editingEvent.date,
        type: editingEvent.type,
        description: editingEvent.description || '',
        location: editingEvent.location || ''
      });
    } else {
      setFormData({
        title: '',
        date: '',
        type: 'custom',
        description: '',
        location: ''
      });
    }
    setShowDeleteConfirm(false);
  }, [editingEvent, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.date) {
      return;
    }

    const selectedType = eventTypes.find(t => t.type === formData.type);
    
    const eventData: Omit<Event, 'id'> = {
      title: formData.title,
      date: formData.date,
      type: formData.type,
      description: formData.description,
      location: formData.location,
      icon: selectedType?.icon || <Calendar className="w-5 h-5" />,
      color: selectedType?.color || '#6366f1'
    };

    if (isEditing && onUpdate && editingEvent) {
      onUpdate(editingEvent.id, eventData);
    } else {
      onSave(eventData);
    }
    
    // Reset form
    setFormData({
      title: '',
      date: '',
      type: 'custom',
      description: '',
      location: ''
    });
    
    onClose();
  };

  const handleDelete = () => {
    if (editingEvent && onDelete) {
      onDelete(editingEvent.id);
      onClose();
    }
  };

  const handleTypeChange = (type: typeof formData.type) => {
    const selectedType = eventTypes.find(t => t.type === type);
    setFormData(prev => ({
      ...prev,
      type,
      title: prev.title || selectedType?.placeholder || ''
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: theme.colors.cardBg }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: theme.colors.border }}>
          <h2 className="text-xl font-bold" style={{ color: theme.colors.textPrimary }}>
            {isEditing ? 'Edit Event' : 'Add Special Event'}
          </h2>
          <div className="flex items-center space-x-2">
            {isEditing && onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-lg hover:bg-red-50 transition-colors text-red-500"
                title="Delete Event"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: theme.colors.textSecondary }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="p-6 border-b bg-red-50" style={{ borderColor: theme.colors.border }}>
            <div className="text-center">
              <p className="mb-4 text-red-600 font-medium">Are you sure you want to delete this event?</p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 flex-1 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white flex-1 hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Event Type Selection */}
          <div className="form-group">
            <label className="form-label" style={{ color: theme.colors.textSecondary }}>
              Event Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {eventTypes.map((eventType) => (
                <button
                  key={eventType.type}
                  type="button"
                  onClick={() => handleTypeChange(eventType.type)}
                  className={`p-3 rounded-xl border flex items-center space-x-2 transition-all duration-300 ${
                    formData.type === eventType.type ? 'shadow-md' : 'hover:shadow-sm'
                  }`}
                  style={{
                    borderColor: formData.type === eventType.type ? eventType.color : theme.colors.border,
                    backgroundColor: formData.type === eventType.type ? eventType.color + '10' : theme.colors.cardBg
                  }}
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: eventType.color + '20', color: eventType.color }}
                  >
                    {eventType.icon}
                  </div>
                  <span style={{ color: theme.colors.textPrimary }}>{eventType.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="form-group">
            <label className="form-label" style={{ color: theme.colors.textSecondary }}>
              Event Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={eventTypes.find(t => t.type === formData.type)?.placeholder}
              className="form-input"
              style={{ 
                borderColor: theme.colors.border,
                '--tw-ring-color': theme.colors.primary + '33'
              } as React.CSSProperties}
              required
            />
          </div>

          {/* Date */}
          <div className="form-group">
            <label className="form-label" style={{ color: theme.colors.textSecondary }}>
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="form-input"
              style={{ 
                borderColor: theme.colors.border,
                '--tw-ring-color': theme.colors.primary + '33'
              } as React.CSSProperties}
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" style={{ color: theme.colors.textSecondary }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add a special note about this moment..."
              rows={3}
              className="form-input resize-none"
              style={{ 
                borderColor: theme.colors.border,
                '--tw-ring-color': theme.colors.primary + '33'
              } as React.CSSProperties}
            />
          </div>

          {/* Location */}
          <div className="form-group">
            <label className="form-label" style={{ color: theme.colors.textSecondary }}>
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Where did this happen?"
              className="form-input"
              style={{ 
                borderColor: theme.colors.border,
                '--tw-ring-color': theme.colors.primary + '33'
              } as React.CSSProperties}
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              style={{ 
                borderColor: theme.colors.border,
                color: theme.colors.textSecondary
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              style={{ background: theme.colors.buttonGradient }}
              disabled={!formData.title || !formData.date}
            >
              {isEditing ? 'Update Event' : 'Save Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
