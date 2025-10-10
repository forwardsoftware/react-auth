import { useCallback, useState } from 'react';

export function useUserCredentials() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const updateEmail = useCallback((text: string) => {
    setEmail(text);
  }, []);

  const updatePassword = useCallback((text: string) => {
    setPassword(text);
  }, []);

  return {
    email,
    password,
    updateEmail,
    updatePassword,
  };
}
