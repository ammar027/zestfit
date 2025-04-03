import "react-native-url-polyfill/auto"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient } from "@supabase/supabase-js"

// Simple in-memory cache for query results
class QueryCache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private DEFAULT_TTL_MS = 15 * 60 * 1000 // 15 minutes in milliseconds

  // Get value from cache
  get(key: string): any | null {
    const item = this.cache.get(key)

    if (!item) return null

    // Check if cache entry has expired
    if (Date.now() - item.timestamp > this.DEFAULT_TTL_MS) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  // Set value in cache
  set(key: string, data: any, customTTL?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  // Clear the entire cache
  clear(): void {
    this.cache.clear()
  }

  // Clear cache by key pattern (partial match)
  clearByPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  // Check if key exists and its age
  getCacheAge(key: string): number | null {
    const item = this.cache.get(key)
    if (!item) return null

    return Date.now() - item.timestamp
  }
}

// Create the cache instance
export const queryCache = new QueryCache()

// Create the Supabase client with standard configuration
export const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL || "", process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "", {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Add enhanced methods with caching to the exported supabase object
export const enhancedSupabase = {
  ...supabase,

  // Cached version of data fetching
  async fetchCached(table: string, query: any, cacheKey?: string): Promise<any> {
    // Generate cache key if not provided
    const actualCacheKey = cacheKey || `${table}:${JSON.stringify(query)}`

    // Try to get from cache first
    const cachedResult = queryCache.get(actualCacheKey)
    if (cachedResult) {
      console.log(`Cache hit for ${actualCacheKey}`)
      return cachedResult
    }

    // If not in cache, fetch from Supabase
    console.log(`Cache miss for ${actualCacheKey}, fetching from API`)
    const result = await supabase.from(table).select(query)

    // Cache the result if successful
    if (!result.error && result.data) {
      queryCache.set(actualCacheKey, result)
    }

    return result
  },

  // Clear cache for specific table
  clearTableCache(table: string): void {
    queryCache.clearByPattern(table)
  },

  // Clear the entire cache
  clearCache(): void {
    queryCache.clear()
  },
}
