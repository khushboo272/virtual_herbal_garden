import Garden, { IGarden } from '../models/Garden';
import ActivityLog from '../models/ActivityLog';
import { ActivityType, GrowthStage } from '../types';
import { AppError } from '../utils/apiResponse';
import mongoose from 'mongoose';

export class GardenService {
  async getGarden(userId: string): Promise<IGarden> {
    let garden = await Garden.findOne({ user: userId }).populate(
      'plants.plant',
      'commonName slug images model3dUrl scientificName',
    );

    if (!garden) {
      garden = await Garden.create({
        user: userId,
        name: 'My Garden',
        plants: [],
      });
    }

    return garden;
  }

  async addPlant(
    userId: string,
    data: {
      plant: string;
      position: { x: number; y: number; z: number };
      rotation?: { x: number; y: number; z: number };
      scale?: number;
      growthStage?: GrowthStage;
      notes?: string;
    },
  ): Promise<IGarden> {
    let garden = await Garden.findOne({ user: userId });
    if (!garden) {
      garden = await Garden.create({
        user: userId,
        name: 'My Garden',
        plants: [],
      });
    }

    const plantEntry = {
      plant: new mongoose.Types.ObjectId(data.plant),
      position: data.position,
      rotation: data.rotation || { x: 0, y: 0, z: 0 },
      scale: data.scale || 1,
      growthStage: data.growthStage || GrowthStage.SEED,
      plantedAt: new Date(),
      notes: data.notes || undefined,
    };

    garden.plants.push(plantEntry);
    await garden.save();

    await ActivityLog.create({
      user: userId,
      activityType: ActivityType.GARDEN_UPDATE,
      entityId: data.plant,
      metadata: { action: 'add', position: data.position },
    });

    return garden;
  }

  async updatePlant(
    userId: string,
    plantEntryId: string,
    data: Partial<{
      position: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number };
      scale: number;
      growthStage: GrowthStage;
      notes: string;
    }>,
  ): Promise<IGarden> {
    const updateFields: Record<string, unknown> = {};
    if (data.position) updateFields['plants.$.position'] = data.position;
    if (data.rotation) updateFields['plants.$.rotation'] = data.rotation;
    if (data.scale !== undefined) updateFields['plants.$.scale'] = data.scale;
    if (data.growthStage) updateFields['plants.$.growthStage'] = data.growthStage;
    if (data.notes !== undefined) updateFields['plants.$.notes'] = data.notes;

    const garden = await Garden.findOneAndUpdate(
      { user: userId, 'plants._id': plantEntryId },
      { $set: updateFields },
      { new: true },
    ).populate('plants.plant', 'commonName slug images model3dUrl');

    if (!garden) {
      throw new AppError('Garden or plant entry not found', 404, 'NOT_FOUND');
    }

    return garden;
  }

  async removePlant(userId: string, plantEntryId: string): Promise<IGarden> {
    const garden = await Garden.findOneAndUpdate(
      { user: userId },
      { $pull: { plants: { _id: plantEntryId } } },
      { new: true },
    ).populate('plants.plant', 'commonName slug images model3dUrl');

    if (!garden) {
      throw new AppError('Garden not found', 404, 'NOT_FOUND');
    }

    return garden;
  }
}

export const gardenService = new GardenService();
