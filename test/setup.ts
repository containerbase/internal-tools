import nock from 'nock';

jest.mock('got');
jest.mock('@actions/core');
jest.mock('@actions/github');
jest.mock('../src/utils/logger');

beforeAll(() => {
  nock.disableNetConnect();
});

afterAll(() => {
  jest.clearAllMocks();
  nock.enableNetConnect();
});
