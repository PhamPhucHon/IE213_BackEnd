const createThenable = (result) => ({
  then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  catch: (reject) => Promise.resolve(result).catch(reject),
});

const createQueryMock = (result) => {
  const chain = {
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    session: jest.fn().mockReturnThis(),
    setOptions: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(result),
    ...createThenable(result),
  };

  return chain;
};

const createSessionMock = () => ({
  startTransaction: jest.fn(),
  commitTransaction: jest.fn().mockResolvedValue(undefined),
  abortTransaction: jest.fn().mockResolvedValue(undefined),
  endSession: jest.fn(),
});

module.exports = {
  createQueryMock,
  createSessionMock,
};