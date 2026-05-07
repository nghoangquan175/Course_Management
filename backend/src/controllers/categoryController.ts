import { Request, Response, NextFunction } from 'express';
import Category from '../models/Category';

export const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    const category = await Category.create({ name });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};
