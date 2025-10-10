import MyAuthClient from './client';
import { createAuth } from '@forward-software/react-auth';

export const authClient = new MyAuthClient();

export const { AuthProvider, useAuthClient } = createAuth(authClient);
