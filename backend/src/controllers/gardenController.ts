import { Request, Response } from 'express';
import { gardenService } from '../services/gardenService';
import { sendSuccess, sendCreated } from '../utils/apiResponse';

export class GardenController {
  async getGarden(req: Request, res: Response) {
    const garden = await gardenService.getGarden(req.user!.sub);
    sendSuccess(res, garden);
  }

  async addPlant(req: Request, res: Response) {
    const garden = await gardenService.addPlant(req.user!.sub, req.body);
    sendCreated(res, garden);
  }

  async updatePlant(req: Request, res: Response) {
    const garden = await gardenService.updatePlant(req.user!.sub, req.params.pid, req.body);
    sendSuccess(res, garden);
  }

  async removePlant(req: Request, res: Response) {
    const garden = await gardenService.removePlant(req.user!.sub, req.params.pid);
    sendSuccess(res, garden);
  }
}

export const gardenController = new GardenController();
