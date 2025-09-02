import { Request } from 'express';
import { PROXMOX_ADMIN_PASS, PROXMOX_ADMIN_USER, PROXMOX_ENV, PROXMOX_HOST } from './constants';
import { failFallback } from './mockUtils/overrides';
import { getACL, getAdmin, getAllUsers, getLogin, getRoles, getUser } from './mockUtils/fakeProxmoxHost';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export class ProxmoxClient {
  public static from(req: Request) {
    return new ProxmoxClient({
      ticket: this.getTicketFromCookie(req.get('cookie') as string),
      csrfToken: req.get('CSRFPreventionToken') as string,
    });
  }
  @failFallback("cant get admin", getAdmin())
  public static async admin() {
    const response = await this.login(`${PROXMOX_ADMIN_USER}@${PROXMOX_ENV}`, PROXMOX_ADMIN_PASS);
    return new ProxmoxClient(response);
  }

  @failFallback("can't login", getLogin())
  public static async login(username: string, password: string) {
    const response:any = await fetch(PROXMOX_HOST + '/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    }).then(response => response.json() as Promise<{
        CSRFPreventionToken: string;
        clustername: null;
        roles: Array<'ROLE_USER' | 'ROLE_ADMIN' | 'ROLE_MODERATOR'>;
        ticket: string;
        username: string;
    }>);
    return {
      ticket: response.ticket,
      csrfToken: response.CSRFPreventionToken,
      clustername: response.clustername,
      roles: response.roles,
      username: response.username,
    };
  }
  private static getTicketFromCookie(cookie: string) {
    return decodeURIComponent(cookie.split('PVEAuthCookie=')[1]);
  }
  private readonly serviceUrl = PROXMOX_HOST;
  public constructor(private readonly options: IProxmoxClientOptions) { }

  @failFallback("can't get roles", getRoles())
  public async getRoles() {
    return await this.get<{
      data: Array<{ roleid: string }>;
    }>('/api2/json/access/roles');
  }

  @failFallback("can't get users", getAllUsers())
  public async getUsers() {
    return await this.get<{
      data: IListedUser[];
    }>('/api2/json/access/users');
  }

  @failFallback("can't get user", getUser())
  public async getUser(userid: string) {
    if (!userid.includes('@')) {
      userid += `@${PROXMOX_ENV}`;
    }

    return await this.get<{
      data: IUserInfo;
    }>(`/api2/json/access/users/${userid}`);
  }

  @failFallback("can't get ACL", getACL())
  public async getACL() {
    return await this.get<{
      data: IACL[];
    }>('/api2/json/access/acl');
  }

  @failFallback("can't create user")
  public async createUser(user: {
    userid: string;
    password: string;
    email: string;
    firstname: string;
    lastname: string;
    comment: string;
    enable: 0 | 1;
  }) {
    if (!user.userid.includes('@')) {
      user.userid += `@${PROXMOX_ENV}`;
    }

    return await this.post('/api2/json/access/users', user);
  }

  @failFallback("cant delete user")
  public async deleteUser(userid: string) {
    return await this.delete(`/api2/json/access/users/${userid}`);
  }

  @failFallback("can't update user")
  public async updateUser(userid: string, user: {
    password: string;
    email: string;
    firstname: string;
    lastname: string;
    comment: string;
    enable: 0 | 1;
  }) {
    return await this.put(`/api2/json/access/users/${userid}`, user);
  }

  private async get<T>(path: string) {
    return await this.request<T>(path, {
      method: 'GET',
    });
  }
  private async delete(path: string) {
    return await this.request(path, {
      method: 'DELETE',
    });
  }
  private async put<T>(path: string, body: any) {
    return await this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }
  private async post<T>(path: string, body: any) {
    return await this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }
  private async request<T>(path: string, options: RequestInit) {
    const response = await fetch(this.serviceUrl + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `PVEAuthCookie=${this.options.ticket}`,
        'CSRFPreventionToken': this.options.csrfToken,
        ...options.headers,
      },
    }).catch((e) => {
      return undefined;
  });
  if (!response) {
      return Promise.reject() as T;
  };
    return await response.json() as T;
  }
}

export interface IProxmoxClientOptions {
  ticket: string;
  csrfToken: string;
}

export interface IACL {
  path: string;
  propagate: 1 | 0;
  roleid: string;
  type: 'user';
  ugid: string;
}

export interface IListedUser {
  enable: 0 | 1;
  expire: number;
  firstname: string;
  lastname: string;
  'realm-type': 'pve' | 'pam';
  /** Suffixed with `@<realm-type>`. */
  userid: string;
}

export interface IUserInfo {
  comment: string;
  email: string;
  enable: 0 | 1;
  expire: number;
  firstname: string;
  lastname: string;
}
