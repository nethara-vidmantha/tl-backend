const request = require('supertest');
const app = require('../src/app');
const Worker = require('../src/models/Worker');

describe('TaskLanka Metadata & Worker Discovery API', () => {
  test('GET /api/health - Returns API health and version', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('online');
    expect(res.body.service).toBe('TaskLanka API Engine');
  });

  test('GET /api/categories - Returns all Sri Lankan service categories', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    
    // Check key Sri Lankan categories
    const ids = res.body.data.map(c => c.id);
    expect(ids).toContain('plumbing');
    expect(ids).toContain('electrical');
    expect(ids).toContain('medical');
    expect(ids).toContain('teaching');
    expect(ids).toContain('caregiving');
  });

  test('GET /api/districts - Returns all 25 Sri Lankan districts with coordinates', async () => {
    const res = await request(app).get('/api/districts');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(25);

    const districtNames = res.body.data.map(d => d.name);
    expect(districtNames).toContain('Colombo');
    expect(districtNames).toContain('Matara');
    expect(districtNames).toContain('Kandy');
    expect(districtNames).toContain('Galle');
    expect(districtNames).toContain('Jaffna');
  });

  test('GET /api/workers - Returns workers list with distance and hourly rates', async () => {
    // Mock Worker.find
    jest.spyOn(Worker, 'find').mockReturnValue({
      populate: jest.fn().mockResolvedValue([
        {
          _id: '65b9a1111111111111111111',
          category: 'plumbing',
          district: 'Colombo',
          address: 'Havelock Rd, Colombo 05',
          latitude: 6.8833,
          longitude: 79.8655,
          hourlyRate: 1500,
          rating: 4.9,
          totalReviews: 28,
          verified: true,
          availability: true,
          userId: {
            _id: '65b9u1111111111111111111',
            name: 'Kasun Fernando',
            email: 'worker@tasklanka.lk',
            phone: '0772345678',
            isActive: true
          },
          toObject: function() { return { ...this }; }
        }
      ])
    });

    const res = await request(app)
      .get('/api/workers')
      .query({ district: 'Colombo', latitude: 6.9271, longitude: 79.8612 });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].hourlyRate).toBe(1500);
    expect(res.body.data[0].distance).toBeDefined();
  });
});
