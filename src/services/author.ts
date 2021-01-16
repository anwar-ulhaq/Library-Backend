import Author, { AuthorDocument } from '../models/Author'
import {BadRequestError} from '../helpers/apiError'

function create( author: AuthorDocument ): Promise<AuthorDocument> {
  return author.save()
}

function findById( authorId: string): Promise<AuthorDocument> {
  return Author.findById(authorId)
    .exec()
    .then( author => {
      if (!author) {
        throw new Error(`Author ${authorId} not found`)
      }
      return author
    })
}

function findAll(): Promise<AuthorDocument[]> {
  return Author.find()
    .sort({ firstName: 1, lastName: -1 })
    .exec()
}

function update(
  update: Partial<AuthorDocument>
): Promise<AuthorDocument> {
  if ( !update.id ){
    throw new BadRequestError('Author id is missing')
  } else {
    const authorId = update.id
    return Author.findById(authorId)
      .exec()
      .then( author => {
        if (!author) {
          throw new Error(`Author ${authorId} not found`)
        } else {
          update.firstName ? author.firstName = update.firstName : null
          update.lastName ? author.lastName = update.lastName : null
          return author.save()
        }
      })
  }
}

function deleteAuthor(authorId: string): Promise<AuthorDocument | null> {
  return Author.findByIdAndDelete(authorId).exec()
}

//TODO rename isAuthorExist to findByFirstNameAndLastName
function isAuthorExist(firstName: string, lastName: string ): Promise<AuthorDocument | null> {
   return Author.findOne({firstName: firstName, lastName: lastName })
     .exec()
}

export default {
  create,
  findById,
  findAll,
  update,
  deleteAuthor,
  isAuthorExist,
}
