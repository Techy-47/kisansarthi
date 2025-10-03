import { openDB, type DBSchema, type IDBPDatabase } from "idb"

interface KisanSaathiDB extends DBSchema {
  userProfile: {
    key: string
    value: {
      email: string
      username: string
      country: string
      state: string
      address: string
      soilType: string
      language: string
    }
  }
  session: {
    key: number
    value: {
      id?: number
      userEmail: string
      otp: string
      expires: number
      isAuthenticated: boolean
    }
    autoIncrement: true
  }
}

const DB_NAME = "KisanSaathiDB"
const DB_VERSION = 1

let dbInstance: IDBPDatabase<KisanSaathiDB> | null = null

export async function getDB() {
  if (dbInstance) {
    return dbInstance
  }

  dbInstance = await openDB<KisanSaathiDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create userProfile store with email as keyPath
      if (!db.objectStoreNames.contains("userProfile")) {
        db.createObjectStore("userProfile", { keyPath: "email" })
      }

      // Create session store with auto-incrementing id
      if (!db.objectStoreNames.contains("session")) {
        db.createObjectStore("session", {
          keyPath: "id",
          autoIncrement: true,
        })
      }
    },
  })

  return dbInstance
}

// User Profile operations
export async function saveUserProfile(profile: KisanSaathiDB["userProfile"]["value"]) {
  const db = await getDB()
  await db.put("userProfile", profile)
}

export async function getUserProfile(email: string) {
  const db = await getDB()
  return await db.get("userProfile", email)
}

export async function getAllUserProfiles() {
  const db = await getDB()
  return await db.getAll("userProfile")
}

// Session operations
export async function saveSession(session: Omit<KisanSaathiDB["session"]["value"], "id">) {
  const db = await getDB()
  // Clear existing sessions first
  await clearSessions()
  await db.add("session", session)
}

export async function getSession() {
  const db = await getDB()
  const sessions = await db.getAll("session")
  return sessions[0] || null
}

export async function updateSession(updates: Partial<KisanSaathiDB["session"]["value"]>) {
  const db = await getDB()
  const session = await getSession()
  if (session) {
    await db.put("session", { ...session, ...updates })
  }
}

export async function clearSessions() {
  const db = await getDB()
  await db.clear("session")
}

export async function isAuthenticated() {
  const session = await getSession()
  if (!session) return false

  // Check if session is expired
  if (session.expires < Date.now()) {
    await clearSessions()
    return false
  }

  return session.isAuthenticated
}

// Additional operations
export async function userExists(email: string): Promise<boolean> {
  const db = await getDB()
  const profile = await db.get("userProfile", email)
  return !!profile
}

export async function logout() {
  await clearSessions()
}
