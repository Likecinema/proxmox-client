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
        const loginResponse = yield ProxmoxClient_1.ProxmoxClient.login(`${constants_1.PROXMOX_ADMIN_USER}@${constants_1.PROXMOX_ENV}`, constants_1.PROXMOX_ADMIN_PASS);
        body.enable = 0;
        body.expire = 0;
        const client = new ProxmoxClient_1.ProxmoxClient(loginResponse);
        yield client.createUser(body);
        res.json({ ok: true });
    }));
    app.listen(8080, () => console.log('Server running on port 8080'));
}))();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEscUNBQThCO0FBQzlCLG1EQUEyRDtBQUMzRCxtREFBZ0Q7QUFDaEQsMkNBQWtGO0FBRWxGLENBQUMsR0FBUyxFQUFFO0lBQ1YsS0FBSyxNQUFNLEtBQUssSUFBSSxDQUFDLG1CQUFtQixFQUFFLG9CQUFvQixDQUFDLEVBQUUsQ0FBQztRQUNoRSxPQUFPLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsRUFBRTtZQUNwQixPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25CLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELElBQUEsYUFBRyxFQUFDLDhCQUE4QixDQUFDLENBQUM7SUFDcEMsTUFBTSxLQUFLLEdBQUcsTUFBTSw2QkFBYSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBRTFDLElBQUEsYUFBRyxFQUFDLG9CQUFvQixDQUFDLENBQUM7SUFDMUIsTUFBTSxHQUFHLEdBQUcsSUFBQSxpQkFBTyxHQUFFLENBQUM7SUFFdEIsb0JBQW9CO0lBQ3BCLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBQSxjQUFJLEdBQUUsQ0FBQyxDQUFDO0lBRWhCLHNDQUFzQztJQUN0QyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTtRQUN6QixJQUFBLGFBQUcsRUFBQyxHQUFHLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN6QixJQUFJLEVBQUUsQ0FBQztJQUNULENBQUMsQ0FBQyxDQUFDO0lBRUgsYUFBYTtJQUNiLEdBQUcsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLENBQU8sR0FBWSxFQUFFLEdBQWEsRUFBRSxFQUFFO1FBQzFELE1BQU0sR0FBRyxHQUFHLE1BQU0sS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBRWpDLE1BQU0sS0FBSyxHQUFHLE1BQU0sNkJBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7UUFFdkQsR0FBRyxDQUFDLElBQUksQ0FDTixLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTs7WUFBQyxPQUFBLGlDQUNsQixJQUFJLEtBQ1AsTUFBTSxFQUFFLE1BQUEsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsMENBQUUsTUFBTSxJQUNoRSxDQUFBO1NBQUEsQ0FBQyxDQUNKLENBQUM7SUFDSixDQUFDLENBQUEsQ0FBQyxDQUFDO0lBRUgsY0FBYztJQUNkLEdBQUcsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLEVBQUUsQ0FBTyxHQUFZLEVBQUUsR0FBYSxFQUFFLEVBQUU7UUFDckUsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFFakMsTUFBTSw2QkFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFakQsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ3pCLENBQUMsQ0FBQSxDQUFDLENBQUM7SUFFSCxjQUFjO0lBQ2QsR0FBRyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBTyxHQUFZLEVBQUUsR0FBYSxFQUFFLEVBQUU7UUFDM0QsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQztRQUN0QixNQUFNLE1BQU0sR0FBRyw2QkFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUV2QyxNQUFNLFlBQVksR0FBRyxNQUFNLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRXZELElBQUksWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3RCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7WUFFM0IsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBRW5CLE1BQU0sTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRTNDLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ1gsTUFBTSxHQUFHLEdBQUcsTUFBTSxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ2xDLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRWxFLElBQUksTUFBTSxNQUFLLFFBQVEsYUFBUixRQUFRLHVCQUFSLFFBQVEsQ0FBRSxNQUFNLENBQUEsRUFBRSxDQUFDO29CQUNoQyxJQUFBLGFBQUcsRUFBQywyQkFBMkIsUUFBUSxhQUFSLFFBQVEsdUJBQVIsUUFBUSxDQUFFLE1BQU0sT0FBTyxNQUFNLFFBQVEsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7Z0JBQ3JGLENBQUM7WUFDSCxDQUFDO1FBQ0gsQ0FBQzthQUFNLENBQUM7WUFDTixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7WUFFbkIsTUFBTSxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hDLENBQUM7UUFFRCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDekIsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUVILGFBQWE7SUFDYixHQUFHLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxDQUFPLEdBQVksRUFBRSxHQUFhLEVBQUUsRUFBRTtRQUMxRCxNQUFNLEtBQUssR0FBRyxNQUFNLDZCQUFhLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBRXZELEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUNoRCxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBRUgsa0RBQWtEO0lBQ2xELEdBQUcsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEVBQUUsQ0FBTyxHQUFZLEVBQUUsR0FBYSxFQUFFLEVBQUU7UUFDaEUsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQVcsQ0FBQztRQUMzQyxNQUFNLEdBQUcsR0FBRyxNQUFNLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNqQyxNQUFNLGFBQWEsR0FBRyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1RSxNQUFNLE1BQU0sR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzNDLE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxNQUFNLENBQUMsQ0FBQztRQUV6RCxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ1AsT0FBTyxFQUFFLENBQUEsSUFBSSxhQUFKLElBQUksdUJBQUosSUFBSSxDQUFFLE1BQU0sTUFBSyxVQUFVO1NBQ3JDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQSxDQUFDLENBQUM7SUFFSCx5QkFBeUI7SUFDekIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsQ0FBTyxHQUFZLEVBQUUsR0FBYSxFQUFFLEVBQUU7UUFDM0QsR0FBRyxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUNqQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDekIsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUVILFFBQVE7SUFDUixHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFPLEdBQVksRUFBRSxHQUFhLEVBQUUsRUFBRTtRQUMzRCxNQUFNLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFFeEMsTUFBTSxRQUFRLEdBQUcsTUFBTSw2QkFBYSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFFL0QsR0FBRyxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRTdDLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDUCxtQkFBbUIsRUFBRSxRQUFRLENBQUMsU0FBUztTQUN4QyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBRUgsU0FBUztJQUNULEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQU8sR0FBWSxFQUFFLEdBQWEsRUFBRSxFQUFFO1FBQzVELE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFFdEIsTUFBTSxhQUFhLEdBQUcsTUFBTSw2QkFBYSxDQUFDLEtBQUssQ0FDN0MsR0FBRyw4QkFBa0IsSUFBSSx1QkFBVyxFQUFFLEVBQ3RDLDhCQUFrQixDQUNuQixDQUFDO1FBRUYsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDaEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFFaEIsTUFBTSxNQUFNLEdBQUcsSUFBSSw2QkFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBRWhELE1BQU0sTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUU5QixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDekIsQ0FBQyxDQUFBLENBQUMsQ0FBQztJQUVILEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsNkJBQTZCLENBQUMsQ0FBQyxDQUFDO0FBQ3JFLENBQUMsQ0FBQSxDQUFDLEVBQUUsQ0FBQyJ9