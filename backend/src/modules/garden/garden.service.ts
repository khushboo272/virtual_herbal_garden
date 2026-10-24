import Garden, { IGarden } from './Garden.model';
import ActivityLog from '../notifications/ActivityLog.model';
import { ActivityType, GrowthStage } from '../../types';
import { AppError } from '../../core/utils/apiResponse';
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
      plant?: string;
      plantId?: string;
      position?: { x: number; y: number; z: number };
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

    const plantIdStr = data.plantId || data.plant;
    if (!plantIdStr) {
      throw new AppError('plantId or plant is required', 400, 'MISSING_PLANT_ID');
    }

    // Auto-calculate position if omitted
    const count = garden.plants.length;
    const col = count % 5;
    const row = Math.floor(count / 5);
    const position = data.position || {
      x: (col - 2) * 2.5,
      y: 0,
      z: (row - 2) * 2.5,
    };

    const plantEntry = {
      plant: new mongoose.Types.ObjectId(plantIdStr),
      position,
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
      entityId: plantIdStr,
      metadata: { action: 'add', position },
    });

    const populated = await Garden.findById(garden._id).populate(
      'plants.plant',
      'commonName slug images model3dUrl scientificName',
    );
    return populated || garden;
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

    const isObjectId = mongoose.Types.ObjectId.isValid(plantEntryId);
    const pid = isObjectId ? new mongoose.Types.ObjectId(plantEntryId) : plantEntryId;

    let garden = await Garden.findOneAndUpdate(
      { user: userId, 'plants._id': pid },
      { $set: updateFields },
      { new: true },
    ).populate('plants.plant', 'commonName slug images model3dUrl scientificName');

    if (!garden) {
      garden = await Garden.findOneAndUpdate(
        { user: userId, 'plants.plant': pid },
        { $set: updateFields },
        { new: true },
      ).populate('plants.plant', 'commonName slug images model3dUrl scientificName');
    }

    if (!garden) {
      throw new AppError('Garden or plant entry not found', 404, 'NOT_FOUND');
    }

    return garden;
  }

  async removePlant(userId: string, plantEntryId: string): Promise<IGarden> {
    const isObjectId = mongoose.Types.ObjectId.isValid(plantEntryId);
    const pid = isObjectId ? new mongoose.Types.ObjectId(plantEntryId) : plantEntryId;

    const garden = await Garden.findOneAndUpdate(
      { user: userId },
      {
        $pull: {
          plants: {
            $or: [{ _id: pid }, { plant: pid }],
          },
        },
      },
      { new: true },
    ).populate('plants.plant', 'commonName slug images model3dUrl scientificName');

    if (!garden) {
      throw new AppError('Garden not found', 404, 'NOT_FOUND');
    }

    return garden;
  }
}

export const gardenService = new GardenService();
