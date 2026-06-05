import Database from 'better-sqlite3'

const db = new Database('./prisma/dev.db')
const result = db.prepare("UPDATE users SET role = 'ADMIN' WHERE email = 'demo@gulive.com'").run()
console.log('Updated rows:', result.changes)
const row = db.prepare("SELECT email, role FROM users WHERE email = 'demo@gulive.com'").get()
console.log('User:', row)
db.close()