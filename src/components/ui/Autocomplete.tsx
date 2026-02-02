import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Input } from './Input';

export interface AutocompleteOption {
  id: string;
  label: string;
  value: string;
}

interface AutocompleteProps {
  options: AutocompleteOption[];
  value?: string;
  onChange?: (value: string) => void;
  onAddNew?: (value: string) => void;
  placeholder?: string;
  className?: string;
  emptyMessage?: string;
}

export function Autocomplete({
  options,
  value,
  onChange,
  onAddNew,
  placeholder = 'Qidirish...',
  className,
  emptyMessage = 'Ma\'lumot topilmadi'
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedOption, setSelectedOption] = React.useState<AutocompleteOption | null>(
    options.find(opt => opt.value === value) || null
  );

  React.useEffect(() => {
    const option = options.find(opt => opt.value === value);
    setSelectedOption(option || null);
  }, [value, options]);

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(opt =>
      opt.label.toLowerCase().includes(query) ||
      opt.value.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  const handleSelect = (option: AutocompleteOption) => {
    setSelectedOption(option);
    onChange?.(option.value);
    setOpen(false);
    setSearchQuery('');
  };

  const handleAddNew = () => {
    if (searchQuery.trim() && onAddNew) {
      onAddNew(searchQuery.trim());
      setSearchQuery('');
      setOpen(false);
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-xl border-2 border-indigo-200 bg-white px-4 py-2 text-sm',
            'ring-offset-white',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-200 hover:border-indigo-300',
            'text-left font-normal',
            className
          )}
        >
          <span className={cn('truncate', !selectedOption && 'text-gray-400')}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className={cn(
            'z-50 w-[var(--radix-popover-trigger-width)] rounded-xl border-2 border-indigo-200 bg-white p-1 shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2'
          )}
          align="start"
        >
          {/* Search Input */}
          <div className="p-2 border-b border-indigo-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
              <Input
                type="text"
                placeholder="Qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-[300px] overflow-y-auto p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'relative flex w-full cursor-default select-none items-center rounded-lg py-2.5 pl-8 pr-2 text-sm outline-none',
                    'focus:bg-indigo-50 focus:text-indigo-700',
                    'hover:bg-indigo-50 hover:text-indigo-700',
                    'transition-colors duration-200',
                    selectedOption?.id === option.id && 'bg-indigo-50 text-indigo-700'
                  )}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    {selectedOption?.id === option.id && (
                      <Check className="h-4 w-4 text-indigo-600" />
                    )}
                  </span>
                  {option.label}
                </button>
              ))
            ) : (
              <div className="py-6 text-center text-sm text-gray-500">
                {emptyMessage}
              </div>
            )}

            {/* Add New Option */}
            {searchQuery.trim() && 
             !filteredOptions.some(opt => 
               opt.label.toLowerCase() === searchQuery.toLowerCase() ||
               opt.value.toLowerCase() === searchQuery.toLowerCase()
             ) && 
             onAddNew && (
              <button
                onClick={handleAddNew}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200 font-medium border-t border-indigo-100 mt-1 pt-2"
              >
                <span>+</span>
                <span>Yangi kontakt qo'shish: "{searchQuery}"</span>
              </button>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
