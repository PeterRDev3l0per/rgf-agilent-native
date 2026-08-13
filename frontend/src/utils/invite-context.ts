export interface InviteContext {
  projectId: string;
  projectName: string | null;
  role: "freelancer" | "client";
  inviteCode: string;
  redirectPath: string;
}

const STORAGE_KEY = "inviteContext";

export const saveInviteContext = (context: InviteContext): void => {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context));
};

export const getInviteContext = (): InviteContext | null => {
  try {
    const data = sessionStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const clearInviteContext = (): void => {
  sessionStorage.removeItem(STORAGE_KEY);
};

export const hasInviteContext = (): boolean => {
  return sessionStorage.getItem(STORAGE_KEY) !== null;
};
