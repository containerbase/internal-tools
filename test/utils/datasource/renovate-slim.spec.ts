import { getName, mocked } from '../../utils';
import * as _datasources from 'renovate/dist/datasource';
import { getReleases } from '../../../src/utils/datasource/renovate-slim';
import * as _utils from '../../../src/util';

jest.mock('renovate/dist/datasource');
jest.mock('../../../src/util');
const datasources = mocked(_datasources);
const utils = mocked(_utils);

describe(getName(__filename), () => {
  const logger = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = logger;
    console.dir = logger;
  });

  it('works', async () => {
    datasources.getPkgReleases.mockResolvedValueOnce(null);

    expect(await getReleases({ lookupName: '' })).toEqual(null);
  });

  it('filters releases', async () => {
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [
        { version: '1.0.0' },
        { version: '1.0.a-slim' },
        { version: '1.1.0' },
        { version: '1.0-slim' },
        { version: '1.0.0-slim' },
        { version: '1.2.0-slim' },
      ],
    });

    expect(await getReleases({ lookupName: '' })).toEqual({
      releases: [{ version: '1.0.0' }, { version: '1.2.0' }],
    });
  });

  it('finds dockerfile', async () => {
    datasources.getPkgReleases.mockResolvedValueOnce({
      releases: [{ version: '1.0.0' }],
    });

    utils.readFile.mockResolvedValueOnce(
      'FROM renovate/renovate:19.222.1-slim'
    );

    expect(await getReleases({ lookupName: '' })).toEqual({
      latestVersion: '19.222.1',
      releases: [],
    });
  });
});
