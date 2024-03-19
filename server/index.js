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
(() => __awaiter(void 0, void 0, void 0, function* () {
    for (const event of ['uncaughtException', 'unhandledRejection']) {
        process.on(event, e => {
            console.error(e);
        });
    }
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
            delete user.roleid;
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
        const client = yield ProxmoxClient_1.ProxmoxClient.admin();
        body.enable = 0;
        body.expire = 0;
        yield client.createUser(body);
        res.json({ ok: true });
    }));
    app.listen(8080, () => console.log('Server running on port 8080'));
}))();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEscUNBQThCO0FBQzlCLG1EQUEyRDtBQUMzRCxtREFBZ0Q7QUFFaEQsQ0FBQyxHQUFTLEVBQUU7SUFDVixLQUFLLE1BQU0sS0FBSyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsb0JBQW9CLENBQUMsRUFBRSxDQUFDO1FBQ2hFLE9BQU8sQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFO1lBQ3BCLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsSUFBQSxhQUFHLEVBQUMsOEJBQThCLENBQUMsQ0FBQztJQUNwQyxNQUFNLEtBQUssR0FBRyxNQUFNLDZCQUFhLENBQUMsS0FBSyxFQUFFLENBQUM7SUFFMUMsSUFBQSxhQUFHLEVBQUMsb0JBQW9CLENBQUMsQ0FBQztJQUMxQixNQUFNLEdBQUcsR0FBRyxJQUFBLGlCQUFPLEdBQUUsQ0FBQztJQUV0QixvQkFBb0I7SUFDcEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFBLGNBQUksR0FBRSxDQUFDLENBQUM7SUFFaEIsc0NBQXNDO0lBQ3RDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFO1FBQ3pCLElBQUEsYUFBRyxFQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3pCLElBQUksRUFBRSxDQUFDO0lBQ1QsQ0FBQyxDQUFDLENBQUM7SUFFSCxhQUFhO0lBQ2IsR0FBRyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsQ0FBTyxHQUFZLEVBQUUsR0FBYSxFQUFFLEVBQUU7UUFDMUQsTUFBTSxHQUFHLEdBQUcsTUFBTSxLQUFLLENB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