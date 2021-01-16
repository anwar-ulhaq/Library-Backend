import express from 'express'

import {
  createAuthor,
  updateAuthor,
  deleteAuthor,
} from '../controllers/author'
import {accessByAdminOnly} from '../middlewares/apiAuth'

const router = express.Router()

router.post('/author', [accessByAdminOnly], createAuthor)
router.put('/author', [accessByAdminOnly], updateAuthor)
router.delete('/author', [accessByAdminOnly], deleteAuthor)

export default router