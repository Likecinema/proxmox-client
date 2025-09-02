import { faker } from "@faker-js/faker";


const howManyUsers = faker.number.int({min: 10, max: 50});
const userIds = Array.from({length: howManyUsers}, () => faker.internet.username());
export function getLoginDetails() {
    return {
        data: {
            CSRFPreventionToken: faker.string.uuid(),
            clustername: null,
            roles: 'ROLE_USER',
            ticket: faker.string.uuid(),
            username: faker.internet.username()
        }
    }
};

export function getRoles(){
    return {
        data: [{roleid: "ROLE_USER"}, {roleid: "ROLE_ADMIN"}, {roleid: "ROLE_MODERATOR"}]
    }
}

export function getUser(i:number = faker.number.int({max: howManyUsers})) {
    return {
            userid: `${userIds[i]}@pve`,
            comment: faker.lorem.sentence({min: 2, max: 4}),
            email: faker.internet.email(),
            enable: Math.random() < 0.5 ? 0 : 1,
            expire: faker.date.anytime().getTime(),
            firstname: faker.person.firstName(),
            lastname: faker.person.lastName(),
    }
}

export function getLogin() {
    return {
        ticket: faker.string.uuid(),
        csrfToken: faker.string.uuid(),
        clustername: null,
        roles: ["ROLE_ADMIN"],
        username: faker.internet.username(),
    }
}

export function getAllUsers() {
    return {data: Array.from({length:howManyUsers}, (v,i) => getUser(i))}
}

export function getAdmin() {
    return {...getUser(0), roles: ["ROLE_ADMIN"]}
}

export function getACL() {
    return {
        data: [
            { path: faker.system.directoryPath()},
            { propagate: faker.number.int({min: 0, max: 1})},
            { roleid: faker.helpers.arrayElement(["ROLE_USER", "ROLE_ADMIN", ["ROLE_MODERATOR"]])},
            { type: "user"},
            { ugid: userIds[0]},
        ]
    }
}

