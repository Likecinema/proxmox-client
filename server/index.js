"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const console_1 = require("console");
const express_1 = __importStar(require("express"));
const ProxmoxClient_1 = require("./ProxmoxClient");
const constants_1 = require("./constants");
(() => __awaiter(void 0, void 0, void 0, function* () {
    (0, console_1.log)('Getting admin credentials...');
    const admin = yield ProxmoxClient_1.ProxmoxClient.admin();
    (0, console_1.log)('Starting server...');
    const app = (0, express_1.default)();
    // Parse json bodies
    app.use((0, express_1.json)());
    // Log requests (e.g. POST /api/users)
    app.use((req, res, next) => {
        (0, console_1.log)(req.method, req.url);
        next();
    });
    // List users
    app.get('/api/users', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const acl = yield admin.getACL();
        const users = yield ProxmoxClient_1.ProxmoxClient.from(req).getUsers();
        res.json(users.data.map(user => {
            var _a;
            return (Object.assign(Object.assign({}, user), { roleid: (_a = acl.data.find(role => role.ugid === user.userid)) === null || _a === void 0 ? void 0 : _a.roleid }));
        }));
    }));
    // Delete user
    app.delete('/api/users/:userid', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const userid = req.params.userid;
        yield ProxmoxClient_1.ProxmoxClient.from(req).deleteUser(userid);
        res.json({ ok: true });
    }));
    // Upsert user
    app.post('/api/users', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.body;
        const client = ProxmoxClient_1.ProxmoxClient.from(req);
        const existingUser = yield client.getUser(user.userid);
        if (existingUser.data) {
            const roleid = user.roleid;
            delete user.roleid;
            yield client.updateUser(user.userid, user);
            if (roleid) {
                const acl = yield client.getACL();
                const userRole = acl.data.find(role => role.ugid === user.userid);
                if (roleid !== (userRole === null || userRole === void 0 ? void 0 : userRole.roleid)) {
                    (0, console_1.log)(`Should change role from ${userRole === null || userRole === void 0 ? void 0 : userRole.roleid} to ${roleid} for ${user.userid}`);
                }
            }
        }
        else {
            yield client.createUser(user);
        }
        res.json({ ok: true });
    }));
    // List roles
    app.get('/api/roles', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const roles = yield ProxmoxClient_1.ProxmoxClient.from(req).getRoles();
        res.json(roles.data.map(role => role.roleid));
    }));
    // Get current user permissions (isAdmin: boolean)
    app.get('/api/permissions', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const cookie = req.get('cookie');
        const acl = yield admin.getACL();
        const decodedCookie = decodeURIComponent(cookie.split('PVEAuthCookie=')[1]);
        const userid = decodedCookie.split(':')[1];
        const role = acl.data.find(role => role.ugid === userid);
        res.json({
            isAdmin: (role === null || role === void 0 ? void 0 : role.roleid) === 'PVEAdmin',
        });
    }));
    // Logout (delete cookie)
    app.get('/api/logout', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        res.clearCookie('PVEAuthCookie');
        res.json({ ok: true });
    }));
    // Login
    app.post('/api/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { username, password } = req.body;
        const response = yield ProxmoxClient_1.ProxmoxClient.login(username, password);
        res.cookie('PVEAuthCookie', response.ticket);
        res.json({
            CSRFPreventionToken: response.csrfToken
        });
    }));
    // Signup
    app.post('/api/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const body = req.body;
        const loginResponse = yield ProxmoxClient_1.ProxmoxClient.login(`${constants_1.PROXMOX_ADMIN_USER}@${constants_1.PROXMOX_ENV}`, constants_1.PROXMOX_ADMIN_PASS);
        body.enable = 0;
        body.expire = 0;
        const client = new ProxmoxClient_1.ProxmoxClient(loginResponse);
        yield client.createUser(body);
        res.json({ ok: true });
    }));
    app.listen(8080, () => console.log('Server running on port 8080'));
}))();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEscUNBQThCO0FBQzlCLG1EQUEyRDtBQUMzRCxtREFBZ0Q7QUFDaEQsMkNBQWtGO0FBRWxGLENBQUMsR0FBUyxFQUFFO0lBQ1YsSUFBQSxhQUFHLEVBQUMsOEJBQThCLENBQUMsQ0FBQztJQUNwQyxNQUFNLEtBQUssR0FBRyxNQUFNLDZCQUFhLENBQUMsS0FBSyxFQUFFLENBQUM7SUFFMUMsSUFBQSxhQUFHLEVBQUMsb0JBQW9CLENBQUMsQ0FBQztJQUMxQixNQUFNLEdBQUcsR0FBRyxJQUFBLGlCQUFPLEdBQUUsQ0FBQztJQUV0QixvQkFBb0I7SUFDcEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFBLGNBQUksR0FBRSxDQUFDLENBQUM7SUFFaEIsc0NBQXNDO0lBQ3RDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFO1FBQ3pCLElBQUEsYUFBRyxFQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3pCLElBQUksRUFBRSxDQUFDO0lBQ1QsQ0FBQyxDQUFDLENBQUM7SUFFSCxhQUFhO0lBQ2IsR0FBRyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBTyxHQUFZLEVBQUUsR0FBYSxFQUFFLEVBQUU7UUFDMUQsTUFBTSxHQUFHLEdBQUcsTUFBTSxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7UUFFakMsTUFBTSxLQUFLLEdBQUcsTUFBTSw2QkFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUV2RCxHQUFHLENBQUMsSUFBSSxDQUNOLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFOztZQUFDLE9B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