import { faker } from "@faker-js/faker"

export function getJob() {
    return {
        id: faker.string.uuid(),
        status: Math.random() < 0.5 ? "pending" : "finished",
        user: faker.internet.username(),
        priority: Math.floor(Math.random() * (10 - 1 + 1)) + 1, //randint(1,10)
        timestamp: faker.date.anytime().getTime(),
        options: {
          sparkPath: faker.system.directoryPath(),
          master: faker.word.noun(),
          "deployMode": Math.random() < 0.5 ? "cluster" : "client",
          name: faker.person.firstName(),
          class: faker.word.noun(),
          executable: faker.system.filePath(),
          conf: {
            "spark.executor.instances": faker.number.int({min: 1, max: 4}),
            "spark.executor.cores": faker.number.int({min: 1, max: 4}),
            "spark.executor.memory": faker.helpers.arrayElement([512, 1024, 2048, 4096,5120, 6144, 7168, 8192, 10240]) / 1024,
            "spark.kubernetes.container.image": faker.word.noun(),
            "spark.kubernetes.driver.node.selector.kubernetes.io/hostname": faker.word.noun(),
            "spark.kubernetes.authenticate.driver.serviceAccountName": faker.word.noun()      
          }
        },
        additionalOptions: {
            [faker.word.verb()]: faker.word.noun(),
            [faker.word.verb()]: faker.word.noun(),
            [faker.word.verb()]: faker.word.noun(),
        }

}
}

export function getJobs() {
    return Array.from({length: 50}, () => {
        return getJob();
    })
}

export function uploadExecutable() {
    return {
        filename: faker.system.fileName(),
        executablePath: faker.system.filePath(),
    }
}