import { getDbStatus } from '../config/db.js';
import {
  createOrUpdateIssue,
  deleteIssue,
  getAllIssues,
  getIssueArticles,
  getIssueById,
  getPageLayouts,
  saveCompleteIssueState,
} from '../services/dbStorageService.js';

/**
 * Controller to handle Magazine Issue operations and Editor State persistence.
 */

export async function listIssues(req, res) {
  try {
    const issues = await getAllIssues();
    const dbStatus = getDbStatus();
    return res.status(200).json({
      success: true,
      issues,
      dbStatus,
    });
  } catch (err) {
    console.error('[Issue Controller] listIssues error:', err);
    return res.status(500).json({
      success: false,
      error: `Failed to retrieve magazine issues: ${err.message}`,
    });
  }
}

export async function getIssue(req, res) {
  try {
    const { id } = req.params;
    const issue = await getIssueById(id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        error: `Magazine issue "${id}" not found.`,
      });
    }

    const articles = await getIssueArticles(id);
    const layouts = [];

    for (const art of articles) {
      const artLayouts = await getPageLayouts(id, art.id);
      layouts.push(...artLayouts);
    }

    return res.status(200).json({
      success: true,
      issue,
      articles,
      layouts,
    });
  } catch (err) {
    console.error('[Issue Controller] getIssue error:', err);
    return res.status(500).json({
      success: false,
      error: `Failed to load magazine issue: ${err.message}`,
    });
  }
}

export async function saveIssue(req, res) {
  try {
    const issueData = req.body;
    if (!issueData || !issueData.title) {
      return res.status(400).json({
        success: false,
        error: 'Issue title is required',
      });
    }

    const saved = await createOrUpdateIssue(issueData);
    return res.status(200).json({
      success: true,
      issue: saved,
      message: 'Magazine issue settings saved successfully',
    });
  } catch (err) {
    console.error('[Issue Controller] saveIssue error:', err);
    return res.status(500).json({
      success: false,
      error: `Failed to save magazine issue: ${err.message}`,
    });
  }
}

export async function removeIssue(req, res) {
  try {
    const { id } = req.params;
    await deleteIssue(id);
    return res.status(200).json({
      success: true,
      message: `Issue "${id}" deleted successfully`,
    });
  } catch (err) {
    console.error('[Issue Controller] removeIssue error:', err);
    return res.status(500).json({
      success: false,
      error: `Failed to delete issue: ${err.message}`,
    });
  }
}

export async function saveEditorState(req, res) {
  try {
    const { issue, articles, layouts } = req.body || {};

    if (!issue || !issue.id) {
      return res.status(400).json({
        success: false,
        error: 'Issue object with valid ID is required for saving state.',
      });
    }

    const result = await saveCompleteIssueState({
      issue,
      articles: articles || [],
      layouts: layouts || [],
    });

    return res.status(200).json({
      success: true,
      ...result,
      message: 'All editor changes, articles, layouts, and magazine metadata saved to database.',
    });
  } catch (err) {
    console.error('[Issue Controller] saveEditorState error:', err);
    return res.status(500).json({
      success: false,
      error: `Failed to save editor state: ${err.message}`,
    });
  }
}

export async function getDbHealth(req, res) {
  const status = getDbStatus();
  return res.status(200).json({
    success: true,
    status,
  });
}
