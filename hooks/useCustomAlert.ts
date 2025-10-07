import { Button } from '@/components/UI/CustomAlert';
import { useState } from 'react';

export function useCustomAlert() {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [buttons, setButtons] = useState<Button[]>([{ text: 'OK' }]);

  const showAlert = (
    newTitle: string,
    newMessage: string,
    newButtons?: Button[]
  ) => {
    setTitle(newTitle);
    setMessage(newMessage);
    setButtons(
      newButtons || [{ text: 'OK', onPress: () => setVisible(false) }]
    );
    setVisible(true);
  };

  const hideAlert = () => setVisible(false);

  return {
    visible,
    title,
    message,
    buttons,
    showAlert,
    hideAlert,
  };
}
