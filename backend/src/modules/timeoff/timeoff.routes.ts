import { Router } from 'express';
import {
  handleCreateRequest,
  handleGetAllRequests,
  handleGetBalances,
  handleGetMyRequests,
  handleGetTypes,
  handleReviewRequest,
} from './timeoff.controller';

const router = Router();

// GET /timeoff/balances
router.get('/balances', handleGetBalances);

// GET /timeoff/requests/mine
router.get('/requests/mine', handleGetMyRequests);

// GET /timeoff/types
router.get('/types', handleGetTypes);

// POST /timeoff/requests
router.post('/requests', handleCreateRequest);

// GET /timeoff/requests  (Admin / HR_OFFICER — all company requests)
router.get('/requests', handleGetAllRequests);

// PATCH /timeoff/requests/:id  (Admin / HR_OFFICER — approve or reject)
router.patch('/requests/:id', handleReviewRequest);

export default router;
