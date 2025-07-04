import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Textarea,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@renexus/ui-components';
import { useTeamMembers } from '../../team-management/hooks/useTeamMembers';
import { User } from '../../team-management/types';
import { Loader } from 'lucide-react';

interface MentionInputProps {
  value: string;
  onChange: (value: string, mentions: string[]) => void;
  placeholder?: string;
  projectId?: string;
  disabled?: boolean;
  minRows?: number;
  maxRows?: number;
}

export const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  placeholder = 'Write a comment...',
  projectId,
  disabled = false,
  minRows = 3,
  maxRows = 8,
}) => {
  const { data: teamMembers, isLoading } = useTeamMembers(projectId);
  const [inputValue, setInputValue] = useState(value);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionSearchPosition, setMentionSearchPosition] = useState<number | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentions, setMentions] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);

  // Reset state when value prop changes externally
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
      // Extract mentions from value
      const mentionRegex = /@(\w+)/g;
      const foundMentions: string[] = [];
      let match;
      while ((match = mentionRegex.exec(value)) !== null) {
        foundMentions.push(match[1]);
      }
      setMentions(foundMentions);
    }
  }, [value, inputValue]);

  // Handle input changes and detect @ symbol for mentions
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    const cursorPos = e.target.selectionStart || 0;
    setCursorPosition(cursorPos);
    
    // Check if user is typing a mention
    let mentionStart = -1;
    for (let i = cursorPos - 1; i >= 0; i--) {
      if (newValue[i] === '@') {
        mentionStart = i;
        break;
      } else if (newValue[i] === ' ' || newValue[i] === '\n') {
        break;
      }
    }
    
    if (mentionStart !== -1) {
      const query = newValue.substring(mentionStart + 1, cursorPos);
      setMentionQuery(query);
      setMentionSearchPosition(mentionStart);
      setShowMentionSuggestions(true);
    } else {
      setShowMentionSuggestions(false);
    }
    
    // Extract mentions from text
    const mentionRegex = /@(\w+)/g;
    const foundMentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(newValue)) !== null) {
      foundMentions.push(match[1]);
    }
    setMentions(foundMentions);
    
    onChange(newValue, foundMentions);
  };

  // Filter team members based on mention query
  const filteredMembers = teamMembers?.filter(member => 
    member.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    member.username?.toLowerCase().includes(mentionQuery.toLowerCase())
  ) || [];

  // Insert mention into text
  const insertMention = (user: User) => {
    if (mentionSearchPosition === null || !textareaRef.current) return;
    
    const beforeMention = inputValue.substring(0, mentionSearchPosition);
    const afterMention = inputValue.substring(cursorPosition);
    const newValue = `${beforeMention}@${user.username || user.name.replace(/\s+/g, '')} ${afterMention}`;
    
    setInputValue(newValue);
    setShowMentionSuggestions(false);
    
    // Update mentions
    const mentionRegex = /@(\w+)/g;
    const foundMentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(newValue)) !== null) {
      foundMentions.push(match[1]);
    }
    setMentions(foundMentions);
    
    onChange(newValue, foundMentions);
    
    // Focus back on textarea and set cursor position after the inserted mention
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = mentionSearchPosition + (user.username || user.name.replace(/\s+/g, '')).length + 2;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  return (
    <div className="relative">
      <Popover open={showMentionSuggestions} onOpenChange={setShowMentionSuggestions}>
        <PopoverTrigger asChild>
          <div>
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              placeholder={placeholder}
              disabled={disabled}
              className="min-h-[80px]"
              style={{ 
                minHeight: `${minRows * 1.5}rem`, 
                maxHeight: maxRows ? `${maxRows * 1.5}rem` : undefined 
              }}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="w-64 p-0" 
          align="start"
          side="top"
          sideOffset={5}
        >
          <Command>
            <CommandInput placeholder="Search people..." value={mentionQuery} />
            <CommandEmpty>
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </div>
              ) : (
                "No people found"
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredMembers.map((member) => (
                <CommandItem
                  key={member.id}
                  onSelect={() => insertMention(member)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs mr-2">
                      {member.name.charAt(0)}
                    </div>
                    <span>{member.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {mentions.length > 0 && (
        <div className="text-xs text-gray-500 mt-1">
          Mentioning: {mentions.map(m => `@${m}`).join(', ')}
        </div>
      )}
    </div>
  );
};
