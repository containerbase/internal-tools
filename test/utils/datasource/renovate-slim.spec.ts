import { getName, mocked } from '../../utils';
import * as _datasources from 'renovate/dist/datasource';
import { getReleases } from '../../../src/utils/datasource/renovate-slim';

jest.mock('renovate/dist/datasource');
const datasources = mocked(_datasources);

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
});
