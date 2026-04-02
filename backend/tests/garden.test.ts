import mongoose from 'mongoose';
import Garden from '../src/models/Garden';
import Plant from '../src/models/Plant';
import User from '../src/models/User';
import { hashPassword } from '../src/utils/hash';

import './setup';

describe('Garden API', () => {
  let userId: mongoose.Types.ObjectId;
  let plantId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    const user = await User.create({
      email: 'gardener@test.com',
      passwordHash: await hashPassword('TestPass123!'),
      displayName: 'Gardener',
      role: 'USER',
    });
    userId = user._id as mongoose.Types.ObjectId;

    const plant = await Plant.create({
      commonName: 'Tulsi', scientificName: 'Ocimum tenuiflorum',
      slug: 'tulsi', family: 'Lamiaceae', description: 'Sacred plant',
      medicinalUses: ['immunity'], toxicityLevel: 'NONE',
      regionNative: ['South Asia'], createdBy: userId,
    });
    plantId = plant._id as mongoose.Types.ObjectId;
  });

  it('should create a garden for a user', async () => {
    const garden = await Garden.create({
      user: userId, name: 'My Garden', plants: [],
    });
    expect(garden.name).toBe('My Garden');
    expect(garden.plants).toHaveLength(0);
  });

  it('should enforce one garden per user', async () => {
    await Garden.create({ user: userId, name: 'Garden 1' });
    await expect(
      Garden.create({ user: userId, name: 'Garden 2' }),
    ).rejects.toThrow();
  });

  it('should add a plant with 3D position', async () => {
    const garden = await Garden.create({ user: userId });
    garden.plants.push({
      plant: plantId,
      position: { x: 1, y: 0, z: 3 },
      rotation: { x: 0, y: 45, z: 0 },
      scale: 1.5,
      growthStage: 'SPROUT',
      plantedAt: new Date(),
    } as mongoose.AnyObject);
    await garden.save();

    const found = await Garden.findById(garden._id);
    expect(found!.plants).toHaveLength(1);
    expect(found!.plants[0].position.x).toBe(1);
    expect(found!.plants[0].scale).toBe(1.5);
  });

  it('should update plant position with $set', async () => {
    const garden = await Garden.create({
      user: userId,
      plants: [{
        plant: plantId,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 1, growthStage: 'SEED', plantedAt: new Date(),
      }],
    });

    const entryId = garden.plants[0]._id;
    await Garden.findOneAndUpdate(
      { user: userId, 'plants._id': entryId },
      { $set: { 'plants.$.position': { x: 5, y: 0, z: 10 } } },
    );

    const updated = await Garden.findById(garden._id);
    expect(updated!.plants[0].position.x).toBe(5);
    expect(updated!.plants[0].position.z).toBe(10);
  });

  it('should remove a plant with $pull', async () => {
    const garden = await Garden.create({
      user: userId,
      plants: [{
        plant: plantId,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: 1, growthStage: 'SEED', plantedAt: new Date(),
      }],
    });

    const entryId = garden.plants[0]._id;
    await Garden.findOneAndUpdate(
      { user: userId },
      { $pull: { plants: { _id: entryId } } },
    );

    const updated = await Garden.findById(garden._id);
    expect(updated!.plants).toHaveLength(0);
  });
});
