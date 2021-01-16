

import BookService from '../services/book'
import {NextFunction, Request, Response} from 'express'
import {BadRequestError, InternalServerError, NotFoundError} from '../helpers/apiError'
import Book from '../models/Book'
import Author, {AuthorDocument} from '../models/Author'
import AuthorService from '../services/author'


export const findAllBooks = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    await BookService.findAll()
      .then(books =>{
        if ( books.length >= 1 ) {
          response.json(books)
        } else {
          next( new NotFoundError('No Book found'))
        }
      })
  }
  catch ( error ) {
    // TODO Mock .findAll and throw error
    /* istanbul ignore next */
    next( new InternalServerError(`${error}`) )
  }
}

export const findBookByISBN = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    if ( request.query.ISBN ){
      await BookService.findByISBN( request.query.ISBN )
        .then( book =>{
          if (book ) {
            response.json(book)
          } else {
            next( new NotFoundError('Could not find book with given ISBN number'))
          }
        })
        .catch(
          /* istanbul ignore next */
            error => {
          // TODO Mock .findByISBN and throw error
          /* istanbul ignore next */
          next(new InternalServerError(`${error}`))
        })
    } else {
      next(new BadRequestError('ISBN missing'))
    }
  }  catch (error) {
    // TODO Mock .findByISBN and throw error
    /* istanbul ignore next */
    next( new InternalServerError(`${error}`))
  }
}


// TODO how to add multiple copies in to library
export const createBook = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try{
    // TODO move all this code to service
    // TODO type check all
    const { title, description, publisher, ISBN, publishedDate, category, status } = request.body
    const providedAuthors = request.body.authors
    if ( !title
      || !description
      || !publisher
      || !providedAuthors
      || !ISBN
      || !publishedDate
      || !category
      || !status ) {
      next( new BadRequestError('Title, Description, Publisher, Author, ISBN or Published date missing.'))
    } else {
      const authors: AuthorDocument[] = [  ]
      if ( !await BookService.findByISBN(ISBN) ){
        if ( providedAuthors.length >= 1 ) {
          for (const author of providedAuthors) {
            const firstName: string = author.firstName
            const lastName: string = author.lastName
            if (firstName && lastName){
              await AuthorService.isAuthorExist( firstName , lastName)
                .then(async authorFromDB =>{
                  if ( authorFromDB ){
                    authors.push(authorFromDB )
                  } else {
                    await AuthorService.create(new Author({ firstName , lastName }))
                      .then( newAuthor => {
                        /* istanbul ignore else */
                        if ( newAuthor ){
                          authors.push(newAuthor)
                        }
                      })
                  }
                })
            } else {
              //TODO track with boolean
              // TEST_CASE: 3 authors.
              // 1st missing firstName
              // 2nd is complete and already exists in DB
              // 3rd is new
              next( new BadRequestError('author first or last name missing'))
            }
          }
          if (authors.length>=1)
          {
            await BookService.create( new Book({
              title, description, publisher, authors , ISBN, publishedDate, category, status
            }))
              .then(book => {
                /* istanbul ignore else */
                if (book) {
                  response.json(book)
                }
              })
              .catch((error) => {
                next(new InternalServerError(`${error}`))
              })
          } else {
            next( new BadRequestError('At least one author is required'))
          }

        } else {
          next ( new BadRequestError('Author details are required'))
        }


      } else {
        //TODO create in apiError class
        response.statusMessage = 'Conflict'
        response.statusCode = 409
        response.end()
      }
    }
  } catch (error) {
    // TODO Mock and throw error
    /* istanbul ignore next */
    next( new InternalServerError(`${error}`))
  }
}

export const updateBook = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    await BookService.update(request.body)
      .then(updatedBook => {
        response.statusCode = 201
        response.json(updatedBook)
      })
      .catch((error) => {
        next(new InternalServerError(`${error}`))
      })
    // TODO Mock .Update and throw error
    /* istanbul ignore next */
  } catch ( error ) {
    // TODO Proper error handling
    /* istanbul ignore next */
    next( new InternalServerError(`${error}`))
  }
}

// Delete Book
export const deleteBook = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    if (request.body.id) {
      await BookService.deleteBook(request.body.id)
        .then( book => {
          if (book){
            response.statusMessage = `Deleted ${book.id} successfully`
            response.statusCode = 204
            response.end()
          } else {
            response.statusMessage = 'Book not found'
            response.statusCode = 404
            response.end()
          }
        })
        // TODO Mock .delete and throw error
        /* istanbul ignore next */
        .catch(
          /* istanbul ignore next */
          error => {
          /* istanbul ignore next */
          next(new InternalServerError(`${error}`))
        })
    } else {
      next(new BadRequestError('Book id missing'))
    }
  }
  // TODO Mock .delete and throw error
    /* istanbul ignore next */
  catch ( error ) {
    // TODO Proper error handling
    /* istanbul ignore next */
    next( new InternalServerError(`${error}`))
  }
}

export const checkoutBook = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    if (request.body.userId && request.body.bookId) {
      await BookService.lendBook(request.body.userId, request.body.bookId)
        .then( book =>{
          /* istanbul ignore else */
          // TODO Mock BookService Book.findById and throw error
          if ( book ){
            response.json(book)
          } else {
            next( new InternalServerError('some thing wrong') )
          }
        })
    } else {
      next ( new BadRequestError('Book id missing'))
    }
  } catch ( error ) {
    // TODO Proper error handling
    next( new InternalServerError(`${error}`))
  }
}

export const returnBook = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    console.log(`bookId: ${request.body.userId} , userId: ${request.body.bookId} and userRole: ${request.body.userRole}`)
    // fixme following if statement does not work even all three parameters are present.
    // if (request.body.userId && request.body.bookId && request.body.userRole as string) {
    if (request.body.userId && request.body.bookId ) {
      console.log(`bookId: ${request.body.userId} , userId: ${request.body.bookId} and userRole: ${request.body.userRole}`)
      await BookService.returnBook(request.body.userId, request.body.bookId, request.body.userRole)
        .then( book =>{
          /* istanbul ignore else */
          // TODO Mock BookService Book.findById and throw error
          if ( book ){
            response.json(book)
          } else {
            next( new InternalServerError('some thing wrong') )
          }
        })
    } else {
      next ( new BadRequestError('Book id missing'))
    }
  } catch ( error ) {
    // TODO Proper error handling
    next( new InternalServerError(`${error}`))
  }
}
