"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROXMOX_ENV = exports.PROXMOX_ADMIN_PASS = exports.PROXMOX_ADMIN_USER = exports.PROXMOX_HOST = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
exports.PROXMOX_HOST = "https://150.140.193.82:8006";
exports.PROXMOX_ADMIN_USER = process.env.PROXMOX_ADMIN_USER;
exports.PROXMOX_ADMIN_PASS = process.env.PROXMOX_ADMIN_PASS;
exports.PROXMOX_ENV = "pve";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RhbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29uc3RhbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFnQztBQUVoQyxJQUFBLGVBQU0sR0FBRSxDQUFDO0FBRUksUUFBQSxZQUFZLEdBQUcsNkJBQTZCLENBQUM7QUFDN0MsUUFBQSxrQkFBa0IsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUE0QixDQUFDO0FBQzlELFFBQUEsa0JBQWtCLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBNEIsQ0FBQztBQUM5RCxRQUFBLFdBQVcsR0FBRyxLQUFLLENBQUMifQ==