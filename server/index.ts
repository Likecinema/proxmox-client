import { log } from 'console';
import express, { Request, Response, json } from 'express';
import { ProxmoxClient } from './ProxmoxClient';

(async () => {
  for (const event of ['uncaughtException', 'unhandledRejection']) {
    process.on(event, e => {
      console.error(e);
    });
  }

  log('Getting admin credentials...');
  const admin = await ProxmoxClient.admin();

  log('Starting server...');
  const app = express();

  // Parse json bodies
  app.use(json());

  // Log requests (e.g. POST /api/users)
  app.use((req, res, next) => {
    log(req.method, req.url);
    next();
  });

  // List users
  app.get('/api/users', async (req: Request, res: Response) => {
    const acl = await admin.getACL();

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
  app.post('/api/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;

    const response = await ProxmoxClient.login(username, password);

    res.cookie('PVEAuthCookie', response.ticket);

    res.json({
      CSRFPreventionToken: response.csrfToken
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

  app.listen(8080, () => console.log('Server running on port 8080'));
})();
