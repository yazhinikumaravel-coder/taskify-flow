/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Task {
  id: string;
  userId?: string; // Optional for compatibility, required for user-isolated tasks
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
