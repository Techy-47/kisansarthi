import { create } from "zustand"

interface UserProfile {
  email: string
  username: string
  country: string
  state: string
  address: string
  soilType: string
  language: string
}

interface AppState {
  userProfile: UserProfile | null
  isAuthenticated: boolean
  setUserProfile: (profile: UserProfile | null) => void
  setIsAuthenticated: (isAuth: boolean) => void
  reset: () => void
}

export const useAppStore = create<AppState>((set) => ({
  userProfile: null,
  isAuthenticated: false,
  setUserProfile: (profile) => set({ userProfile: profile }),
  setIsAuthenticated: (isAuth) => set({ isAuthenticated: isAuth }),
  reset: () => set({ userProfile: null, isAuthenticated: false }),
}))
