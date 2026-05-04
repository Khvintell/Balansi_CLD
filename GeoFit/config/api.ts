/**
 * Balansi API Configuration
 * Centralized server address for AI scanners and data synchronization.
 */

// Use your Vercel URL here after deployment
const PRODUCTION_URL = 'https://balansi-api.vercel.app'; 
const LOCAL_URL = 'http://192.168.1.16:8000';

// FOR TESTING: Always use Production URL
export const SERVER_URL = PRODUCTION_URL; 

export const API_ENDPOINTS = {
  VERIFY_WEIGHT: `${SERVER_URL}/verify-weight`,
  SYNC_BIOMETRICS: `${SERVER_URL}/api/sync-biometrics`,
  RECIPES: `${SERVER_URL}/recipes/`,
  SCAN_FOOD: `${SERVER_URL}/api/scan-food`,
};
