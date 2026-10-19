// Biến môi trường giả lập cho test. Không phải khóa thật.
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-kaido-0123456789';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-kaido-0123456789';
process.env.JWT_ACCESS_TTL = '900';
process.env.JWT_REFRESH_TTL = '604800';
process.env.BCRYPT_ROUNDS = '10';
process.env.CRON_SECRET = 'test-cron-secret';
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
