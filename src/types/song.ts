export interface Song {
  id: number | string;
  title: string;
  artist: string;
  image: string;
  downloadUrl?: string;
  thumbnail?: string;
  originalTitle?: string;
  searchTerm?: string;
  separated?: boolean;
}