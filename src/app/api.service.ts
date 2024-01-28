import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor() { }
  public async login(username: string, password: string) {
    const response = await this.post<{
      data: {
        ticket: string;
      }
    }>('/api/login', { username, password });

    if (!response.data?.ticket) {
      throw new Error('Unauthorized');
    }

    this.setTicket(response.data.ticket);
  }
  public async signup(body: ISignupRequestBody) {
    await this.post('/api/signup', body);
  }
  private setTicket(ticket: string) {
    localStorage.setItem('ticket', ticket);
  }
  private getTicket() {
    return localStorage.getItem('ticket');
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
  private async request<T>(url: string, init?: RequestInit | undefined) {
    const ticket = this.getTicket();

    if (ticket) {
      init = init || {};
      init.headers = init.headers || {};

      Object.assign(init.headers, {
        'Authorization': `Bearer ${ticket}`
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
