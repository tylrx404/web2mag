import express from 'express';
import {
  getDbHealth,
  getIssue,
  listIssues,
  removeIssue,
  saveEditorState,
  saveIssue,
} from '../controllers/issueController.js';

const router = express.Router();

router.get('/health', getDbHealth);
router.get('/', listIssues);
router.post('/', saveIssue);
router.post('/save-state', saveEditorState);
router.get('/:id', getIssue);
router.put('/:id', saveIssue);
router.delete('/:id', removeIssue);

export default router;
