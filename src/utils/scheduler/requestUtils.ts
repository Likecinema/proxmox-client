import { EventInput } from "@fullcalendar/core";
import { IProxMoxUserRequest, IScheduleJobNode } from "../../app/interfaces";
import { EventImpl } from "@fullcalendar/core/internal";

export default class RequestUtils {
    public static scheduleEvent(event: EventImpl, nodes: IScheduleJobNode[]): number {
        event.setProp("display", "none");
        const request = <IProxMoxUserRequest> event.extendedProps?.["request"] || undefined;
        this.removeRequestFromNodes(nodes, request)
        request.startDate = new Date(<Date>event.start).toISOString()
        request.endDate = new Date(<Date>event.end).toISOString()
        const nodesAbleToFit = this.getNodesAbleToFitRequest(nodes, request)
        if (!nodesAbleToFit.length) {
          return -1;
        }
        for (const node of nodesAbleToFit) {
          if (this.hasEnoughResoucesForRequest(node, request)) {
            this.pushEventToNode(node, event)
            event.setExtendedProp("edited", true);
            return 1;
          }
        }
        return 0;
      }

    private static removeRequestFromNodes(nodes: IScheduleJobNode[], request: IProxMoxUserRequest) {
      nodes.forEach((node:any) => {
        const alreadyUsed = node.usage.findIndex((used: IScheduleJobNode) => used.id === String(request.id));
        if(alreadyUsed > -1) {
          node.usage.splice(alreadyUsed, 1);
        }
      })
    }
    private static getNodesAbleToFitRequest(nodes: IScheduleJobNode[], request:IProxMoxUserRequest) {
      const filtered = nodes.filter((node) => {
        const memoryAble = node.memory >= request["vmDetails"].memoryGb;
        const diskAble = node.storage >= request["vmDetails"].storageGb;
        const cpuAble = node.cores >= request["vmDetails"].processors;
        return cpuAble && memoryAble && diskAble
      })
      return filtered;
    }
    
    public static hasEnoughResoucesForRequest(node: IScheduleJobNode, request: IProxMoxUserRequest) {
        const start = new Date(request['startDate']).getTime()
        const end = new Date(request['endDate']).getTime()
        const runningAtTheTime = node.usage.filter((times: {end: number, start: number}) => {
            return new Date(start) < new Date(times.end) && new Date(end) > new Date(times.start)
        })
        const sumOfMemory = runningAtTheTime.reduce((acc: number, curr) => curr.memory + acc, 0);
        const sumOfCores = runningAtTheTime.reduce((acc: number, curr) => curr.cores + acc, 0);
        const sumOfStorage = runningAtTheTime.reduce((acc: number, curr) => {
          if (!curr.storage) return 0 + acc;
          return curr.storage + acc;
        },0);
        const outOfMemory = sumOfMemory + request['vmDetails'].memoryGb > node.memory;
        const outOfCores = sumOfCores + request['vmDetails'].processors > node.cores;
        const outOfStorage = sumOfStorage + request['vmDetails'].storageGb > node.storage;
        return !outOfCores && !outOfMemory && !outOfStorage
      }

    public static pushEventToNode(node: IScheduleJobNode, event: EventImpl) {
        const request = event.extendedProps?.['request'] as IProxMoxUserRequest
        node.usage.push({
          id: request.id,
          start: new Date(request.startDate).getTime(),
          end: new Date(request.endDate).getTime(),
          memory: request.vmDetails.memoryGb,
          cores: request.vmDetails.processors,
          storage: request.vmDetails.storageGb,
        })
        if (!event.extendedProps) throw "Extended props missing";
        event.setExtendedProp("nodeId", node.id)
        return;
      }

    public static convertRequestToEvents(req: IProxMoxUserRequest): EventInput[] {
      const getNextDay = (from: Date, whatDay: number) => {
        var d = new Date(from);
        d.setDate(d.getDate() + (whatDay + 7 - d.getDay()) % 7);
        d.setSeconds(0);
        return d;
      }
      const result = [];
      const repeatDays = req.repeat;
      const endDate = new Date(req.endDate);
      const dates = repeatDays.map((v, i) => {
        const nextDay = getNextDay(new Date(req.startDate), v);
        if (nextDay > endDate) return [];
        const newDates = [nextDay];
        while (newDates[newDates.length -1] < endDate) {
          const tomorrow = new Date(newDates[newDates.length -1].getTime() + 86400000); // + 1 day in ms
          const sameDayNextWeek = getNextDay(tomorrow, v)
          if (sameDayNextWeek > endDate) {
            break;
          }
          newDates.push(sameDayNextWeek);
        }
        return newDates;
      }).flat();
      for (const day of dates) {
        const exactStart = new Date(day);
        exactStart.setSeconds(req.timeFrom);
        const exactStop = new Date(day);
        exactStop.setSeconds(req.timeTo);
        result.push({
          id: `${req.id}`,
          allDay: false,
          start: exactStart,
          end: exactStop,
          extendedProps: {
            request: req,
          },
          display: "none"
        })
      }
      return result;
    }

    public static convertEventToRequest(event: EventInput): IProxMoxUserRequest {
        return {
          ...event.extendedProps?.["request"],
          startDate: event.start,
          endDate: event.end,
        }
      }
}