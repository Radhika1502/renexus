import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';

interface MentionTextareaProps {
  value: string;
  onChange: (value: string, mentions: User[]) => void;
  placeholder?: string;
  teamMembers: User[];
  className?: string;
}

export const MentionTextarea: React.FC<MentionTextareaProps> = ({
  value,
  onChange,
  placeholder = 'Write a comment...',
  teamMembers,
  className = '',
}) => {
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentions, setMentions] = useState<User[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter team members based on mention query
  const filteredTeamMembers = mentionQuery
    ? teamMembers.filter(member => 
        member.name.toLowerCase().includes(mentionQuery.toLowerCase()))
    : teamMembers;

  // Handle textarea input
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newPosition = e.target.selectionStart;
    setCursorPosition(newPosition);
    
    // Check if we're in the middle of typing a mention
    if (newValue[newPosition - 1] === '@' && (newPosition === 1 || newValue[newPosition - 2] === ' ' || newValue[newPosition - 2] === '\n')) {
      setMentionStartIndex(newPosition - 1);
      setMentionQuery('');
      setShowMentionDropdown(true);
    } else if (mentionStartIndex !== -1 && newPosition > mentionStartIndex) {
      // Update mention query as user types
      const query = newValue.substring(mentionStartIndex + 1, newPosition);
      setMentionQuery(query);
      setShowMentionDropdown(true);
    } else {
      // Reset mention state if cursor moved away
      setShowMentionDropdown(false);
      setMentionStartIndex(-1);
    }
    
    onChange(newValue, mentions);
  };

  // Handle selecting a user from dropdown
  const handleSelectMention = (user: User) => {
    if (mentionStartIndex === -1 || !textareaRef.current) return;
    
    const beforeMention = value.substring(0, mentionStartIndex);
    const afterMention = value.substring(cursorPosition);
    const newValue = `${beforeMention}@${user.name} ${afterMention}`;
    
    // Update mentions array
    const newMentions = [...mentions, user];
    setMentions(newMentions);
    
    // Update textarea value
    onChange(newValue, newMentions);
    
    // Reset mention state
    setShowMentionDropdown(false);
    setMentionStartIndex(-1);
    setMentionQuery('');
    
    // Focus textarea and set cursor position after the inserted mention
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = mentionStartIndex + user.name.length + 2; // +2 for @ and space
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        setCursorPosition(newCursorPos);
      }
    }, 0);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowMentionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full rounded-md border border-gray-300 dark:border-gray-700 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200 ${className}`}
        rows={4}
      />
      
      {showMentionDropdown && filteredTeamMembers.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-10 mt-1 w-64 max-h-60 overflow-auto rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
        >
          <ul className="py-1">
            {filteredTeamMembers.map(member => (
              <li 
                key={member.id}
                className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => handleSelectMention(member)}
              >
                {member.avatar ? (
                  <img 
                    src={member.avatar} 
                    alt={member.name} 
                    className="w-6 h-6 rounded-full mr-2"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2">
                    {member.name.charAt(0)}
                  </div>
                )}
                <span>{member.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MentionTextarea;
