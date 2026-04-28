import { context, getOctokit } from '@actions/github';
import { DateTime } from 'luxon';

if (!process.env['GITHUB_TOKEN']) {
  throw new Error('GITHUB_TOKEN is required');
}

const packageType = 'container';
const packageName = 'docker-build-cache';

const api = getOctokit(process.env['GITHUB_TOKEN']);

const versions = api.paginate.iterator(
  api.rest.packages.listPackagesForOrganization,
  {
    package_type: packageType,
    package_name: packageName,
    org: context.repo.owner,
    per_page: 100,
  },
);

let page = 0;
let deleted = 0;

const before = DateTime.utc().minus({ days: 30 });

try {
  for await (const { data } of versions) {
    for (const version of data) {
      const updatedAt = DateTime.fromISO(version.updated_at);
      if (updatedAt < before) {
        console.log(
          `Deleting version ${version.name} (${version.id}) updated at ${version.updated_at}`,
        );
        await api.rest.packages.deletePackageVersionForOrg({
          package_type: packageType,
          package_name: packageName,
          org: context.repo.owner,
          package_version_id: version.id,
        });
        deleted++;
      } else {
        console.log(
          `Keeping version ${version.name} (${version.id}) updated at ${version.updated_at}`,
        );
      }
    }

    if (page++ >= 100) {
      break;
    }
  }
} catch (error) {
  console.error('Error while deleting package versions:', error);
}

console.log(`Deleted ${deleted} versions.`);
