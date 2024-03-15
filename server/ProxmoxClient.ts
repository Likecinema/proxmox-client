import { Request } from 'express';
import { PROXMOX_ADMIN_PASS, PROXMOX_ADMIN_USER, PROXMOX_ENV, PROXMOX_HOST } from './constants';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export class ProxmoxClient {
  public static from(req: Request) {
    return new ProxmoxClient({
      ticket: this.getTicketFromCookie(req.get('cookie') as string),
      csrfToken: req.get('CSRFPreventionToken') as string,
    });
  }
  public static async admin() {
    const response = await this.login(`${PROXMOX_ADMIN_USER}@${PROXMOX_ENV}`, PROXMOX_ADMIN_PASS);

    return new ProxmoxClient(response);
  }
  public static async login(username: string, password: string) {
    const response = await fetch(PROXMOX_HOST + '/api2/json/access/ticket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    }).then(response => response.json() as Promise<{
      data: {
        CSRFPreventionToken: string;
        ticket: string;
      };
    }>);

    return {
      ticket: response.data.ticket,
      csrfToken: response.data.CSRFPreventionToken,
    };
  }
  private static getTicketFromCookie(cookie: string) {
    return decodeURIComponent(cookie.split('PVEAuthCookie=')[1]);
  }
  private readonly serviceUrl = PROXMOX_HOST;
  public constructor(private readonly options: IProxmoxClientOptions) { }
  public async getRoles() {
    return await this.get<{
      data: Array<{ roleid: string }>;
    }>('/api2/json/access/roles');
  }
  public async getUsers() {
    return await this.get<{
      data: IListedUser[];
    }>('/api2/json/access/users');
  }
  public async getUser(userid: string) {
    if (!userid.includes('@')) {
      userid += `@${PROXMOX_ENV}`;
    }

    return await this.get<{
      data: IUserInfo;
    }>(`/api2/json/access/users/${userid}`);
  }
  public async getACL() {
    return await this.get<{
      data: IACL[];
    }>('/api2/json/access/acl');
  }
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
  public async deleteUser(userid: string) {
    return await this.delete(`/api2/json/access/users/${userid}`);
  }
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
    });

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
