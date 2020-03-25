jest.mock('got');
jest.mock('@actions/core');
jest.mock('@actions/github');
jest.mock('../src/utils/logger');

afterAll(() => {
  jest.clearAllMocks();
});
