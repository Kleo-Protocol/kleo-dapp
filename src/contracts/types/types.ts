/**
 * Configuration options for the Kleo SDK client
 */
export interface KleoConfig {
  /**
   * WebSocket endpoint for the blockchain connection
   * @default "wss://asset-hub-paseo.dotters.network"
   */
  endpoint?: string;
  
  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;

  /**
   * Supabase project URL
   * @default process.env.SUPABASE_URL
   */
  supabaseUrl?: string;

  /**
   * Supabase anonymous key
   * @default process.env.SUPABASE_ANON_KEY
   */
  supabaseAnonKey?: string;
}

/**
 * Options for API requests
 */
export interface RequestOptions {
  /**
   * Additional headers to include in the request
   */
  headers?: Record<string, string>;
  
  /**
   * Request timeout in milliseconds
   */
  timeout?: number;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  /**
   * Response data
   */
  data: T;
  
  /**
   * Response status code
   */
  status: number;
  
  /**
   * Response message
   */
  message?: string;
}

/**
 * Error response from the API
 */
export interface ApiError {
  /**
   * Error code
   */
  code: string;
  
  /**
   * Error message
   */
  message: string;
  
  /**
   * Additional error details
   */
  details?: Record<string, any>;
}
