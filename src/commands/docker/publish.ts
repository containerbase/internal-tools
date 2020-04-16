import { getInput } from '@actions/core';
import { isDryRun } from '../../util';
import { publish } from '../../utils/docker';
import log from '../../utils/logger';

export const MultiArgsSplitRe = /\s*(?:;|$)\s*/;
export async function run(): Promise<void> {
  const dryRun = isDryRun();
  let image = getInput('image', { required: true });
  let tags = getInput('tags')?.split(MultiArgsSplitRe).filter(Boolean);

  if (!tags?.length) {
    tags = ['latest'];
  }

  if (!image) {
    throw new Error('Missing image');
  }

  // istanbul ignore if
  if (image.startsWith('renovate/')) {
    log.warn('Image prefix can be removed:', image);
    image = image.substring(9);
  }

  for (const tag of tags) {
    await publish({ image, tag, dryRun });
  }
}
