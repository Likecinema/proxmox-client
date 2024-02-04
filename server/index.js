// This Proxmox deployment is for development, and uses a self-signed certificate.
// This is why we need to disable the TLS check.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

require("dotenv").config();

const PROXMOX_HOST = "https://150.140.193.82:8006";
const PROXMOX_ADMIN_USER = process.env.PROXMOX_ADMIN_USER;
const PROXMOX_ADMIN_PASS = process.env.PROXMOX_ADMIN_PASS;
const PROXMOX_ENV = "pve";

const express = require("express");
const app = express();

app.use(express.json());

app.get("/api/users", async (req, res) => {
  const Cookie = req.get("cookie");
  const CSRFPreventionToken = req.get("CSRFPreventionToken");

  const users = await pmGetUsers(Cookie, CSRFPreventionToken);

  res.json(users.data);
});

app.get("/api/permissions", async (req, res) => {
  const cookie = req.get("cookie");
  const acl = await pmGetACL();
  const decodedCookie = decodeURIComponent(cookie.split("PVEAuthCookie=")[1]);
  const userid = decodedCookie.split(":")[1];
  const role = acl.data.find((role) => role.ugid === userid);

  res.json({
    isAdmin: role?.roleid === "PVEAdmin",
  });
});

app.get("/api/logout", async (req, res) => {
  res.clearCookie("PVEAuthCookie");
  res.json({ ok: true });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  const response = await pmLogin(username, password);

  res.cookie("PVEAuthCookie", response.data.ticket);

  res.json({
    CSRFPreventionToken: response.data.CSRFPreventionToken,
  });
});

app.post("/api/signup", async (req, res) => {
  const body = req.body;

  await pmCreateUser(body);

  res.json({ ok: true });
});

app.listen(8080, () => console.log("Server running on port 8080"));

async function pmGetACL() {
  const ticketResponse = await pmLogin(
    `${PROXMOX_ADMIN_USER}@${PROXMOX_ENV}`,
    PROXMOX_ADMIN_PASS
  );

  const response = await fetch(`${PROXMOX_HOST}/api2/json/access/acl`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Cookie: `PVEAuthCookie=${ticketResponse.data.ticket}`,
      CSRFPreventionToken: ticketResponse.data.CSRFPreventionToken,
    },
  });

  return await response.json();
}

async function pmGetUsers(cookie, csrfToken) {
  const response = await fetch(`${PROXMOX_HOST}/api2/json/access/users`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      CSRFPreventionToken: csrfToken,
    },
  });

  return await response.json();
}

async function pmLogin(username, password) {
  const response = await fetch(`${PROXMOX_HOST}/api2/json/access/ticket`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Basic " + Buffer.from(`${username}:${password}`).toString("base64"),
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  return await response.json();
}

async function pmCreateUser({
  username,
  password,
  email,
  firstName,
  lastName,
  comment,
}) {
  const ticketResponse = await pmLogin(
    `${PROXMOX_ADMIN_USER}@${PROXMOX_ENV}`,
    PROXMOX_ADMIN_PASS
  );

  const response = await fetch(`${PROXMOX_HOST}/api2/json/access/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `PVEAuthCookie=${ticketResponse.data.ticket}`,
      CSRFPreventionToken: ticketResponse.data.CSRFPreventionToken,
    },
    body: JSON.stringify({
      userid: `${username}@pve`,
      password,
      email,
      expire: 0,
      enable: 0,
      firstname: firstName,
      lastname: lastName,
      comment: comment,
    }),
  });

  return await response.json();
}

async function pmGetPermissions(cookie, csrfToken) {
  const response = await fetch(`${PROXMOX_HOST}/api2/json/access/permissions`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      CSRFPreventionToken: csrfToken,
    },
  });

  return await response.json();
}
