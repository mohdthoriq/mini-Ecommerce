import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * SAFE STORAGE UTILITIES
 * Handle corrupted JSON data dengan auto-recovery mechanism
 */

export interface SafeStorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  wasRepaired?: boolean;
}

class SafeStorage {
  /**
   * SAFELY LOAD DATA FROM STORAGE
   * Auto-repair JSON corruption dan provide fallback
   */
  async safeLoad<T>(
    key: string, 
    fallbackValue: T,
    options: {
      maxRetries?: number;
      repairAttempts?: number;
    } = {}
  ): Promise<SafeStorageResult<T>> {
    const { maxRetries = 3, repairAttempts = 2 } = options;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔍 Safe loading ${key} (attempt ${attempt}/${maxRetries})`);
        
        const storedData = await AsyncStorage.getItem(key);
        
        if (!storedData) {
          console.log(`📭 No data found for key: ${key}`);
          return { 
            success: true, 
            data: fallbackValue,
            wasRepaired: false 
          };
        }

        // Try to parse JSON
        try {
          const parsedData = JSON.parse(storedData);
          console.log(`✅ Successfully loaded ${key}`);
          return { 
            success: true, 
            data: parsedData,
            wasRepaired: false 
          };
        } catch (parseError) {
          console.warn(`⚠️ JSON parse error for ${key}:`, parseError);
          
          // Try to repair corrupted JSON
          const repairResult = await this.attemptRepair(key, storedData, fallbackValue, repairAttempts);
          if (repairResult.success) {
            return {
              success: true,
              data: repairResult.data as T,
              wasRepaired: true
            };
          }

          // If repair failed and this is the last attempt, use fallback
          if (attempt === maxRetries) {
            console.error(`❌ All repair attempts failed for ${key}, using fallback`);
            await this.safeSave(key, fallbackValue);
            return {
              success: true,
              data: fallbackValue,
              wasRepaired: true
            };
          }
        }

      } catch (error) {
        console.error(`❌ Storage access error for ${key} (attempt ${attempt}):`, error);
        
        if (attempt === maxRetries) {
          return {
            success: false,
            error: `Failed to load ${key} after ${maxRetries} attempts`,
            data: fallbackValue
          };
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
      }
    }

    return {
      success: false,
      error: 'Unexpected error in safeLoad',
      data: fallbackValue
    };
  }

  /**
   * ATTEMPT TO REPAIR CORRUPTED JSON DATA
   */
  private async attemptRepair<T>(
    key: string, 
    corruptedData: string, 
    fallbackValue: T,
    maxAttempts: number
  ): Promise<SafeStorageResult<T>> {
    console.log(`🛠️ Attempting to repair corrupted data for: ${key}`);
    
    const repairStrategies = [
      // Strategy 1: Try to fix common JSON issues
      () => this.fixCommonJsonIssues(corruptedData),
      
      // Strategy 2: Extract valid JSON substring
      () => this.extractValidJson(corruptedData),
      
      // Strategy 3: Try parsing as different formats
      () => this.tryAlternativeParsing(corruptedData)
    ];

    for (let attempt = 0; attempt < Math.min(repairStrategies.length, maxAttempts); attempt++) {
      try {
        const repairedJson = repairStrategies[attempt]();
        if (repairedJson) {
          const parsedData = JSON.parse(repairedJson);
          
          // Save repaired data back to storage
          await this.safeSave(key, parsedData);
          console.log(`✅ Successfully repaired ${key} with strategy ${attempt + 1}`);
          
          return {
            success: true,
            data: parsedData,
            wasRepaired: true
          };
        }
      } catch (error) {
        console.log(`❌ Repair strategy ${attempt + 1} failed:`, error);
      }
    }

    // All repair strategies failed, use fallback
    console.log(`❌ All repair strategies failed for ${key}, using fallback`);
    await this.safeSave(key, fallbackValue);
    return {
      success: true,
      data: fallbackValue,
      wasRepaired: true
    };
  }

  /**
   * FIX COMMON JSON ISSUES
   */
  private fixCommonJsonIssues(corruptedData: string): string | null {
    try {
      let fixedData = corruptedData;

      // Fix 1: Remove BOM characters
      fixedData = fixedData.replace(/^\uFEFF/, '');

      // Fix 2: Fix trailing commas
      fixedData = fixedData.replace(/,\s*([\]}])/g, '$1');

      // Fix 3: Fix missing quotes around keys
      fixedData = fixedData.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');

      // Fix 4: Remove extra characters at the end
      fixedData = fixedData.replace(/,[\s\r\n]*$/g, '');

      // Test if fixed data is valid JSON
      JSON.parse(fixedData);
      return fixedData;
    } catch {
      return null;
    }
  }

  /**
   * EXTRACT VALID JSON SUBSTRING
   */
  private extractValidJson(corruptedData: string): string | null {
    try {
      // Try to find valid JSON object or array
      const objectMatch = corruptedData.match(/\{[\s\S]*\}/);
      const arrayMatch = corruptedData.match(/\[[\s\S]*\]/);

      const candidates = [];
      if (objectMatch) candidates.push(objectMatch[0]);
      if (arrayMatch) candidates.push(arrayMatch[0]);

      for (const candidate of candidates) {
        try {
          JSON.parse(candidate);
          return candidate;
        } catch {
          // Continue to next candidate
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * TRY ALTERNATIVE PARSING METHODS
   */
  private tryAlternativeParsing(corruptedData: string): string | null {
    try {
      // Try wrapping in array if it's a collection of objects
      if (corruptedData.trim().startsWith('{') && !corruptedData.trim().endsWith('}')) {
        const wrapped = `[${corruptedData}]`;
        JSON.parse(wrapped);
        return wrapped;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * SAFELY SAVE DATA TO STORAGE
   */
  async safeSave<T>(
    key: string, 
    data: T, 
    options: {
      maxRetries?: number;
    } = {}
  ): Promise<SafeStorageResult<void>> {
    const { maxRetries = 3 } = options;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const jsonString = JSON.stringify(data, null, 2);
        await AsyncStorage.setItem(key, jsonString);
        console.log(`💾 Successfully saved ${key}`);
        
        return { success: true };
      } catch (error) {
        console.error(`❌ Save error for ${key} (attempt ${attempt}):`, error);
        
        if (attempt === maxRetries) {
          return {
            success: false,
            error: `Failed to save ${key} after ${maxRetries} attempts`
          };
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
      }
    }

    return {
      success: false,
      error: 'Unexpected error in safeSave'
    };
  }

  /**
   * SAFELY REMOVE DATA FROM STORAGE
   */
  async safeRemove(
    key: string,
    options: {
      maxRetries?: number;
    } = {}
  ): Promise<SafeStorageResult<void>> {
    const { maxRetries = 3 } = options;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await AsyncStorage.removeItem(key);
        console.log(`🗑️ Successfully removed ${key}`);
        
        return { success: true };
      } catch (error) {
        console.error(`❌ Remove error for ${key} (attempt ${attempt}):`, error);
        
        if (attempt === maxRetries) {
          return {
            success: false,
            error: `Failed to remove ${key} after ${maxRetries} attempts`
          };
        }
        
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
      }
    }

    return {
      success: false,
      error: 'Unexpected error in safeRemove'
    };
  }

  /**
   * CHECK IF STORAGE KEY EXISTS AND IS VALID
   */
  async checkStorageHealth<T>(
    key: string, 
    fallbackValue: T
  ): Promise<{
    exists: boolean;
    isValid: boolean;
    canRepair: boolean;
    suggestedAction: 'healthy' | 'repair' | 'replace';
  }> {
    try {
      const storedData = await AsyncStorage.getItem(key);
      
      if (!storedData) {
        return {
          exists: false,
          isValid: false,
          canRepair: false,
          suggestedAction: 'replace'
        };
      }

      try {
        JSON.parse(storedData);
        return {
          exists: true,
          isValid: true,
          canRepair: true,
          suggestedAction: 'healthy'
        };
      } catch {
        // Try to see if we can repair it
        const testRepair = this.fixCommonJsonIssues(storedData);
        return {
          exists: true,
          isValid: false,
          canRepair: !!testRepair,
          suggestedAction: testRepair ? 'repair' : 'replace'
        };
      }
    } catch (error) {
      console.error(`❌ Storage health check failed for ${key}:`, error);
      return {
        exists: false,
        isValid: false,
        canRepair: false,
        suggestedAction: 'replace'
      };
    }
  }
}

export const safeStorage = new SafeStorage();