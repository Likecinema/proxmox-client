import { EventImpl } from "@fullcalendar/core/internal";
import { EventInput } from "@fullcalendar/core";
import { IScheduleJobNode, IUserJobs } from "../../app/interfaces";

export default class JobUtils {

    public static convertJobToEvent(job: IUserJobs): EventInput {
        const obj = {} as EventInput;
        obj.id = job.id;
        obj.allDay = false;
        obj.title = `Job ${job.id} by ${job.user}`;
        obj.start = new Date();
        obj.end = new Date();
        obj.extendedProps = {
            job: job,
        };
        obj.display = "none";
        return obj;
    }

    private static getNodesAbleToFitJob(nodes: IScheduleJobNode[], job: IUserJobs) {
       return nodes.filter((node) => {
          const memoryAble = node.memory >= job.options.conf["spark.executor.memory"]
          const cpuAble = node.cores >= job.options.conf["spark.executor.cores"]
          return cpuAble && memoryAble
      })
    }

    public static hasEnoughResourcesForJob(node: IScheduleJobNode, job: IUserJobs, start: number, end: number) {
        const { conf } = job.options as any;
        const runningAtTheTime = node.usage.filter((times: {end: number, start: number}) => start < times.end && end > times.start)
        const sumOfMemory = runningAtTheTime.reduce((acc: number, curr: {memory: number}) => curr.memory + acc, 0);
        const sumOfCores = runningAtTheTime.reduce((acc: number, curr: {cores: number}) => curr.cores + acc, 0);
        const outOfMemory = sumOfMemory + conf["spark.executor.memory"] > node.memory;
        const outOfCores = sumOfCores + conf["spark.executor.cores"] > node.cores;
        return !outOfCores && !outOfMemory
    }

    public static pushJobToNode(node: IScheduleJobNode, event: EventImpl, start: number, end: number) {
        const { options } = <IUserJobs>event.extendedProps?.['job'];
        const { conf } = options as any;
        const memory = conf["spark.executor.memory"];
        const cores = conf["spark.executor.cores"];
        event.setExtendedProp("nodeId", node.id);
        node.usage.push({
          id: <string>event.extendedProps?.['job'].id,
          start: start,
          end: end,
          memory: memory,
          cores: cores,
          storage: 0,
        })
      }

    public static scheduleJob(event: EventImpl, nodes: IScheduleJobNode[], sumOfRetryHours: number, hoursPerJob: number): number {
        const job = event.extendedProps?.["job"];
        if (!job) {
          return -1;
        }
        this.removeJobFromNodes(nodes, job)
        const now = new Date()
        //start 9AM tomorrow
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0);
        start.setHours(start.getHours() + sumOfRetryHours)
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0);
        end.setHours(end.getHours() + sumOfRetryHours + hoursPerJob);
        const nodesAbleToFit = this.getNodesAbleToFitJob(nodes, job);
        if (!nodesAbleToFit.length) return -1;
          for (const node of nodes) {
            if (this.hasEnoughResourcesForJob(node, job, start.getTime(), end.getTime())) {
              this.pushJobToNode(node, event, start.getTime(), end.getTime())
              event.setDates(start, end);
              event.setExtendedProp("edited", true);
              return 1;
            }
          }
          return 0;
      }

      private static removeJobFromNodes(nodes: IScheduleJobNode[], job: IUserJobs) {
          nodes.forEach((node) => {
            const alreadyUsed = node.usage.findIndex((used) => used.id === job.id);
            if(alreadyUsed > -1) {
              node.usage.splice(alreadyUsed, 1);
            }
          })
      }
}