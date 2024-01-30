import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  public readonly isAdmin = signal(false);
  constructor() { }
  public async login(username: string, password: string) {
    const response = await this.post<{
      CSRFPreventionToken: string;
    }>('/api/login', { username, password });

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
  public async getPermissions() {
    return await this.get<{
      isAdmin: boolean;
    }>('/api/permissions');
  }
  public async signup(body: ISignupRequestBody) {
    await this.post('/api/signup', body);
  }
  public getTicket() {
    const ticketJson = localStorage.getItem('ticket');

    try {
      return JSON.parse(ticketJson!) as {
        ticket: string;
        CSRFPreventionToken: string;
      };
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
  firstName: string;
  lastName: string;
  comment: string;
}
