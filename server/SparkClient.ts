
import { SPARK_API_URL } from "./constants"
import { failFallback } from "./mockUtils/overrides";
import { IUserJobs } from "./interfaces";
import { getJobs, getJob, uploadExecutable } from "./mockUtils/fakeSparkApi";


export class SparkClient {
    public constructor(private readonly options: ClientOptions) {}
    public static from(req:any) {
        return new SparkClient({
            ticket: req.headers.ticket,
            CSRFPreventionToken: req.headers.CSRFPreventionToken,
            responseType: "json"
        });
    }

    @failFallback("get jobs failed", getJobs())
    public static async getJobs(req: any):Promise<IUserJobs[]> {
        const client = SparkClient.from(req)
        return await client.get("/spark-job")
    }

    @failFallback("can't get job", getJob())
    public static async getJob(req: any, id: string): Promise<IUserJobs> {
        const client = SparkClient.from(req)
        return await client.get(`/spark-job/${id}`);
    }

    @failFallback("can't delete job")
    public static async deleteJob(req:any, id: string) {
            const client = SparkClient.from(req)
        return await client.delete(`/spark-job/${id}`)
    }

    @failFallback("can't change priority")
    public static async changePriority(req: any, id: string) {
        const client = SparkClient.from(req)
        await client.put(req, `/change_priority/${id}`)
    }

    @failFallback("can't edit job")
    public static async editJob(req: any, id: string) {
        const client = SparkClient.from(req);
        return await client.put(req, `/spark-job/${id}`);
    }

    @failFallback("file upload mocked", uploadExecutable())
    public static async uploadExecutable(req:any) {
        const client = SparkClient.from(req);
        return await client.post("/upload_executable/", req); 
    }

    @failFallback("couldn't delete file")
    public static async deleteUpload(req: any) {
        const client = SparkClient.from(req);
        return await client.delete("/upload_executable/")
    }

    @failFallback("couldn't check job", [])
    public static async checkJob(req: any) {
        const client = SparkClient.from(req);
        return await client.post("/check_job", req);
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
        const response = await fetch(SPARK_API_URL + path, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'ticket': `${this.options.ticket}`,
            ...options.headers,
          },
        }).catch((e) => {
            return undefined;
        })
        if (!response) {

            return Promise.reject() as T;
        }
        return await response.json() as T;
    }
}

interface ClientOptions {
    ticket: string;
    CSRFPreventionToken: string,
    responseType: string;
}

