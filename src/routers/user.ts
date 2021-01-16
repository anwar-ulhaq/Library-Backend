import express from 'express'

import {
  createUser,
  login,
  googleAuth,
  googleAuthCallBack,
} from '../controllers/user'

const router = express.Router()

router.post('/signup', createUser)
router.post('/login', login)    // requires username and password
router.get('/google', googleAuth)
//TODO for logout
router.get('/auth/google/callback', googleAuthCallBack)

export default router
