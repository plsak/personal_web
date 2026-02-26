import React, { useState, useRef, useEffect } from 'react';
import { X, Search } from 'lucide-react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

// Organized emoji categories with search keywords
const emojiCategories = {
  'Smileys': [
    { emoji: '😀', keywords: ['grinning', 'happy', 'smile', 'joy'] },
    { emoji: '😃', keywords: ['grinning', 'happy', 'smile', 'joy', 'cheerful'] },
    { emoji: '😄', keywords: ['grinning', 'happy', 'smile', 'joy', 'laugh'] },
    { emoji: '😁', keywords: ['grinning', 'happy', 'smile', 'joy'] },
    { emoji: '😆', keywords: ['grinning', 'happy', 'smile', 'laugh', 'satisfied'] },
    { emoji: '😅', keywords: ['grinning', 'happy', 'smile', 'sweat', 'relief'] },
    { emoji: '🤣', keywords: ['laugh', 'joy', 'tears', 'funny', 'hilarious'] },
    { emoji: '😂', keywords: ['laugh', 'joy', 'tears', 'funny', 'cry'] },
    { emoji: '🙂', keywords: ['smile', 'happy', 'positive'] },
    { emoji: '🙃', keywords: ['upside', 'down', 'silly', 'playful'] },
    { emoji: '😉', keywords: ['wink', 'flirt', 'playful'] },
    { emoji: '😊', keywords: ['smile', 'happy', 'blush', 'pleased'] },
    { emoji: '😇', keywords: ['angel', 'innocent', 'halo'] },
    { emoji: '🥰', keywords: ['love', 'hearts', 'adore', 'crush'] },
    { emoji: '😍', keywords: ['love', 'heart', 'eyes', 'adore'] },
    { emoji: '🤩', keywords: ['star', 'eyes', 'excited', 'amazing'] },
    { emoji: '😘', keywords: ['kiss', 'love', 'heart'] },
    { emoji: '😗', keywords: ['kiss', 'love'] },
    { emoji: '😚', keywords: ['kiss', 'love', 'closed', 'eyes'] },
    { emoji: '😙', keywords: ['kiss', 'love', 'smile'] },
    { emoji: '😋', keywords: ['tongue', 'tasty', 'delicious', 'yum'] },
    { emoji: '😛', keywords: ['tongue', 'playful', 'silly'] },
    { emoji: '😜', keywords: ['tongue', 'wink', 'playful', 'silly'] },
    { emoji: '🤪', keywords: ['crazy', 'wild', 'silly', 'goofy'] },
    { emoji: '😝', keywords: ['tongue', 'closed', 'eyes', 'playful'] },
    { emoji: '🤑', keywords: ['money', 'rich', 'dollar', 'greedy'] },
    { emoji: '🤗', keywords: ['hug', 'embrace', 'love'] },
    { emoji: '🤭', keywords: ['giggle', 'chuckle', 'secret'] },
    { emoji: '🤫', keywords: ['shush', 'quiet', 'secret', 'silence'] },
    { emoji: '🤔', keywords: ['think', 'wonder', 'consider'] },
    { emoji: '🤐', keywords: ['zipper', 'mouth', 'quiet', 'secret'] },
    { emoji: '🤨', keywords: ['eyebrow', 'suspicious', 'skeptical'] },
    { emoji: '😐', keywords: ['neutral', 'meh', 'blank'] },
    { emoji: '😑', keywords: ['expressionless', 'blank', 'meh'] },
    { emoji: '😶', keywords: ['no', 'mouth', 'quiet', 'silent'] },
    { emoji: '😏', keywords: ['smirk', 'sly', 'suggestive'] },
    { emoji: '😒', keywords: ['unamused', 'bored', 'annoyed'] },
    { emoji: '🙄', keywords: ['eye', 'roll', 'annoyed', 'whatever'] },
    { emoji: '😬', keywords: ['grimace', 'awkward', 'nervous'] },
    { emoji: '🤥', keywords: ['lie', 'pinocchio', 'dishonest'] },
    { emoji: '😔', keywords: ['sad', 'dejected', 'sorry'] },
    { emoji: '😪', keywords: ['sleepy', 'tired', 'yawn'] },
    { emoji: '🤤', keywords: ['drool', 'sleep', 'hungry'] },
    { emoji: '😴', keywords: ['sleep', 'tired', 'zzz'] },
    { emoji: '😷', keywords: ['mask', 'sick', 'doctor', 'covid'] },
    { emoji: '🤒', keywords: ['sick', 'fever', 'thermometer'] },
    { emoji: '🤕', keywords: ['hurt', 'bandage', 'injured'] },
    { emoji: '🤢', keywords: ['nausea', 'sick', 'green'] },
    { emoji: '🤮', keywords: ['vomit', 'sick', 'puke'] },
    { emoji: '🤧', keywords: ['sneeze', 'sick', 'tissue'] },
    { emoji: '🥵', keywords: ['hot', 'heat', 'sweat'] },
    { emoji: '🥶', keywords: ['cold', 'freeze', 'blue'] },
    { emoji: '🥴', keywords: ['dizzy', 'drunk', 'confused'] },
    { emoji: '😵', keywords: ['dizzy', 'dead', 'knocked', 'out'] },
    { emoji: '🤯', keywords: ['mind', 'blown', 'explode', 'shocked'] },
    { emoji: '🤠', keywords: ['cowboy', 'hat', 'western'] },
    { emoji: '🥳', keywords: ['party', 'celebrate', 'birthday'] },
    { emoji: '😎', keywords: ['cool', 'sunglasses', 'awesome'] },
    { emoji: '🤓', keywords: ['nerd', 'geek', 'smart', 'glasses'] },
    { emoji: '🧐', keywords: ['monocle', 'thinking', 'fancy'] }
  ],
  'Fingers': [
    { emoji: '👍', keywords: ['thumbs', 'up', 'good', 'yes', 'approve', 'like'] },
    { emoji: '👎', keywords: ['thumbs', 'down', 'bad', 'no', 'disapprove', 'dislike'] },
    { emoji: '👌', keywords: ['ok', 'okay', 'perfect', 'good'] },
    { emoji: '✌️', keywords: ['peace', 'victory', 'two', 'fingers'] },
    { emoji: '🤞', keywords: ['crossed', 'fingers', 'luck', 'hope', 'wish'] },
    { emoji: '🤟', keywords: ['love', 'you', 'sign', 'hand'] },
    { emoji: '🤘', keywords: ['rock', 'on', 'horns', 'metal'] },
    { emoji: '🤙', keywords: ['call', 'me', 'hang', 'loose', 'shaka'] },
    { emoji: '👈', keywords: ['point', 'left', 'finger', 'direction'] },
    { emoji: '👉', keywords: ['point', 'right', 'finger', 'direction'] },
    { emoji: '👆', keywords: ['point', 'up', 'finger', 'direction'] },
    { emoji: '🖕', keywords: ['middle', 'finger', 'rude', 'offensive'] },
    { emoji: '👇', keywords: ['point', 'down', 'finger', 'direction'] },
    { emoji: '☝️', keywords: ['point', 'up', 'finger', 'one', 'index'] },
    { emoji: '👋', keywords: ['wave', 'hello', 'goodbye', 'hand'] },
    { emoji: '🤚', keywords: ['raised', 'back', 'hand', 'stop'] },
    { emoji: '🖐️', keywords: ['hand', 'five', 'fingers', 'stop'] },
    { emoji: '✋', keywords: ['hand', 'stop', 'five', 'high'] },
    { emoji: '🖖', keywords: ['vulcan', 'spock', 'star', 'trek'] },
    { emoji: '👏', keywords: ['clap', 'applause', 'praise', 'congratulations'] },
    { emoji: '🙌', keywords: ['raise', 'hands', 'celebration', 'praise'] },
    { emoji: '👐', keywords: ['open', 'hands', 'hug', 'jazz'] },
    { emoji: '🤲', keywords: ['palms', 'up', 'together', 'prayer'] },
    { emoji: '🤝', keywords: ['handshake', 'deal', 'agreement', 'meeting'] },
    { emoji: '🙏', keywords: ['pray', 'thanks', 'please', 'hope', 'namaste'] },
    { emoji: '✍️', keywords: ['write', 'writing', 'author', 'signature'] },
    { emoji: '💅', keywords: ['nail', 'polish', 'care', 'beauty'] },
    { emoji: '🤳', keywords: ['selfie', 'camera', 'phone', 'picture'] }
  ],
  'People': [
    { emoji: '🤷', keywords: ['shrug', 'dunno', 'whatever', 'idk', 'dont', 'know'] },
    { emoji: '🤷‍♂️', keywords: ['man', 'shrug', 'dunno', 'whatever', 'idk', 'dont', 'know'] },
    { emoji: '🤷‍♀️', keywords: ['woman', 'shrug', 'dunno', 'whatever', 'idk', 'dont', 'know'] },
    { emoji: '🤦', keywords: ['facepalm', 'disappointed', 'frustrated', 'annoyed'] },
    { emoji: '🤦‍♂️', keywords: ['man', 'facepalm', 'disappointed', 'frustrated', 'annoyed'] },
    { emoji: '🤦‍♀️', keywords: ['woman', 'facepalm', 'disappointed', 'frustrated', 'annoyed'] },
    { emoji: '🙋', keywords: ['raising', 'hand', 'question', 'volunteer', 'me'] },
    { emoji: '🙋‍♂️', keywords: ['man', 'raising', 'hand', 'question', 'volunteer', 'me'] },
    { emoji: '🙋‍♀️', keywords: ['woman', 'raising', 'hand', 'question', 'volunteer', 'me'] },
    { emoji: '💁', keywords: ['information', 'desk', 'person', 'help', 'sassy'] },
    { emoji: '💁‍♂️', keywords: ['man', 'information', 'desk', 'person', 'help', 'sassy'] },
    { emoji: '💁‍♀️', keywords: ['woman', 'information', 'desk', 'person', 'help', 'sassy'] },
    { emoji: '🙆', keywords: ['ok', 'gesture', 'arms', 'above', 'head', 'good'] },
    { emoji: '🙆‍♂️', keywords: ['man', 'ok', 'gesture', 'arms', 'above', 'head', 'good'] },
    { emoji: '🙆‍♀️', keywords: ['woman', 'ok', 'gesture', 'arms', 'above', 'head', 'good'] },
    { emoji: '🙅', keywords: ['no', 'good', 'stop', 'halt', 'forbidden', 'not', 'allowed'] },
    { emoji: '🙅‍♂️', keywords: ['man', 'no', 'good', 'stop', 'halt', 'forbidden', 'not', 'allowed'] },
    { emoji: '🙅‍♀️', keywords: ['woman', 'no', 'good', 'stop', 'halt', 'forbidden', 'not', 'allowed'] },
    { emoji: '🙎', keywords: ['pouting', 'face', 'upset', 'sad', 'disappointed'] },
    { emoji: '🙎‍♂️', keywords: ['man', 'pouting', 'face', 'upset', 'sad', 'disappointed'] },
    { emoji: '🙎‍♀️', keywords: ['woman', 'pouting', 'face', 'upset', 'sad', 'disappointed'] },
    { emoji: '🙍', keywords: ['frowning', 'face', 'sad', 'upset', 'disappointed'] },
    { emoji: '🙍‍♂️', keywords: ['man', 'frowning', 'face', 'sad', 'upset', 'disappointed'] },
    { emoji: '🙍‍♀️', keywords: ['woman', 'frowning', 'face', 'sad', 'upset', 'disappointed'] },
    { emoji: '🧏', keywords: ['deaf', 'person', 'hear', 'listening'] },
    { emoji: '🧏‍♂️', keywords: ['deaf', 'man', 'hear', 'listening'] },
    { emoji: '🧏‍♀️', keywords: ['deaf', 'woman', 'hear', 'listening'] },
    { emoji: '🤴', keywords: ['prince', 'royal', 'crown', 'nobility'] },
    { emoji: '👸', keywords: ['princess', 'royal', 'crown', 'nobility', 'queen'] },
    { emoji: '👨‍💻', keywords: ['man', 'technologist', 'developer', 'coder', 'programmer'] },
    { emoji: '👩‍💻', keywords: ['woman', 'technologist', 'developer', 'coder', 'programmer'] },
    { emoji: '👨‍🎨', keywords: ['man', 'artist', 'creative', 'painter'] },
    { emoji: '👩‍🎨', keywords: ['woman', 'artist', 'creative', 'painter'] },
    { emoji: '👨‍🏫', keywords: ['man', 'teacher', 'instructor', 'professor'] },
    { emoji: '👩‍🏫', keywords: ['woman', 'teacher', 'instructor', 'professor'] },
    { emoji: '👨‍🔬', keywords: ['man', 'scientist', 'researcher', 'lab'] },
    { emoji: '👩‍🔬', keywords: ['woman', 'scientist', 'researcher', 'lab'] },
    { emoji: '👨‍⚕️', keywords: ['man', 'health', 'worker', 'doctor', 'nurse'] },
    { emoji: '👩‍⚕️', keywords: ['woman', 'health', 'worker', 'doctor', 'nurse'] }
  ],
  'Animals': [
    { emoji: '🐶', keywords: ['dog', 'puppy', 'pet', 'animal'] },
    { emoji: '🐱', keywords: ['cat', 'kitten', 'pet', 'animal'] },
    { emoji: '🐭', keywords: ['mouse', 'animal', 'small'] },
    { emoji: '🐹', keywords: ['hamster', 'pet', 'animal'] },
    { emoji: '🐰', keywords: ['rabbit', 'bunny', 'animal'] },
    { emoji: '🦊', keywords: ['fox', 'animal', 'clever'] },
    { emoji: '🐻', keywords: ['bear', 'animal', 'strong'] },
    { emoji: '🐼', keywords: ['panda', 'bear', 'animal', 'cute'] },
    { emoji: '🐨', keywords: ['koala', 'animal', 'australia'] },
    { emoji: '🐯', keywords: ['tiger', 'animal', 'strong'] },
    { emoji: '🦁', keywords: ['lion', 'animal', 'king', 'strong'] },
    { emoji: '🐮', keywords: ['cow', 'animal', 'farm'] },
    { emoji: '🐷', keywords: ['pig', 'animal', 'farm'] },
    { emoji: '🐽', keywords: ['pig', 'nose', 'animal'] },
    { emoji: '🐸', keywords: ['frog', 'animal', 'green'] },
    { emoji: '🐵', keywords: ['monkey', 'animal', 'face'] },
    { emoji: '🙈', keywords: ['monkey', 'see', 'no', 'evil'] },
    { emoji: '🙉', keywords: ['monkey', 'hear', 'no', 'evil'] },
    { emoji: '🙊', keywords: ['monkey', 'speak', 'no', 'evil'] },
    { emoji: '🐒', keywords: ['monkey', 'animal', 'playful'] }
  ],
  'Food': [
    { emoji: '🍎', keywords: ['apple', 'fruit', 'red', 'healthy'] },
    { emoji: '🍐', keywords: ['pear', 'fruit', 'green'] },
    { emoji: '🍊', keywords: ['orange', 'fruit', 'citrus'] },
    { emoji: '🍋', keywords: ['lemon', 'fruit', 'citrus', 'sour'] },
    { emoji: '🍌', keywords: ['banana', 'fruit', 'yellow'] },
    { emoji: '🍉', keywords: ['watermelon', 'fruit', 'summer'] },
    { emoji: '🍇', keywords: ['grapes', 'fruit', 'wine'] },
    { emoji: '🍓', keywords: ['strawberry', 'fruit', 'red', 'sweet'] },
    { emoji: '🫐', keywords: ['blueberry', 'fruit', 'blue', 'healthy'] },
    { emoji: '🍈', keywords: ['melon', 'fruit', 'green'] },
    { emoji: '🍒', keywords: ['cherry', 'fruit', 'red', 'sweet'] },
    { emoji: '🍑', keywords: ['peach', 'fruit', 'pink'] },
    { emoji: '🥭', keywords: ['mango', 'fruit', 'tropical'] },
    { emoji: '🍍', keywords: ['pineapple', 'fruit', 'tropical'] },
    { emoji: '🥥', keywords: ['coconut', 'fruit', 'tropical'] },
    { emoji: '🥝', keywords: ['kiwi', 'fruit', 'green'] },
    { emoji: '🍅', keywords: ['tomato', 'vegetable', 'red'] },
    { emoji: '🍆', keywords: ['eggplant', 'vegetable', 'purple'] },
    { emoji: '🥑', keywords: ['avocado', 'fruit', 'green', 'healthy'] },
    { emoji: '🥦', keywords: ['broccoli', 'vegetable', 'green', 'healthy'] }
  ],
  'Activities': [
    { emoji: '⚽', keywords: ['soccer', 'football', 'sport', 'ball'] },
    { emoji: '🏀', keywords: ['basketball', 'sport', 'ball'] },
    { emoji: '🏈', keywords: ['football', 'american', 'sport', 'ball'] },
    { emoji: '⚾', keywords: ['baseball', 'sport', 'ball'] },
    { emoji: '🥎', keywords: ['softball', 'sport', 'ball'] },
    { emoji: '🎾', keywords: ['tennis', 'sport', 'ball'] },
    { emoji: '🏐', keywords: ['volleyball', 'sport', 'ball'] },
    { emoji: '🏉', keywords: ['rugby', 'sport', 'ball'] },
    { emoji: '🥏', keywords: ['frisbee', 'sport', 'disc'] },
    { emoji: '🎱', keywords: ['pool', 'billiards', 'eight', 'ball'] },
    { emoji: '🪀', keywords: ['yo', 'yo', 'toy', 'game'] },
    { emoji: '🏓', keywords: ['ping', 'pong', 'table', 'tennis'] },
    { emoji: '🏸', keywords: ['badminton', 'sport', 'racket'] },
    { emoji: '🏒', keywords: ['hockey', 'sport', 'ice'] },
    { emoji: '🏑', keywords: ['field', 'hockey', 'sport'] },
    { emoji: '🥍', keywords: ['lacrosse', 'sport', 'stick'] },
    { emoji: '🏏', keywords: ['cricket', 'sport', 'bat'] },
    { emoji: '🪃', keywords: ['boomerang', 'sport', 'throw'] },
    { emoji: '🥅', keywords: ['goal', 'net', 'sport'] },
    { emoji: '⛳', keywords: ['golf', 'sport', 'flag'] }
  ],
  'Objects': [
    { emoji: '⌚', keywords: ['watch', 'time', 'clock'] },
    { emoji: '📱', keywords: ['phone', 'mobile', 'cell', 'smartphone'] },
    { emoji: '📲', keywords: ['phone', 'mobile', 'call', 'arrow'] },
    { emoji: '💻', keywords: ['laptop', 'computer', 'pc'] },
    { emoji: '⌨️', keywords: ['keyboard', 'computer', 'type'] },
    { emoji: '🖥️', keywords: ['computer', 'desktop', 'monitor'] },
    { emoji: '🖨️', keywords: ['printer', 'print', 'paper'] },
    { emoji: '🖱️', keywords: ['mouse', 'computer', 'click'] },
    { emoji: '🖲️', keywords: ['trackball', 'computer'] },
    { emoji: '🕹️', keywords: ['joystick', 'game', 'controller'] },
    { emoji: '🗜️', keywords: ['clamp', 'tool', 'compress'] },
    { emoji: '💽', keywords: ['disk', 'computer', 'storage'] },
    { emoji: '💾', keywords: ['floppy', 'disk', 'save', 'computer'] },
    { emoji: '💿', keywords: ['cd', 'disk', 'music'] },
    { emoji: '📀', keywords: ['dvd', 'disk', 'movie'] },
    { emoji: '📼', keywords: ['vhs', 'tape', 'video'] },
    { emoji: '📷', keywords: ['camera', 'photo', 'picture'] },
    { emoji: '📸', keywords: ['camera', 'flash', 'photo'] },
    { emoji: '📹', keywords: ['video', 'camera', 'record'] },
    { emoji: '🎥', keywords: ['movie', 'camera', 'film'] }
  ]
};

