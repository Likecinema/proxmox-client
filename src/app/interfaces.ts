export interface IUploadExecutable {
    filename: string,
    file_path: string,
  }
  
export interface ISignupRequestBody {
    username: string;
    password: string;
    email: string;
  }
  
export interface ISignInResponse {
    CSRFPreventionToken: string;
    clustername: null;
    roles: Array<'ROLE_USER' | 'ROLE_ADMIN' | 'ROLE_MODERATOR'>;
    ticket: string;
    username: string;
  }
  
export interface IProxMoxUserRequest {
    id: number;
    vmDetails: {
      vmId: null,
      vmName: string;
      memoryGb: number;
      processors: number;
      storageName: string;
      storageGb: number;
      template: string;
    },
    type: 'POST';
    startDate: string;
    endDate: string;
    node: null;
    repeat: number[];
    timeFrom: number;
    timeTo: number;
    completed: boolean;
    toBeRemoved: boolean;
  }
  
  export interface IProxMoxUserCreateRequest {
    startDate: string;
    endDate: string;
    processors: number;
    repeat: Array<number>,
    timeFrom: number,
    timeTo: number,
    storage: number;
    memory: number;
    os: string;
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
  
  export interface INodeMetric {
    cpu: number;
    'cpu%': string;
    iowait: number;
    'iowait%': string;
    loadavg: number;
    maxcpu: number;
    memtotal: number;
    memtotalGB: string;
    memused: number;
    memusedGB: string;
    netin: number;
    netout: number;
    roottotal: number;
    roottotalGB: string;
    rootused: number;
    rootusedGB: string;
    swaptotal: number;
    swapused: number;
    time: string;
  }
  
  export interface INodeInfo {
    cpu: number;
    disk: number;
    id: string;
    level: string;
    maxcpu: number;
    maxdisk: number;
    maxmem: number;
    mem: number;
    node: string;
    ssl_fingerprint: string;
    status: 'online' | 'offline' | 'error' | 'unknown';
    type: string;
    uptime: number;
  }
  
  export interface IUserJobs {
    id?: string,
    status: string,
    user: string,
    priority: number,
    timestamp: number,
    options: IUserJobOptions,
    additionalOptions: {[key: string]: string, key: string}
  }

  export interface IUserJobOptions {
        sparkPath: string,
        master: string,
        "deployMode": string,
        name: string,
        class: string,
        executable: string,
        conf: {
          "spark.executor.instances": number,
          "spark.executor.cores": number,
          "spark.executor.memory": number,
          "spark.kubernetes.container.image":string,
          "spark.kubernetes.driver.node.selector.kubernetes.io/hostname": string,
          "spark.kubernetes.authenticate.driver.serviceAccountName": string     
        }
    }

export interface IScheduleJobNode {
    id: string,
    memory: number,
    storage: number,
    cores: number,
    usage: {
        id: number | string,
        start: number,
        end: number,
        memory: number,
        cores: number,
        storage?: number,
    }[]
}