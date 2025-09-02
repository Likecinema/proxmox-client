import { SECRET_USERNAME, SECRET_PASSWORD } from "./credentials";

export const PROXMOX_HOST = "http://localhost:8080";
export const PROXMOX_ADMIN_USER = SECRET_USERNAME
export const PROXMOX_ADMIN_PASS = SECRET_PASSWORD
export const PROXMOX_ENV = "pve";

//VM requests
export const REQUEST_DB_URL = "http://localhost:5555";

//spark requests
export const SPARK_API_URL = "http://localhost:5000";

export const PROXMOX_API_URL = "http://localhost:8080";

export const ALLOW_FAKE_DATA = true;
export const FAIL_FALLBACK = true;
export const FORCE_FAKE_DATA = true;