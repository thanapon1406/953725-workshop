import { expect, test } from '@playwright/test';

// The deployed stack is shared and never truncated by e2e tests,
// so every run registers a brand-new voter with a unique valid id.
function uniqueNationalId(): string {
  const base = `9${Date.now().toString().slice(-11)}`;
  const sum = [...base].reduce((acc, digit, i) => acc + Number(digit) * (13 - i), 0);
  return base + ((11 - (sum % 11)) % 10);
}

test('a new voter registers, logs in and sees the candidates of their district', async ({ request }) => {
  const nationalId = uniqueNationalId();

  const registered = await request.post('/auth/register', {
    data: {
      nationalId,
      password: 'voter1234',
      firstName: 'มานี',
      lastName: 'มีนา',
      address: 'คณะ CAMT มช.',
      districtId: 'CM-2',
    },
  });
  expect(registered.status()).toBe(201);

  const login = await request.post('/auth/login', { data: { nationalId, password: 'voter1234' } });
  expect(login.ok()).toBeTruthy();
  const { token } = await login.json();

  const candidates = await request.get('/me/candidates', { headers: { Authorization: `Bearer ${token}` } });
  expect(candidates.ok()).toBeTruthy();
  expect(Array.isArray(await candidates.json())).toBe(true);
});
