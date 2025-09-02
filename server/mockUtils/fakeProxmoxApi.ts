
import { faker } from "@faker-js/faker";


const nodes = Array.from({length: 4}, () => getNodeInfo())

export function getNodeInfo() {
    const randomCpu = faker.number.int({min: 4, max: 16})
    const multipleOf = 1024 * 1024 * 1024
    const randomMem = faker.number.int({min: 512 * multipleOf, max: 2048 * multipleOf, multipleOf: multipleOf})
    const randomDisk = faker.helpers.arrayElement([512, 1024, 2048, 4096, 8192].map((gb) => gb * multipleOf))

    return {
        cpu: faker.number.int({min: 2, max: randomCpu}),
        id: faker.string.uuid(),
        level: faker.number.int({min: 0, max: 2}),
        maxcpu: randomCpu,
        maxdisk: randomDisk,
        disk: (faker.number.int({min: 1, max: 100}) / 100) * randomDisk,
        mem: (faker.number.int({min: 1, max: 100}) / 100) * randomMem,
        maxmem: randomMem,
        node: faker.word.noun(),
        ssl_fingerprint: faker.string.uuid(),
        status: faker.helpers.arrayElement(["online", "offline", "error", "uknown"]),
        type: faker.word.noun(),
        uptime: faker.number.int({min: 1_000_000, max: 2_000_000})
    }
}

export function getAllNodeInfo() {
    return nodes;
}

export function getRequests() {
    function removeHoursFromDate(date:Date, howManyHours:number) {
        return new Date(date.getFullYear(), 
                        date.getMonth(), 
                        date.getDate(), 
                        date.getHours() - howManyHours, 
                        date.getMinutes(), 
                        date.getSeconds())
    }
    function removeDaysFromDate(date:Date, howManyDays: number) {
        return new Date(date.getFullYear(), 
        date.getMonth(), 
        date.getDate() - howManyDays, 
        date.getHours(), 
        date.getMinutes(), 
        date.getSeconds())
    }
    const now = new Date(); 
    return Array.from({length: faker.number.int({min: 10, max: 20})}, () => {
        const dayStart = removeDaysFromDate(now, faker.number.int({min: -5, max: 7}));
        const randInt = faker.number.int({min: 0, max: 240})
        const pointStart = removeHoursFromDate(dayStart, randInt).toISOString();
        const pointEnd = removeHoursFromDate(dayStart, faker.number.int({min: -randInt, max: randInt})).toISOString();
        const timeFrom = faker.number.int({min: 0, max: 60*60*24});
        const timeTo = faker.number.int({min: timeFrom, max: 60*60*24})
        return {
            id: faker.number.int(),
            vmDetails: {
              vmId: faker.number.int(),
              vmName: faker.word.noun(),
              memoryGb: faker.number.int({min: 2, max: 16}),
              processors: faker.number.int({min: 2, max: 12}),
              storageName: faker.word.noun(),
              storageGb: faker.number.int({min: 1, max: 200}),
              template: faker.word.noun(),
            },
            type: 'POST',
            startDate: pointStart,
            endDate: pointEnd,
            repeat: faker.helpers.multiple((_i, index) => index, {count: {min: 1, max: 7}}),
            timeFrom,
            timeTo,
            completed: false,
            toBeRemoved: false,
            node: faker.helpers.arrayElement(nodes.map((n) => n.id))
        }
    })
}


export function getNodeMetrics() {
    const randomNode = faker.helpers.arrayElement(nodes);
    const metrics = Array.from({length: 10}, () => {
        return getNodeMetric(randomNode)
    })
    metrics.sort((a: any, b: any) => {
        return b.time - a.time
    })
    return metrics;
}

export function getNodeMetric(node: any) {
    const r = faker.number.int
    const randomNode = node;
    const cpu = faker.number.int({min: 1, max: randomNode.cpu}) * 100 / randomNode.cpu;
    const memUsed = randomNode.maxmem * (faker.number.int({min:1, max:100}) / 100);
    const rootUsed = randomNode.maxdisk * (r({min: 1, max: 100}) / 100);
    const swaptotal = r({min: 0, max: rootUsed});
    const swapUsed = r({min: 0, max: swaptotal});
    const randomDate = faker.date.between({from: "2025-03-12", to: "2025-03-16"}) ;
    return {
        cpu: cpu,
        "cpu%": cpu / 100,
        iowait: faker.number.int({min:1, max: 1000}),
        "iowait%": faker.number.int({min: 1, max: 1000}),
        loadavg: faker.number.int({min: 1, max: 100}),
        maxcpu: randomNode.maxcpu,
        memtotal: randomNode.maxmem,
        memtotalGB: randomNode.maxmem / 1024 / 1024 / 1024,
        memused: memUsed,
        memusedGB: memUsed / 1024 / 1024 / 1024,
        netin: faker.number.int({min: 1, max: 1000}),
        netout: r({min:1, max: 1000}),
        roottotal: randomNode.maxdisk,
        roottotalGB: randomNode.maxdisk / 1024 / 1024 / 1024,
        rootused: rootUsed,
        rootusedGB: rootUsed / 1024 / 1024 / 1024,
        swaptotal: swaptotal,
        swapused: swapUsed,
        time: randomDate,
      };
}