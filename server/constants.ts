import { config } from 'dotenv';

config();

export const PROXMOX_HOST = "https://150.140.193.82:8006";
export const PROXMOX_ADMIN_USER = process.env.PROXMOX_ADMIN_USER as string;
export const PROXMOX_ADMIN_PASS = process.env.PROXMOX_ADMIN_PASS as string;
export const PROXMOX_ENV = "pve";
