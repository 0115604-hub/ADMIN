import { db } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query
} from "firebase/firestore";

const COLLECTION_NAME = "severe_disaster_shares";
const STORAGE_KEY = "oryuk_severe_disaster_photos_v1";

export const compressImage = (file, maxWidth = 1600, maxHeight = 1600, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const getLocalSevereDisasterPhotos = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Failed to load local severe disaster photos:", e);
    return [];
  }
};

export const saveLocalSevereDisasterPhotos = (photos) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
  } catch (e) {
    console.error("Failed to persist local severe disaster photos:", e);
  }
};

export const subscribeSevereDisasterPhotos = (callback) => {
  let initial = getLocalSevereDisasterPhotos();
  callback(initial);

  try {
    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef);
    return onSnapshot(
      q,
      (snapshot) => {
        const photos = [];
        snapshot.forEach((docSnap) => {
          photos.push({ id: docSnap.id, ...docSnap.data() });
        });

        photos.sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0));

        saveLocalSevereDisasterPhotos(photos);
        callback(photos);
      },
      (err) => {
        console.warn("Firestore severe disaster photos sync fallback:", err);
        callback(getLocalSevereDisasterPhotos());
      }
    );
  } catch (err) {
    console.warn("Firestore severe disaster subscription error:", err);
    return () => {};
  }
};

export const uploadSevereDisasterPhotos = async (files, uploaderProfile = null) => {
  if (!files || files.length === 0) return [];
  const uploaderName = uploaderProfile?.name || "이명재 이사";
  const uploaderId = uploaderProfile?.id || "sam_mj";
  const nowStr = new Date().toISOString();

  const uploadPromises = Array.from(files).map(async (file, idx) => {
    try {
      const dataUrl = await compressImage(file);
      const photoId = "disaster_" + Date.now() + "_" + idx + "_" + Math.random().toString(36).substring(2, 7);
      const photoItem = {
        id: photoId,
        name: file.name || ("중대재해_사진_" + (idx + 1) + ".jpg"),
        url: dataUrl,
        size: file.size,
        uploaderName,
        uploaderId,
        uploadedAt: nowStr
      };

      try {
        const docRef = doc(db, COLLECTION_NAME, photoId);
        await setDoc(docRef, photoItem);
      } catch (err) {
        console.warn("Firestore save failed, using local store:", err);
      }

      return photoItem;
    } catch (e) {
      console.error("Photo compression error:", e);
      return null;
    }
  });

  const uploadedList = (await Promise.all(uploadPromises)).filter(Boolean);

  const existing = getLocalSevereDisasterPhotos();
  const updated = [...uploadedList, ...existing];
  saveLocalSevereDisasterPhotos(updated);

  return uploadedList;
};

export const deleteSevereDisasterPhoto = async (photoId) => {
  if (!photoId) return;

  try {
    const docRef = doc(db, COLLECTION_NAME, photoId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn("Firestore delete failed:", err);
  }

  const existing = getLocalSevereDisasterPhotos();
  const updated = existing.filter((p) => p.id !== photoId);
  saveLocalSevereDisasterPhotos(updated);
};
