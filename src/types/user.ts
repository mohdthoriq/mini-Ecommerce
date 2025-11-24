export interface User {
  id: string;
  username?: string | null;
  password?: string | null;
  token?: string;
  email: string;
  name: string;
  phone?: string;           // Tambahkan ini
  address?: string;         // Tambahkan ini
  joinDate?: string;        // Tambahkan ini
  avatar?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  image?: string;
  dateOfBirth?: string;     // Optional: tambahkan jika perlu
  bio?: string;             // Optional: tambahkan jika perlu
}