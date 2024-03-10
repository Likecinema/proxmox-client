"use strict";
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
exports.ProxmoxClient = void 0;
const constants_1 = require("./constants");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
class ProxmoxClient {
    static from(req) {
        return new ProxmoxClient({
            ticket: this.getTicketFromCookie(req.get('cookie')),
            csrfToken: req.get('CSRFPreventionToken'),
        });
    }
    static admin() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.login(`${constants_1.PROXMOX_ADMIN_USER}@${constants_1.PROXMOX_ENV}`, constants_1.PROXMOX_ADMIN_PASS);
            return new ProxmoxClient(response);
        });
    }
    static login(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(constants_1.PROXMOX_HOST + '/api2/json/access/ticket', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    password,
                }),
            }).then(response => response.json());
            return {
                ticket: response.data.ticket,
                csrfToken: response.data.CSRFPreventionToken,
            };
        });
    }
    static getTicketFromCookie(cookie) {
        return decodeURIComponent(cookie.split('PVEAuthCookie=')[1]);
    }
    constructor(options) {
        this.options = options;
        this.serviceUrl = constants_1.PROXMOX_HOST;
    }
    getRoles() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.get('/api2/json/access/roles');
        });
    }
    getUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.get('/api2/json/access/users');
        });
    }
    getUser(userid) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.get(`/api2/json/access/users/${userid}`);
        });
    }
    getACL() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.get('/api2/json/access/acl');
        });
    }
    createUser(user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!user.userid.includes('@')) {
                user.userid += `@${constants_1.PROXMOX_ENV}`;
            }
            return yield this.post('/api2/json/access/users', user);
        });
    }
    deleteUser(userid) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.delete(`/api2/json/access/users/${userid}`);
        });
    }
    updateUser(userid, user) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.put(`/api2/json/access/users/${userid}`, user);
        });
    }
    get(path) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.request(path, {
                method: 'GET',
            });
        });
    }
    delete(path) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.request(path, {
                method: 'DELETE',
            });
        });
    }
    put(path, body) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.request(path, {
                method: 'PUT',
                body: JSON.stringify(body)
            });
        });
    }
    post(path, body) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.request(path, {
                method: 'POST',
                body: JSON.stringify(body)
            });
        });
    }
    request(path, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(this.serviceUrl + path, Object.assign(Object.assign({}, options), { headers: Object.assign({ 'Content-Type': 'application/json', 'Cookie': `PVEAuthCookie=${this.options.ticket}`, 'CSRFPreventionToken': this.options.csrfToken }, options.headers) }));
            if (!response.ok) {
                throw new Error(yield response.text());
            }
            return yield response.json();
        });
    }
}
exports.ProxmoxClient = ProxmoxClient;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHJveG1veENsaWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIlByb3htb3hDbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQ0EsMkNBQWdHO0FBRWhHLE9BQU8sQ0FBQyxHQUFHLENBQUMsNEJBQTRCLEdBQUcsR0FBRyxDQUFDO0FBRS9DLE1BQWEsYUFBYTtJQUNqQixNQUFNLENBQUMsSUFBSSxDQUFDLEdBQVk7UUFDN0IsT0FBTyxJQUFJLGFBQWEsQ0FBQztZQUN2QixNQUFNLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFXLENBQUM7WUFDN0QsU0FBUyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQVc7U0FDcEQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUNNLE1BQU0sQ0FBTyxLQUFLOztZQUN2QixNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyw4QkFBa0IsSUFBSSx1QkFBVyxFQUFFLEVBQUUsOEJBQWtCLENBQUMsQ0FBQztZQUU5RixPQUFPLElBQUksYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7S0FBQTtJQUNNLE1BQU0sQ0FBTyxLQUFLLENBQUMsUUFBZ0IsRUFBRSxRQUFnQjs7WUFDMUQsTUFBTSxRQUFRLEdBQUcsTUFBTSxLQUFLLENBQUMsd0JBQVksR0FBRywwQkFBMEIsRUFBRTtnQkFDdEUsTUFBTSxFQUFFLE1BQU07Z0JBQ2QsT0FBTyxFQUFFO29CQUNQLGNBQWMsRUFBRSxrQkFBa0I7aUJBQ25DO2dCQUNELElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO29CQUNuQixRQUFRO29CQUNSLFFBQVE7aUJBQ1QsQ0FBQzthQUNILENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUsvQixDQUFDLENBQUM7WUFFSixPQUFP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