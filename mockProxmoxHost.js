const express = require("express");
const app = express();
const port = 4444;

const cors = require("cors");
const corsOptions = {
  origin: "*",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.post("/api2/json/access/ticket", (req, res) => {
  res.send(
    JSON.stringify({
      data: {
        CSRFPreventionToken: "testToken",
        clustername: "null",
        roles: ["ROLE_ADMIN"],
        ticket: "testticket",
        username: "akis",
        rights: "admin",
      },
    })
  );
});

app.post("/user-authentication", (req, res) => {
  const { body } = req;
  console.log(req);
  console.log("post user auth");
  res.json({
    username: "akis",
    ticket: "testTicket",
    rights: "user",
    status: "success",
  });
});

app.get("/api2/json/access/roles", (req, res) => {
  res.send(
    JSON.stringify({
      data: [{ roleid: "ROLE_USER" }, { roleid: "ROLE_ADMIN" }],
    })
  );
});

app.get("/api2/json/access/users", (req, res) => {
  res.send(
    JSON.stringify({
      data: [
        {
          enable: 1,
          expire: 0,
          firstname: "Akis1",
          lastname: "akis2",
          "realm-type": "pve",
          userid: "1",
        },
        {
          enable: 1,
          expire: 0,
          firstname: "Akis3",
          lastname: "akis4",
          "realm-type": "pve",
          userid: "2",
        },
        {
          enable: 1,
          expire: 0,
          firstname: "Akis5",
          lastname: "akis6",
          "realm-type": "pve",
          userid: "3",
        },
      ],
    })
  );
});

app.get("/api2/json/access/users/:userid", (req, res) => {
  const { userid } = req.params;
  res.send(
    JSON.stringify({
      enable: 0,
      expire: 0,
      firstname: "test1",
      lastname: "test2",
      "realm-time": "pve",
      userid,
    })
  );
});

app.get("/api2/json/access/acl", (req, res) => {
  res.send(
    JSON.stringify({
      data: [
        {
          path: "testpath",
          propagate: 1,
          roleid: "10",
          type: "user",
          ugid: "ugidtest",
        },
      ],
    })
  );
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
