import { Request, Response } from 'express';
import { contributionService } from './contribution.service';
import { sendSuccess } from '../../core/utils/apiResponse';
import { ContributionQuery } from './contribution.validators';

export class ContributionController {
  async getSummary(req: Request, res: Response) {
    const summary = await contributionService.getSummary(req.user!.sub);
    sendSuccess(res, summary);
  }

  async list(req: Request, res: Response) {
    const query = req.query as unknown as ContributionQuery;
    const result = await contributionService.list(req.user!.sub, query);
    sendSuccess(res, result.items, 200, result.meta);
  }

  async getOne(req: Request, res: Response) {
    const type = req.params.type as 'plant' | 'remedy';
    const item = await contributionService.getOne(req.user!.sub, type, req.params.id);
    sendSuccess(res, item);
  }

  async submit(req: Request, res: Response) {
    const type = req.params.type as 'plant' | 'remedy';
    const result = await contributionService.submit(req.user!.sub, type, req.params.id);
    sendSuccess(res, result);
  }

  async withdraw(req: Request, res: Response) {
    const type = req.params.type as 'plant' | 'remedy';
    const result = await contributionService.withdraw(req.user!.sub, type, req.params.id);
    sendSuccess(res, result);
  }

  async delete(req: Request, res: Response) {
    const type = req.params.type as 'plant' | 'remedy';
    await contributionService.delete(req.user!.sub, type, req.params.id);
    sendSuccess(res, { message: 'Contribution deleted successfully' });
  }

  async requestCorrection(req: Request, res: Response) {
    const type = req.params.type as 'plant' | 'remedy';
    const result = await contributionService.requestCorrection(
      req.user!.sub,
      type,
      req.params.id,
      req.body.note,
    );
    sendSuccess(res, result);
  }
}

export const contributionController = new ContributionController();
