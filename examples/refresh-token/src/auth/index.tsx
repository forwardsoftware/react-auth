import { createAuth } from '../../../../lib/dist';
import Client from './client';

export const authClient = new Client();

export const { AuthProvider, useAuthClient } = createAuth(authClient);
