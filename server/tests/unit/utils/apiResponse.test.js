const {
  createdResponse,
  errorResponse,
  forbiddenResponse,
  noContentResponse,
  notFoundResponse,
  paginatedResponse,
  successResponse,
  validationErrorResponse,
} = require('../../../utils/apiResponse');

const createResponseMock = () => {
  const res = {
    req: { headers: {} },
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
  };

  return res;
};

describe('apiResponse helpers', () => {
  it('formats successful responses consistently', () => {
    const res = createResponseMock();

    successResponse(res, 201, 'Created', { id: 1 }, { Location: '/items/1' }, { total: 1 });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.setHeader).toHaveBeenCalledWith('Location', '/items/1');
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Created',
        data: { id: 1 },
        meta: expect.objectContaining({ total: 1, timestamp: expect.any(String) }),
      })
    );
  });

  it('formats error responses consistently', () => {
    const res = createResponseMock();

    errorResponse(res, 422, 'Validation failed', [{ field: 'email', message: 'Email là bắt buộc' }]);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'email', message: 'Email là bắt buộc' }],
        meta: expect.objectContaining({ timestamp: expect.any(String) }),
      })
    );
  });

  it('formats paginated responses with pagination metadata', () => {
    const res = createResponseMock();

    paginatedResponse(res, [{ id: 1 }], 25, 2, 10, 'Paginated');

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'Paginated',
        data: [{ id: 1 }],
        meta: expect.objectContaining({
          pagination: expect.objectContaining({ total: 25, page: 2, totalPages: 3, hasNext: true }),
        }),
      })
    );
  });

  it('supports created responses with a Location header', () => {
    const res = createResponseMock();

    createdResponse(res, { id: 2 }, 'Created resource', '/items/2');

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.setHeader).toHaveBeenCalledWith('Location', '/items/2');
  });

  it('supports no-content responses', () => {
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

    noContentResponse(res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('formats validation and shortcut error responses', () => {
    const validationRes = createResponseMock();
    const notFoundRes = createResponseMock();
    const forbiddenRes = createResponseMock();

    validationErrorResponse(validationRes, [{ field: 'email', message: 'Required' }], 'Invalid data');
    notFoundResponse(notFoundRes, 'Missing');
    forbiddenResponse(forbiddenRes, 'Forbidden');

    expect(validationRes.status).toHaveBeenCalledWith(422);
    expect(notFoundRes.status).toHaveBeenCalledWith(404);
    expect(forbiddenRes.status).toHaveBeenCalledWith(403);
  });

  it('normalizes string and Error inputs in error responses', () => {
    const stringRes = createResponseMock();
    const errorRes = createResponseMock();

    errorResponse(stringRes, 400, 'String error', 'just-a-string');
    errorResponse(errorRes, 500, 'Thrown error', new Error('boom'));

    expect(stringRes.json).toHaveBeenCalledWith(expect.objectContaining({
      errors: [{ message: 'just-a-string' }],
    }));
    expect(errorRes.json).toHaveBeenCalledWith(expect.objectContaining({
      errors: [{ message: 'boom' }],
    }));
  });
});