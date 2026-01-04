export const notFound = (req: any, res: any, next: any) => {
  const error = new Error("Route not found");
  (error as any).status = 404;
  next(error);
};
