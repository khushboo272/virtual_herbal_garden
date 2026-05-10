import './setup';
// Test imports removed

describe('AdminService.getStats', () => {
  it('should return overall stats for admin dashboard', async () => {
    // Import the service
    const { adminService } = await import('../src/modules/admin/admin.service');

    // Make sure DB has some records
    const stats = await adminService.getStats();

    expect(stats).toHaveProperty('totalPlants');
    expect(stats).toHaveProperty('totalUsers');
    expect(stats).toHaveProperty('totalViews');
    expect(stats).toHaveProperty('totalDetections');
    expect(stats).toHaveProperty('recentActivity');
    expect(typeof stats.totalPlants).toBe('number');
    expect(typeof stats.totalUsers).toBe('number');
    expect(stats.totalPlants).toBe(0);
  });
});
