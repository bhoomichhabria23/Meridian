/**
 * Simple in-memory cache manager for frequently accessed data
 * Useful for endpoints that don't need real-time data (like doctor lists, specialties, etc.)
 */

class CacheManager {
  constructor(defaultTTL = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.timers = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Set cache with optional TTL (Time To Live) in milliseconds
   */
  set(key, value, ttl = this.defaultTTL) {
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    this.cache.set(key, value);

    // Set expiration
    if (ttl > 0) {
      const timer = setTimeout(() => {
        this.cache.delete(key);
        this.timers.delete(key);
        console.log(`[CACHE] Expired: ${key}`);
      }, ttl);

      this.timers.set(key, timer);
    }
  }

  /**
   * Get cached value
   */
  get(key) {
    return this.cache.get(key);
  }

  /**
   * Check if key exists in cache
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Delete cache entry
   */
  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.cache.clear();
    this.timers.clear();
    console.log('[CACHE] All cache cleared');
  }

  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }
}

module.exports = new CacheManager();