export default function EmojiPicker({ onEmojiSelect, onClose }: EmojiPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState('Smileys');
  const [searchTerm, setSearchTerm] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Filter emojis based on search term
  const getFilteredEmojis = () => {
    if (!searchTerm.trim()) {
      return emojiCategories[selectedCategory as keyof typeof emojiCategories] || [];
    }

    const searchLower = searchTerm.toLowerCase();
    const allEmojis = Object.values(emojiCategories).flat();
    
    return allEmojis.filter(item => 
      item.keywords.some(keyword => keyword.includes(searchLower))
    );
  };

  const filteredEmojis = getFilteredEmojis();

  return (
    <div
      ref={pickerRef}
      className="bg-slate-800 border border-slate-600 rounded-lg shadow-xl w-80 max-h-96 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-600">
        <h3 className="text-sm font-medium text-slate-200">Select Emoji</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Box */}
      <div className="p-3 border-b border-slate-600">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search emojis..."
            className="w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Category Tabs - Only show if not searching */}
      {!searchTerm.trim() && (
        <div className="flex overflow-x-auto border-b border-slate-600 bg-slate-700">
          {Object.keys(emojiCategories).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-2 text-xs whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-600'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="p-2 max-h-64 overflow-y-auto">
        {filteredEmojis.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            {searchTerm.trim() ? 'No emojis found' : 'No emojis in this category'}
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-1">
            {filteredEmojis.map((item, index) => (
              <button
                key={`${item.emoji}-${index}`}
                onClick={() => onEmojiSelect(item.emoji)}
                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-600 rounded transition-colors emoji-support"
                title={item.keywords.join(', ')}
              >
                {item.emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-slate-600 bg-slate-700">
        <p className="text-xs text-slate-400 text-center">
          {searchTerm.trim() ? `${filteredEmojis.length} emojis found` : 'Click an emoji to insert it'}
        </p>
      </div>
    </div>
  );
}
