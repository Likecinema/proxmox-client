import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  public readonly isAdmin = signal(false);
  constructor() { }
  public async login(username: string, password: string) {
    const response = await this.post<ISignInResponse>('/api/auth/signin', { username, password });

    if (!response?.CSRFPreventionToken) {
      throw new Error('Unauthorized');
    }

    this.setTicket(response);
  }
  public async logout() {
    await this.get('/api/logout');
    this.remoteTicket();
    this.isAdmin.set(false);
  }
  public async createUser(user: {
    userid: string;
    password: string;
    email: string;
    firstname: string;
    lastname: string;
    comment: string;
    roleid?: string;
    enable: 0 | 1;
  }) {
    await this.post('/api/users', user);
  }
  public async getUsers() {
    return await this.get<IUser[]>('/api/users');
  }
  public async deleteUser(userid: string) {
    await this.delete(`/api/users/${userid}`);
  }
  public async getRoles() {
    return await this.get<string[]>('/api/roles');
  }
  public hasAdminRole() {
    const ticket = this.getTicket();

    return Boolean(ticket?.roles.includes('ROLE_ADMIN'));
  }
  public async signup(body: ISignupRequestBody) {
    await this.post('/api/auth/signup', body);
  }
  public getTicket() {
    const ticketJson = localStorage.getItem('ticket');

    try {
      return JSON.parse(ticketJson!) as ISignInResponse;
    } catch { }

    return;
  }
  private setTicket(ticketResponse: { CSRFPreventionToken: string; }) {
    localStorage.setItem('ticket', JSON.stringify(ticketResponse));
  }
  private async remoteTicket() {
    localStorage.removeItem('ticket');
  }
  private async post<T>(url: string, body: any) {
    return await this.request<T>(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  private async get<T>(url: string) {
    return await this.request<T>(url);
  }
  private async delete<T>(url: string) {
    return await this.request<T>(url, {
      method: 'DELETE'
    });
  }
  private async request<T>(url: string, init?: RequestInit | undefined) {
    const ticket = this.getTicket();

    if (ticket) {
      init = init || {};
      init.headers = init.headers || {};

      Object.assign(init.headers, {
        CSRFPreventionToken: ticket.CSRFPreventionToken,
      });
    }

    const result = await fetch(url, init);

    if (!result.ok) {
      throw result;
    }

    return await result.json() as T;
  }
}

interface ISignupRequestBody {
  username: string;
  password: string;
  email: string;
}

interface ISignInResponse {
  CSRFPreventionToken: string;
  clustername: null;
  roles: Array<'ROLE_USER' | 'ROLE_ADMIN' | 'ROLE_MODERATOR'>;
  ticket: string;
  username: string;
}

export interface IUser {
  comment?: string;
  email: string;
  enable: 0 | 1;
  expire: number;
  firstname: string;
  lastname: string;
  'realm-type': string;
  userid: string;
  roleid?: string;
};
