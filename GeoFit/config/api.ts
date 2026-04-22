/**
 * Balansi API Configuration
 * Centralized server address for AI scanners and data synchronization.
 */

export const SERVER_IP = '192.168.1.107';
export const SERVER_PORT = '8000';
export const SERVER_URL = `http://${SERVER_IP}:${SERVER_PORT}`;

export const API_ENDPOINTS = {
  VERIFY_WEIGHT: `${SERVER_URL}/verify-weight`,
  // Add other endpoints as needed
};
