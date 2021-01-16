import express from 'express'

import {
  createBook,
  deleteBook,
  updateBook,
  findBookByISBN,
  findAllBooks,
  checkoutBook,
  returnBook
} from '../controllers/book'

import {
  accessByAdminOnly,
  accessByUserAndAdmin
} from '../middlewares/apiAuth'

const router = express.Router()

// Anybody can access,
router.get('/books', findAllBooks)
router.get('/book', findBookByISBN)

// User and Admin can only access
router.post('/book/checkout', [accessByUserAndAdmin], checkoutBook)
router.post('/book/return', [accessByUserAndAdmin], returnBook)

// Admin can only access,
router.post('/book', [accessByAdminOnly], createBook)
router.put('/book', [accessByAdminOnly], updateBook)
router.delete('/book', [accessByAdminOnly], deleteBook)

export default router
