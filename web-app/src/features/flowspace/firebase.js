import { db, auth } from '../../firebase';
import { GoogleAuthProvider } from 'firebase/auth';

export const googleProvider = new GoogleAuthProvider();
export { db, auth };
