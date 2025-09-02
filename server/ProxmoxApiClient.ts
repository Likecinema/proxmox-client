import { PROXMOX_API_URL } from "./constants";
import { getAllNodeInfo, getNodeMetrics, getRequests } from "./mockUtils/fakeProxmoxApi";
import { failFallback } from "./mockUtils/overrides";

export class ProxmoxApiClient {
    public constructor(private readonly options: ClientOptions) {}
    public static from(req:any) {
        return new ProxmoxApiClient({
            ticket: this.getTicketFromCookie(req.get('cookie') as string),
            responseType: "json"
        });
    }

    private static getTicketFromCookie(cookie: string) {
      return decodeURIComponent(cookie.split('PVEAuthCookie=')[1]);
    }

    @failFallback("can't get requests", getRequests())
    public static async getRequests(req: Request) {
        const client = ProxmoxApiClient.from(req)
        return await client.get("/api/user/vms")
    }

    @failFallback("can't create VM")
    public static async createRequest(req: any) {
        const client = ProxmoxApiClient.from(req)
        return await client.post("/api/user/vms", req);
    }

    @failFallback("can't delete reqest")
    public static async deleteRequest(req: any, id: any) {
        const client = ProxmoxApiClient.from(req)
        return await client.delete(`/api/user/vm/delete?ids=${id}`);
    }

    @failFallback("can't get vms", getRequests())
    public static async getUserVms(req: any) {
      const client = ProxmoxApiClient.from(req);
      const res = await client.get("/api/user/vms")
      return res;
    }

    @failFallback("can't delete user")
    public static async deleteUser(req: any) {
      const client = ProxmoxApiClient.from(req);
      return await client.delete("/api/users");
    }

    @failFallback("cant't reset password")
    public static async resetPassword(req:any) {
        const client = ProxmoxApiClient.from(req);
        return await client.post("/api/auth/resetpassword", req.body.email);
    }

    @failFallback("can't get node info", getAllNodeInfo())
    public static async getNodeInfo(req:any) {
        const client = ProxmoxApiClient.from(req)
        return await client.get("/api/node/info")
    }

    @failFallback("can't get node metrics", getNodeMetrics())
    public static async getNodeMetrics(req:any, nodeId:any) {
        const client = ProxmoxApiClient.from(req)
        return await client.get(`/api/node/resources/${nodeId}/metrics?timeframe=hour`)
    }

    @failFallback("can't get node resource info", getNodeMetrics())
    public static async getNodeResourceInfo(req: any, nodeId: any, resource: any) {
        const client = ProxmoxApiClient.from(req)
        return await client.get(`/api/node/resources/${nodeId}/${resource}`);
    }

    @failFallback("can't logout")
    public static async logout(req:any) {
        const client = ProxmoxApiClient.from(req);
        return await client.get("/api/logout")
    }

    @failFallback("can't create user")
    public static async createUser(req: any, user: any) {
        const client = ProxmoxApiClient.from(req);
        return await client.post("/api/users", user);
    }

    @failFallback("can't get cluster", [])
    public static async getCluster(req:any) {
      const client = ProxmoxApiClient.from(req);
      return await client.get("/api/admin/cluster");
    }



    private async get<T>(path: string) {
        return await this.request<T>(path, {
          method: 'GET',
        })
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
        const response = await fetch(PROXMOX_API_URL + path, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `PVEAuthCookie=${this.options.ticket}`,
          },
        }).catch((e) => {
          return undefined;
      })
      if (!response) {
          return Promise.reject() as T;
      };
        const res = await response.json();
        return res as T;
      }
}

interface ClientOptions {
    ticket: string;
    responseType: string;
}