import userService from "../services/userService.js";

export const addUser = async (req, res, next) => {
  try {
    const newUser = await userService.addUser(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};