# Database Seeding Scripts

## Seed Admin Account

Creates a default admin account if no admin exists in the database.

### Default Admin Credentials:
- **Email:** kavadparth54@gmail.com
- **Password:** Parth#2005
- **Employee ID:** ADMIN001
- **Role:** Admin

### Usage:

**Automatic (on server start):**
The admin account is automatically created when the server starts if no admin exists.

**Manual:**
```bash
npm run seed:admin
```

### Notes:
- The script checks if an admin account already exists before creating one
- If an admin with email `kavadparth54@gmail.com` or any user with `admin` role exists, the script will skip creation
- The script runs automatically on server startup
- You can change the default credentials by editing `scripts/seedAdmin.js`

