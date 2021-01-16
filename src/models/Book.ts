import mongoose, {Document, Mongoose, MongooseDocument, Schema} from 'mongoose'

import Author, {AuthorDocument} from './Author'
import BookStatus from './BookStatus'
import BookCategory from './BookCategory'

export type BookDocument = Document & {
  title:	string;
  description:	string;
  publisher:	string;
  ISBN:	string;
  publishedDate: Date;
  borrowerId:	string;
  borrowedDate:	Date;
  returnDate:	Date;
  authors: [ AuthorDocument ];
  category: string;
  status:  string;
}

const bookSchema = new mongoose.Schema({
  title:	{ type: String, required: [true, 'Book title required'] },
  description:	{ type: String, required: [true, 'Book description required'] },
  publisher:	{ type: String, required: [true, 'Book\'s publisher required'] },
  ISBN:	{ type: String, required: [true, 'ISBN required'] },
  publishedDate: { type: Date, required: [true, 'Published date required'] },
  borrowerId:	{ type: String, },
  borrowedDate:	Date,
  returnDate:	Date,
  authors: { type: [ typeof Author ], require: [true, 'Author required']},
  //TODO Create a separate schema so that Book categories can be added dynamically
  category: { type: String, default:BookCategory.NOT_DEFINE.toString(), required: [true, 'Category required'], enum: Object.values(BookCategory) },
  status:  { type: String, default:BookStatus.AVAILABLE.toString(), required: [true, 'Status required'], enum: Object.values(BookStatus) },
})

bookSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id
  }
})

export default mongoose.model<BookDocument>('Book', bookSchema)
