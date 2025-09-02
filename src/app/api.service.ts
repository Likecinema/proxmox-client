import { Injectable, signal } from '@angular/core';
import { INodeInfo, INodeMetric, IProxMoxUserCreateRequest, IProxMoxUserRequest, ISignInResponse, ISignupRequestBody, IUploadExecutable, IUser, IUserJobs } from './interfaces';
import { NzUploadFile } from 'ng-zorro-antd/upload';

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
  public async getRequests() {
    const req = await this.get<IProxMoxUserRequest[]>('/api/user/vms');
    return req;
  }

  public async createJob(req: {username: string, status: string, priority: number, options: any, additionalOptions: any}) {
    return await this.post("/spark-job", req, true)
  }
  public async createRequest(request: IProxMoxUserCreateRequest) {
    return await this.post('/api/user/vm/create', request);
  }
  public async deleteRequest(id: number) {
    return await this.delete(`/api/user/vm/delete?ids=${id}`);
  }
  public async resetPassword(email: string) {
    return await this.post('/api/auth/resetpassword', { email });
  }
  public async getClusterInfo() {
    return await this.get('/api/admin/cluster');
  }
  public async getNodeInfo() {
    return await this.get('/api/node/info') as INodeInfo[];
  }
  public async getNodeMetrics(nodeId: string) {
    return await this.get(`/api/node/resources/${nodeId}/metrics?timeframe=hour`) as INodeMetric[];
  }
  public async getNodeResourceInfo(nodeId: string, resource: 'vm' | 'lxc') {
    return await this.get(`/api/node/resources/${nodeId}/${resource}`);
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

  public async deleteJob(id:string) {
    return await this.delete(`/spark-job/${id}`, true)
  }

  public async getJob(jobid:string) {
    return await this.get(`/spark-job/${jobid}`, true)
  }

  public async updateJob(job: IUserJobs) {
    this.put(`/spark-job/${job.id}`, job, true)
  }

  public async getUserJobs(userid?: string) {
    let res;
    if (this.isAdmin()) {
      res = res = this.get<IUserJobs[]>(`/spark-job`, true);
    }
    else if (userid) {
      res = this.get<IUserJobs[]>(`/spark-job/${userid}`, true) 
    }
    else {
      res = this.get<IUserJobs[]>(`/spark-job`, true);
    }
    return res;
  }

  public async uploadJobExecutable(data: any) {
    const ticket = this.getTicket();
    if (!ticket) {
      console.warn("no ticket, can't upload");
      return;
    }
    const formData = new FormData();
    formData.append("spark_exe", data);
    formData.append("user", `${localStorage.getItem("username")}`);
    const headers = new Headers();
    headers.append("CSRFPreventionToken", ticket.CSRFPreventionToken);
    headers.append("Ticket", ticket.ticket);
    headers.append
    const res = await fetch('/upload_executable', {
      method: "POST",
      body: formData,
      headers: headers,
    });
    if (!res.ok) {
      console.error("upload result not okay");
      return;
    }
    return res.json()
  }

  public async deleteExecutable(filename:string) {
    return await this.delete(`upload_executable/${filename}`, true)
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
  private setTicket(ticketResponse: ISignInResponse) {
    localStorage.setItem('ticket', JSON.stringify(ticketResponse));
    localStorage.setItem('username',JSON.stringify(ticketResponse.username));
    // Write cookie
    document.cookie = `PVEAuthCookie=${ticketResponse.ticket}; path=/;`;
  }
  private async remoteTicket() {
    localStorage.removeItem('ticket');
    localStorage.removeItem('username');
  }
  private async post<T>(url: string, body: any, useTicket: boolean = false, headers = {}) {
    return await this.request<T>(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      }
    }, useTicket);
  }
  private async get<T>(url: string, useTicket = false) {
    return await this.request<T>(url,undefined, useTicket);
  }
  private async delete<T>(url: string, useTicket = false) {
    return await this.request<T>(url, {
      method: 'DELETE'
    }, useTicket);
  }

  private async put<T>(url: string, data: any, useTicket = false) {
      return this.request(url, {
        method: 'PUT',
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify(data),
      })
  }
  private async request<T>(url: string, init?: RequestInit | undefined, useTicket = false) {
    const ticket = this.getTicket();

    if (ticket) {
      init = init || {};
      init.headers = init.headers || {};

      Object.assign(init.headers, {
        CSRFPreventionToken: ticket.CSRFPreventionToken,
      });
      if (useTicket) {
        Object.assign(init.headers, 
          {Ticket: ticket.ticket}
        )
      }
    }

    const result = await fetch(url, init);
    if (!result.ok) {
      throw result;
    }

    return await result.json() as T;
  }
}