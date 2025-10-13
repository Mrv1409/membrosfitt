import { User as FirebaseUser } from 'firebase/auth';

export interface User extends FirebaseUser {
  points?: number;
  // Add other custom properties here
}
