export interface IUserJobs {
    id?: string,
    status: string,
    user: string,
    priority: number,
    timestamp: number,
    options: {
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
    },
    additionalOptions: {[key:string]:string}
  }