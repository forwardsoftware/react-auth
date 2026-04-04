import { createAuth } from '@forward-software/react-auth';
import { MockAuthClient } from './mock-auth-client';

export const { AuthProvider, authClient, useAuthClient } = createAuth(new MockAuthClient());
