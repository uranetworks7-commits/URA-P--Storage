import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  if (isNaN(bytes) || bytes === null || bytes === undefined) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function isImageFile(fileName: string): boolean {
    if (!fileName) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    const lowercasedName = fileName.toLowerCase();
    return imageExtensions.some(ext => lowercasedName.endsWith(ext));
}

export function isVideoFile(fileName: string): boolean {
    if (!fileName) return false;
    const videoExtensions = ['.mp4', '.webm', '.mov', '.ogg'];
    const lowercasedName = fileName.toLowerCase();
    return videoExtensions.some(ext => lowercasedName.endsWith(ext));
}

export function isAudioFile(fileName: string): boolean {
    if (!fileName) return false;
    const audioExtensions = ['.mp3', '.wav', '.m4a'];
    const lowercasedName = fileName.toLowerCase();
    return audioExtensions.some(ext => lowercasedName.endsWith(ext));
}

export function isPdfFile(fileName: string): boolean {
    if (!fileName) return false;
    return fileName.toLowerCase().endsWith('.pdf');
}

export function isZipFile(fileName: string): boolean {
    if (!fileName) return false;
    return fileName.toLowerCase().endsWith('.zip');
}
