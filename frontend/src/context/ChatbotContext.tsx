import React, {
  createContext,
  useContext,
  useState,
  type FC,
  type ReactNode,
} from 'react';

interface ChatbotContextType {
  isOpen: boolean;
  isMinimized: boolean;
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  setIsMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  askWithPrompt: (prompt: string) => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export const ChatbotProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputText, setInputText] = useState('');

  const openChat = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  const toggleChat = () => {
    setIsOpen((prev) => {
      if (!prev) {
        setIsMinimized(false);
        return true;
      }
      return false;
    });
  };

  const askWithPrompt = (prompt: string) => {
    setInputText(prompt);
    setIsOpen(true);
    setIsMinimized(false);
  };

  return (
    <ChatbotContext.Provider
      value={{
        isOpen,
        isMinimized,
        inputText,
        setInputText,
        openChat,
        closeChat,
        toggleChat,
        setIsMinimized,
        askWithPrompt,
      }}
    >
      {children}
    </ChatbotContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useChatbot = (): ChatbotContextType => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
};
