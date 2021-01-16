import Book, { BookDocument } from '../models/Book'
import AuthorService from '../services/author'
import Author, {AuthorDocument} from '../models/Author'
import BookStatus from '../models/BookStatus'
import Roles from '../models/roles'

// TODO query parameters
// /api/v1/books?page=45&pageSize=67&title=author&author=title&status=AVAILABLE&category=COOKING
/* istanbul ignore next */
function findAll(): Promise<BookDocument[]> {
  return Book.find()
    .sort({ status: 1 })
    .exec()
}

function findByISBN( bookISBN: string): Promise<BookDocument | null>{
  if ( !bookISBN ) {
    throw new Error('Book ISBN is missing')
  } else {
    return Book.findOne({ISBN: bookISBN})
      .exec()
  }
}

function create ( book: BookDocument): Promise<BookDocument>{
  return book.save()
}

function update(
  update: Partial<BookDocument>
): Promise<BookDocument> {
  if ( !update.id ){
    throw new Error('Book id is missing')
  } else {
    const bookId = update.id
    return Book.findById(bookId)
      .exec()
      .then(async book => {
        if (!book) {
          throw new Error(`Book ${bookId} not found`)
        } else {
          //TODO not possible borrowId present and status BORROWED
          //TODO Return date can not be earlier then borrowed data.
          update.title ? book.title = update.title : null
          update.description ? book.description = update.description : null
          update.publisher ? book.publisher = update.publisher : null
          update.ISBN ? book.ISBN = update.ISBN : null
          update.publishedDate ? book.publishedDate = update.publishedDate : null
          update.borrowerId ? book.borrowerId = update.borrowerId : null
          update.borrowedDate ? book.borrowedDate = update.borrowedDate : null
          update.returnDate ? book.returnDate = update.returnDate : null
          update.category ? book.category = update.category : null
          update.status ? book.status = update.status : null

          const updatedAuthors: Array<AuthorDocument> = []
          /* istanbul ignore else */
          if (update.authors) {
            for (const author of update.authors) {
              /* istanbul ignore else */
              if (!(Object.keys(author).length === 0) && (author.constructor === Object)) {
                if (!author.firstName || !author.lastName) {
                  throw new Error('Author First name or Last name are missing during update')
                } else {
                  if (!author.id) {
                    const firstName = author.firstName
                    const lastName = author.lastName
                    if (await AuthorService.isAuthorExist(firstName, lastName)) {
                      throw new Error('Author already exists')
                    } else {
                      await AuthorService.create(new Author({firstName, lastName}))
                        .then(newAuthor => {
                          updatedAuthors.push(newAuthor)
                        })
                    }
                  } else {
                    await AuthorService.update(author as unknown as Partial<AuthorDocument>)
                      .then(updatedAuthor => {
                        updatedAuthors.push(updatedAuthor)
                      })
                  }
                }
              }
            }
          }
          book.authors.splice(0, book.authors.length)
          book.authors.push(...updatedAuthors)
          return book.save()
        }
      })
  }
}


function deleteBook( bookId: string): Promise<BookDocument | null>{
  return Book.findByIdAndDelete( bookId ).exec()
}

function lendBook( userId: string, bookId: string): Promise<BookDocument>{
  return Book.findById(bookId)
    .exec()
    .then( book => {
      if (!book) {
        throw new Error(`Book ${bookId} not found`)
      } else {
        if ( book.status === BookStatus.BORROWED){
          throw  new Error('Book already borrowed')
        } else {
          book.borrowerId = userId
          book.borrowedDate = new Date()
          book.status = BookStatus.BORROWED
        }
      }
      return book.save()
    })
}

// if ( mongoose.Types.ObjectId.isValid(bookId)  )
// FIXME, Fix error code
function returnBook( userId: string, bookId: string, userRole: number): Promise<BookDocument>{
  return Book.findById(bookId)
    .exec()
    .then( book => {
      if (!book) {
        throw new Error(`Book ${bookId} not found`)
      } else {
        if ( userId === book.borrowerId ){
          book.borrowerId = '000000000000000000000000'
          book.borrowedDate = '' as unknown as Date
          book.status = BookStatus.AVAILABLE
        } else if ( userRole === Roles.ADMIN ) {
          book.borrowerId = '000000000000000000000000'
          book.borrowedDate = '' as unknown as Date
          book.status = BookStatus.AVAILABLE
        } else {
          throw new Error('No rights to return this book')
        }
      }
      return book.save()
    })
}

export default {
  create,
  findByISBN,
  findAll,
  update,
  deleteBook,
  lendBook,
  returnBook,
}