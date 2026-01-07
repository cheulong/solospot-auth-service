import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      // Replace 'any' with your specific User/Account interface if you have one
      account?: any; 
    }
  }
}