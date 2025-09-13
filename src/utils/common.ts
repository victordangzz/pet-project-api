import { Request } from 'express'
import HTTP_STATUS_CODE from '../constants/httpStatusCode'
import { USER_MESSAGE } from '../constants/messages'
import { ErrorsWithStatus } from '../models/Error'
import { verifyToken } from './jwt'
import { JsonWebTokenError } from 'jsonwebtoken'
import { capitalize } from 'lodash'

type NumberEnumType = {
  [key: string]: string | number
}

export const numberEnumToArray = (numberEnum: NumberEnumType) => {
  return Object.values(numberEnum).filter((value) => typeof value === 'number') as number[]
}

export const verifyAccessToken = async (access_token: string, req?: Request) => {
  try {
    if (!access_token) {
      throw new ErrorsWithStatus({
        message: USER_MESSAGE.ACCESS_TOKEN_IS_REQUIRED,
        status: HTTP_STATUS_CODE.UNAUTHORIZED
      })
    }
    const decode_authorization = await verifyToken({
      token: access_token,
      secretOrPublicKey: process.env.ACCESS_TOKEN_SECRET as string
    })
    if (req) {
      ;(req as Request).decode_authorization = decode_authorization
      return true
    }
    return decode_authorization
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      throw new ErrorsWithStatus({
        message: capitalize(error.message),
        status: HTTP_STATUS_CODE.UNAUTHORIZED
      })
    }
    throw error
  }
}
