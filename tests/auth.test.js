const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

describe('TaskLanka Authentication & Role API', () => {
  const testCustomer = {
    name: 'Dilshan Madushanka',
    email: 'dilshan@tasklanka.lk',
    password: 'password123',
    phone: '0779876543',
    role: 'customer',
    district: 'Colombo'
  };

  test('POST /api/auth/register - Register new Customer', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    jest.spyOn(User, 'create').mockResolvedValue({
      _id: '65b9c1111111111111111111',
      name: testCustomer.name,
      email: testCustomer.email,
      phone: testCustomer.phone,
      role: 'customer',
      language: 'en',
      profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
      location: {
        district: 'Colombo',
        address: 'Colombo, Sri Lanka',
        latitude: 6.9271,
        longitude: 79.8612
      }
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send(testCustomer);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('customer');
  });

  test('POST /api/auth/login - Login with valid credentials', async () => {
    const mockUser = {
      _id: '65b9c1111111111111111111',
      name: testCustomer.name,
      email: testCustomer.email,
      role: 'customer',
      isActive: true,
      comparePassword: jest.fn().mockResolvedValue(true)
    };

    jest.spyOn(User, 'findOne').mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testCustomer.email,
        password: testCustomer.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  test('POST /api/auth/login - Reject invalid email or password', async () => {
    jest.spyOn(User, 'findOne').mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@tasklanka.lk',
        password: 'wrong_password'
      });

    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
  });
});
