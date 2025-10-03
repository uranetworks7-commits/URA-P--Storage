export interface DiaryEntry {
  text: string;
  timestamp: number;
}

export interface StoredFile {
  name: string;
  size: number;
  url: string;
  timestamp: number;
  type: string;
}

export interface UserData {
  createdAt: number;
  username?: string;
  email?: string;
  usageBytes: number;
  diary?: Record<string, DiaryEntry>;
  files?: Record<string, StoredFile>;
  premium?: boolean;
}
