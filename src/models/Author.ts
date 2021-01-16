import mongoose, {Document, Mongoose, MongooseDocument} from 'mongoose'

import {Person} from './Person'

export type AuthorDocument = Person & Document & {
  firstName: string;
  lastName: string;
}

const authorSchema = new mongoose.Schema({
  firstName: { type: String, required: [true, 'First name required'] }, // required: true
  lastName: { type: String, required: [true, 'Last name required'] }, // required: true
})

authorSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id
    }
})

export default mongoose.model<AuthorDocument>('Author', authorSchema)
