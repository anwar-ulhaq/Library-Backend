import mongoose, {Document, Mongoose, MongooseDocument} from 'mongoose'
import {Person} from './Person'
import bcrypt from 'bcrypt'

import { SALT_WORK_FACTOR } from '../util/secrets'

export type UserDocument = Person & Document & {
  username: string;
  email: string;
  password: string;
  verifyPassword(passwordToVerify: string): Promise<boolean>;
  //TODO Fix function type
  role: number;
}



const userSchema = new mongoose.Schema({
  firstName: { type: String, required: [true, 'First name required'] },
  lastName: { type: String, required: [true, 'Last name required'] },
  username: { type: String, required: [true, 'User name required'], unique: true },
  email : {
    type: String,
    required: [true, 'email required'],
    unique: true,
    // FIXME validator. Not working
    //validate: [ isEmail, 'Email address not valid' ],
    //match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email address not valid'],
  },
  password: { type: String, required: true},
  role: {type: Number, required: true, min: 0, max: 5},
})

userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id
    delete ret.password
  }
})

// TODO move this to Util folder after fixing email validation
const isEmail = (eMail: string): Promise<boolean>=>  {
  const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/ // TODO might need to fix regex
  return new Promise<boolean>(()=>{
    regex.test(eMail)
  })
}

// Pre save hook. To encrypt password.
// findByIdAndUpdate and findOneAndUpdate will bypass it
// Pre and post save() hooks are not executed on update(), findOneAndUpdate()
userSchema.pre<UserDocument>('save', async function save(next) {
  if (!this.isModified('password')) return next()
  try {
    const salt = await bcrypt.genSalt(SALT_WORK_FACTOR)
    this.password = await bcrypt.hash(this.password, salt)
    return next()
  } catch (err) {
    return next(err)
  }
})

userSchema.methods.verifyPassword =  async function (passwordToVerify: string ): Promise<boolean> {
  const password = this.password
  return await bcrypt.compare(passwordToVerify, password)
}

export default mongoose.model<UserDocument>('User', userSchema)
