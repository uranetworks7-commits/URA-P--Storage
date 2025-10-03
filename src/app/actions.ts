
"use server";

import { db } from "@/lib/firebase";
import { get, ref, set, update, push, remove } from "firebase/database";
import { revalidatePath } from "next/cache";

type FormState = {
  success: boolean;
  message: string;
};

const URA_ERROR_503 = "URA-FS Error: 503. Service unavailable. Please check your connection or try again later.";

const ONE_MB = 1048576;
const ONE_GB = 1073741824;

export async function loginOrCreateUser(
  userId: string,
  username: string,
  email: string
): Promise<FormState> {
  if (!/^\d{6}$/.test(userId)) {
    return { success: false, message: "Please enter a valid 6-digit numeric ID" };
  }

  try {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      await set(userRef, {
        createdAt: Date.now(),
        username: username || null,
        email: email || null,
        usageBytes: 0,
      });
    } else {
      const updates: { username?: string; email?: string } = {};
      if (username) updates.username = username;
      if (email) updates.email = email;
      if (Object.keys(updates).length > 0) {
        await update(userRef, updates);
      }
    }
    revalidatePath("/");
    return { success: true, message: `Welcome, ${userId}!` };
  } catch (error) {
    console.error("Login/Create User Error:", error);
    return { success: false, message: URA_ERROR_503 };
  }
}

export async function saveDiaryEntry(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const text = formData.get("text") as string;
  const userId = formData.get("userId") as string;

  if (!text || !userId) {
    return { success: false, message: "Missing required fields." };
  }
  
  try {
    const diaryRef = ref(db, `users/${userId}/diary`);
    const newEntryRef = push(diaryRef);
    await set(newEntryRef, {
      text,
      timestamp: Date.now(),
    });
    revalidatePath("/");
    return { success: true, message: "Diary entry saved." };
  } catch (error) {
    console.error("Save Diary Error:", error);
    return { success: false, message: URA_ERROR_503 };
  }
}

export async function updateDiaryEntry(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const text = formData.get("text") as string;
  const userId = formData.get("userId") as string;
  const entryId = formData.get("entryId") as string;

  if (!text || !userId || !entryId) {
    return { success: false, message: "Missing required fields for update." };
  }

  try {
    const entryRef = ref(db, `users/${userId}/diary/${entryId}`);
    await update(entryRef, {
      text,
      timestamp: Date.now(), // Also update the timestamp to reflect the edit time
    });
    revalidatePath("/");
    return { success: true, message: "Diary entry updated successfully." };
  } catch (error) {
    console.error("Update Diary Error:", error);
    return { success: false, message: URA_ERROR_503 };
  }
}

async function uploadToCatbox(file: File): Promise<string> {
    const fd = new FormData();
    fd.append('reqtype','fileupload');
    fd.append('fileToUpload', file, file.name);

    const resp = await fetch('https://catbox.moe/user/api.php', { method:'POST', body: fd });
    if(!resp.ok) throw new Error(`Catbox upload failed: ${resp.statusText}`);
    
    const text = await resp.text();
    if(!text.startsWith('http')) throw new Error(`Unexpected Catbox response: ${text}`);

    return text.trim();
}

export async function uploadFileAndSave(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const file = formData.get("file") as File;
  const userId = formData.get("userId") as string;

  if (!file || !userId) {
    return { success: false, message: "File and User ID are required." };
  }
  
  if (file.size === 0) {
    return { success: false, message: "Cannot upload an empty file." };
  }
  
  if (file.size > ONE_MB) {
    return { success: false, message: "File is too large. Max 1MB for direct upload." };
  }

  try {
    // Check quota
    const usageRef = ref(db, `users/${userId}/usageBytes`);
    const usageSnapshot = await get(usageRef);
    const currentUsage = usageSnapshot.val() || 0;
    const isPremium = (await get(ref(db, `users/${userId}/premium`))).val() === true;
    const quota = isPremium ? 2 * ONE_GB : ONE_GB;

    if (currentUsage + file.size > quota) {
      return { success: false, message: "Storage limit exceeded. Please upgrade to premium or delete files." };
    }

    const url = await uploadToCatbox(file);
    
    const fileRecord = {
      name: file.name,
      size: file.size,
      url,
      timestamp: Date.now(),
      type: file.type || 'application/octet-stream'
    };

    const filesRef = ref(db, `users/${userId}/files`);
    const newFileRef = push(filesRef);
    await set(newFileRef, fileRecord);
    
    await set(usageRef, currentUsage + file.size);
    
    revalidatePath("/");
    return { success: true, message: "File uploaded successfully." };
  } catch (error) {
    console.error("Upload File Error:", error);
    return { success: false, message: URA_ERROR_503 };
  }
}

export async function uploadFileFromUrlAndSave(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const fileUrl = formData.get("url") as string;
  const userId = formData.get("userId") as string;

  if (!fileUrl || !userId) {
    return { success: false, message: "URL and User ID are required." };
  }

  try {
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      return { success: false, message: "Failed to fetch the file from the provided URL." };
    }
    const blob = await fileResponse.blob();
    const fileName = fileUrl.substring(fileUrl.lastIndexOf('/') + 1) || "untitled";
    const fileType = blob.type || 'application/octet-stream';
    const file = new File([blob], fileName, { type: fileType });

     // Check quota
    const usageRef = ref(db, `users/${userId}/usageBytes`);
    const usageSnapshot = await get(usageRef);
    const currentUsage = usageSnapshot.val() || 0;
    const isPremium = (await get(ref(db, `users/${userId}/premium`))).val() === true;
    const quota = isPremium ? 2 * ONE_GB : ONE_GB;

    if (currentUsage + file.size > quota) {
      return { success: false, message: "Storage limit exceeded. Please upgrade to premium or delete files." };
    }
    
    const url = await uploadToCatbox(file);
    
    const fileRecord = {
      name: file.name,
      size: file.size,
      url,
      timestamp: Date.now(),
      type: fileType
    };

    const filesRef = ref(db, `users/${userId}/files`);
    const newFileRef = push(filesRef);
    await set(newFileRef, fileRecord);

    await set(usageRef, currentUsage + file.size);

    revalidatePath("/");
    return { success: true, message: `File from URL uploaded: ${file.name}` };
  } catch (error) {
    console.error("Upload from URL Error:", error);
    return { success: false, message: "Could not process the file from the URL. It may be due to network issues or CORS policies." };
  }
}

export async function deleteItem(userId: string, itemType: 'diary' | 'files', itemId: string): Promise<FormState> {
  if (!userId || !itemType || !itemId) {
    return { success: false, message: "Missing required information for deletion." };
  }

  try {
    const itemRef = ref(db, `users/${userId}/${itemType}/${itemId}`);
    
    if (itemType === 'files') {
      const fileSnapshot = await get(itemRef);
      if (fileSnapshot.exists()) {
        const fileData = fileSnapshot.val();
        const fileSize = fileData.size || 0;
        
        const usageRef = ref(db, `users/${userId}/usageBytes`);
        const usageSnapshot = await get(usageRef);
        const currentUsage = usageSnapshot.val() || 0;
        
        await set(usageRef, Math.max(0, currentUsage - fileSize));
      }
    }

    await remove(itemRef);
    revalidatePath("/");
    return { success: true, message: "Item deleted successfully." };
  } catch (error) {
    console.error("Delete Item Error:", error);
    return { success: false, message: URA_ERROR_503 };
  }
}
