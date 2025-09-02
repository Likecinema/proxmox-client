import { log } from 'console';
import express, { Request, Response, json } from 'express';
import { ProxmoxClient } from './ProxmoxClient';
import { SparkClient } from './SparkClient';
import { ProxmoxApiClient } from './ProxmoxApiClient';

(async () => {

  for (const event of ['uncaughtException', 'unhandledRejection', 'SyntaxError']) {
    process.on(event, e => {
      console.log("event");
      console.error(e);
    });
  }

  log('Getting admin credentials...');
  log("before admin");
  const admin = await ProxmoxClient.admin();
  log('Starting server...');
  const app = express();
  // Parse json bodies
  app.use(json());


  // List users
  app.get('/api/users', async (req: Request, res: Response) => {
    console.log(admin);
    const acl = await ProxmoxClient.from(req).getACL();
    const users = await ProxmoxClient.from(req).getUsers();
    res.json(
      users.data.map(user => ({
        ...user,
        roleid: acl.data.find(role => role.ugid === user.userid)?.roleid,
      }))
    );
  });

  // Delete user
  app.delete('/api/users/:userid', async (req: Request, res: Response) => {
    const userid = req.params.userid;

    await ProxmoxClient.from(req).deleteUser(userid);

    res.json({ ok: true });
  });

  // Upsert user
  app.post('/api/users', async (req: Request, res: Response) => {
    const user = req.body;
    const client = ProxmoxClient.from(req);

    const existingUser = await client.getUser(user.userid);

    if (existingUser.data) {
      const roleid = user.roleid;

      delete user.roleid;

      await client.updateUser(user.userid, user);

      if (roleid) {
        const acl = await client.getACL();
        const userRole = acl.data.find(role => role.ugid === user.userid);

        if (roleid !== userRole?.roleid) {
          log(`Should change role from ${userRole?.roleid} to ${roleid} for ${user.userid}`);
        }
      }
    } else {
      delete user.roleid;

      await client.createUser(user);
    }

    res.json({ ok: true });
  });

  // List roles
  app.get('/api/roles', async (req: Request, res: Response) => {
    const roles = await ProxmoxClient.from(req).getRoles();

    res.json(roles.data.map(role => role.roleid));
  });

  // Get current user permissions (isAdmin: boolean)
  app.get('/api/permissions', async (req: Request, res: Response) => {
    const cookie = req.get('cookie') as string;
    const acl = await admin.getACL();
    const decodedCookie = decodeURIComponent(cookie.split('PVEAuthCookie=')[1]);
    const userid = decodedCookie.split(':')[1];
    const role = acl.data.find(role => role.ugid === userid);

    res.json({
      isAdmin: role?.roleid === 'PVEAdmin',
    });
  });

  // Logout (delete cookie)
  app.get('/api/logout', async (req: Request, res: Response) => {
    res.clearCookie('PVEAuthCookie');
    res.json({ ok: true });
  });

  // Login
  app.post('/api/auth/signin', async (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    const response = await ProxmoxClient.login(username, password);
    
    res.cookie('PVEAuthCookie', response.ticket);
    
    res.json({
      CSRFPreventionToken: response.csrfToken,
      ticket: response.ticket,
      clustername: null,
      roles: response.roles,
      username: response.username
    });
  });

  // Signup
  app.post('/api/signup', async (req: Request, res: Response) => {
    const body = req.body;

    const client = await ProxmoxClient.admin();

    body.enable = 0;
    body.expire = 0;

    await client.createUser(body);

    res.json({ ok: true });
  });

  app.get('/api/user/vms', async (req: Request, res: Response) => {
    const vms = await ProxmoxApiClient.getUserVms(req);
    res.json(vms);
  })

  app.post("/api/user/vm/create", async (req,res) => {
    res.json(await ProxmoxApiClient.createRequest(req));
  })

  app.delete("/api/user/vm/delete?ids=:ids", async (req, res) => {
    const ids = req.params.ids;
    res.json(await ProxmoxApiClient.deleteRequest(req, ids));
  })

  app.post("/api/auth/resetPassword", async (req, res) => {
    res.json(await ProxmoxApiClient.resetPassword(req))
  })

  app.get("/api/admin/cluster", async (req, res) => {
    res.json(await ProxmoxApiClient.getCluster(req))
  })

  app.get("/api/node/info", async (req, res) => {
    res.json(await ProxmoxApiClient.getNodeInfo(req))
  })

  app.get("/api/node/resources/:nodeid/metrics", async (req, res) => {
    res.json(await ProxmoxApiClient.getNodeMetrics(req, req.params.nodeid));
  })

  app.get("/api/node/resources/:nodeid/:type", async (req, res) => {
    res.json(await ProxmoxApiClient.getNodeMetrics(req, req.params.nodeid))
  })

  app.get("api/node/:nodeid/:resource",async (req, res) => {
    res.json(await ProxmoxApiClient.getNodeResourceInfo(req, req.params.nodeid, req.params.resource))
  })

  app.get("/api/logout", async (req, res) => {
    res.json(await ProxmoxApiClient.logout(req))
  })

  app.post("/api/users", async (req, res) => {
    res.json(await ProxmoxApiClient.createUser(req, req.body));
  })

  app.delete("/api/users", async (req, res) => {
    res.json(await ProxmoxApiClient.deleteUser(req))
  })

  app.get("/api/roles", async (req) => {
    return await admin.getRoles()
  })

  app.get("/spark-job/:jobid?", async (req, res) => {
      let job;
      if (req.params.jobid) {
        job = await SparkClient.getJob(req, req.params.jobid);
      }
      else job = await SparkClient.getJobs(req);
      res.json(job)
  });

  app.post("/check-job",async (req, res) => {
    const job = await SparkClient.checkJob(req);
    res.json(job)
  })

  app.post("/api/signup", (req, res) => {
    console.log("signup WITHOUT CLIENT")
  })

  app.post("/upload-executable", async (req, res) => {
    const result = await SparkClient.uploadExecutable(req);
    res.json(result);
  })


  app.listen(8888, () => console.log('Server running on port 8888'));
})();
